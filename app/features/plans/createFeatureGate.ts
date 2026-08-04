import { computed, type Ref } from 'vue'
import type { PlanFeatureCode } from './domain/feature-codes'

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
}

export function createInitialFeatureGateState(): FeatureGateState {
  return { status: 'unknown', plan: null, enabledFeatures: [] }
}

export type FeatureGateAccount = {
  plan: { slug: string, name: string } | null
  enabledFeatures: string[]
}

export interface CreateFeatureGateDependencies {
  /** `GET /provider/account` — un seul appel par session (cf. `runExclusive`). */
  fetchAccount: () => Promise<FeatureGateAccount>
  /** État partagé (`useState` côté Nuxt, `ref` côté tests). */
  state: Ref<FeatureGateState>
  /**
   * Déduplication de la promesse en vol.
   *
   * Côté Nuxt, le wrapper stocke la promesse sur `nuxtApp.__lyvia_feature_gate__`
   * (pattern verbatim `useAuth.bootstrap()` / `__lyvia_auth_bootstrap__`) : deux
   * `<FeatureGate>` montés dans le même tick ne déclenchent qu'UN `GET`.
   *
   * Non fourni (tests purs) : une déduplication locale à la factory est
   * utilisée, de sémantique identique.
   */
  runExclusive?: (task: () => Promise<void>) => Promise<void>
}

export function createFeatureGate(deps: CreateFeatureGateDependencies) {
  const { fetchAccount, state } = deps

  let localInFlight: Promise<void> | null = null
  const runExclusive
    = deps.runExclusive
      ?? ((task: () => Promise<void>) => {
        if (localInFlight) return localInFlight
        const promise = task().finally(() => {
          localInFlight = null
        })
        localInFlight = promise
        return promise
      })

  /**
   * Charge le plan une fois par session.
   *
   * Idempotent : renvoie immédiatement si l'état est déjà résolu. Ne rejette
   * jamais — une panne réseau met `status` à `'error'`, ce qui fait rendre le
   * panneau lock (deny par défaut) plutôt que d'exposer une section premium.
   */
  async function ensureLoaded(): Promise<void> {
    if (state.value.status !== 'unknown') return

    await runExclusive(async () => {
      // Re-check après attente : un autre appelant a pu résoudre entre-temps.
      if (state.value.status !== 'unknown') return

      try {
        const account = await fetchAccount()
        state.value = {
          status: 'ready',
          plan: account.plan ?? null,
          enabledFeatures: [...(account.enabledFeatures ?? [])]
        }
      } catch {
        state.value = { ...createInitialFeatureGateState(), status: 'error' }
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

  /** Vide l'état : le prochain `ensureLoaded()` refetch (AC #6). */
  function invalidate(): void {
    state.value = createInitialFeatureGateState()
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
