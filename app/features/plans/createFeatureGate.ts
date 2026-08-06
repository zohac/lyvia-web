import { computed, type Ref } from 'vue'
import type { PlanFeatureCode } from './domain/feature-codes'
import { createInFlightDeduper, type InFlightDeduper } from './in-flight-deduper'

/**
 * Story 18.2 — Logique du feature gating, extraite de tout contexte Nuxt.
 *
 * Pattern `createCoachPageEditor` : la factory n'importe que `vue`, ce qui la
 * rend testable par le runner Node sans mocker `useState`/`useNuxtApp`. Le
 * wrapper `useFeatureGate()` est le seul à toucher aux auto-imports.
 */

export type FeatureGateStatus = 'unknown' | 'ready' | 'error'

export type FeatureGateState = {
  status: FeatureGateStatus
  plan: { slug: string, name: string } | null
  enabledFeatures: string[]
  /**
   * Story 18.2 (CR) — Jeton d'invalidation, porté par l'état PARTAGÉ.
   *
   * `useFeatureGate()` construit une instance de factory par appel : un
   * compteur en closure ne protégerait que l'instance qui a appelé
   * `invalidate()`. Logé dans l'état, il permet à un fetch en vol de constater
   * qu'il est périmé, quelle que soit l'instance qui l'a lancé.
   */
  generation: number
}

export function createInitialFeatureGateState(): FeatureGateState {
  return { status: 'unknown', plan: null, enabledFeatures: [], generation: 0 }
}

export type FeatureGateAccount = {
  plan: { slug: string, name: string } | null
  enabledFeatures: string[]
}

export interface CreateFeatureGateDependencies {
  /** `GET /provider/account` — un seul appel par session (cf. `dedupe`). */
  fetchAccount: () => Promise<FeatureGateAccount>
  /** État partagé (`useState` côté Nuxt, `ref` côté tests). */
  state: Ref<FeatureGateState>
  /**
   * Déduplication de la promesse en vol.
   *
   * Côté Nuxt, le wrapper injecte l'instance stockée sur `nuxtApp` : deux
   * `<FeatureGate>` montés dans le même tick ne déclenchent qu'UN `GET`.
   * Non fourni (tests purs), une instance locale de sémantique identique est
   * créée — c'est le MÊME code, pas un repli divergent.
   */
  dedupe?: InFlightDeduper
}

export function createFeatureGate(deps: CreateFeatureGateDependencies) {
  const { fetchAccount, state } = deps
  const dedupe = deps.dedupe ?? createInFlightDeduper()

  /**
   * Charge le plan une fois par session.
   *
   * Ne rejette jamais — une panne réseau met `status` à `'error'`, ce qui fait
   * rendre le panneau lock (deny par défaut) plutôt que d'exposer une section
   * premium.
   *
   * Story 18.2 (CR, décision Simon) — la sortie anticipée porte sur `'ready'`
   * seul, PAS sur « statut résolu » : un `'error'` transitoire (blip réseau,
   * 5xx, 401 terminal) était sinon définitif pour toute la session SPA, et une
   * coach Premium se voyait proposer de passer à Premium jusqu'au prochain F5.
   * Un remount ou un `invalidate()` retente désormais.
   *
   * ⚠️ Story 18.3b (CR) — cette sortie anticipée rend la RETENTATIVE possible,
   * elle ne la DÉCLENCHE pas : il faut un appelant. Deux existent, et un `error`
   * reste collant partout ailleurs — `FeatureGate.vue` (crochet `onMounted` sur
   * `'error'` ; son watcher, lui, ne couvre que `'unknown'`) et l'amorçage au
   * setup de `provider/coach-page.vue`. Tout nouveau consommateur du gate doit
   * prévoir son propre chemin de reprise.
   */
  async function ensureLoaded(): Promise<void> {
    if (state.value.status === 'ready') return

    await dedupe.run(async () => {
      // Re-check après attente : un autre appelant a pu résoudre entre-temps.
      if (state.value.status === 'ready') return

      const startedAt = state.value.generation

      try {
        const account = await fetchAccount()
        // Périmé : `invalidate()` (ou un logout) est passé pendant le vol.
        // Écrire ici réinstallerait silencieusement le plan pré-invalidation.
        if (state.value.generation !== startedAt) return
        state.value = {
          status: 'ready',
          plan: account.plan ?? null,
          enabledFeatures: [...(account.enabledFeatures ?? [])],
          generation: startedAt
        }
      } catch {
        if (state.value.generation !== startedAt) return
        state.value = {
          ...createInitialFeatureGateState(),
          status: 'error',
          generation: startedAt
        }
      }
    })
  }

  /**
   * `true` uniquement quand le plan est chargé ET porte la feature.
   *
   * Deny par défaut sur `'unknown'` et `'error'` : le composant distingue les
   * deux cas (`'unknown'` ne rend rien pour éviter le flash, `'error'` verrouille).
   */
  function hasFeature(code: PlanFeatureCode): boolean {
    if (state.value.status !== 'ready') return false
    return state.value.enabledFeatures.includes(code)
  }

  /**
   * Vide l'état : le prochain `ensureLoaded()` refetch (AC #6).
   *
   * Story 18.2 (CR) — libère AUSSI le créneau de déduplication et incrémente
   * la génération. Sans le premier, le prochain `ensureLoaded()` réattendrait
   * la promesse périmée au lieu d'en lancer une neuve ; sans la seconde, la
   * réponse de cette promesse écraserait l'invalidation.
   */
  function invalidate(): void {
    dedupe.reset()
    state.value = {
      ...createInitialFeatureGateState(),
      generation: state.value.generation + 1
    }
  }

  return {
    status: computed(() => state.value.status),
    currentPlan: computed(() => state.value.plan),
    hasFeature,
    ensureLoaded,
    invalidate
  }
}

export type FeatureGate = ReturnType<typeof createFeatureGate>
