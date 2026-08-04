/**
 * Story 18.2 (CR) — Déduplication de promesse en vol, extraite en module pur.
 *
 * Le mécanisme vivait inline dans `useFeatureGate()`, donc hors
 * `tsconfig.tests.json` (le wrapper touche `useState`/`useNuxtApp`) : les tests
 * n'exerçaient que le repli local de la factory, jamais le code réellement
 * embarqué. Isolé ici, il est testable ET partageable — `useFeatureGate()` en
 * stocke UNE instance sur `nuxtApp`, si bien que deux `<FeatureGate>` montés
 * dans le même tick ne produisent qu'un `GET /provider/account`.
 *
 * Pattern d'origine : `useAuth.bootstrap()` / `__lyvia_auth_bootstrap__`.
 */

export interface InFlightDeduper {
  /**
   * Exécute `task` si aucune n'est en vol, sinon rend la promesse courante.
   * Ne rejette que si `task` rejette — les appelants partagent le même sort.
   */
  run: (task: () => Promise<void>) => Promise<void>
  /**
   * Libère le créneau sans attendre la promesse courante : le prochain `run()`
   * repart sur une tâche neuve. Utilisé par `invalidate()` — sans lui, un
   * `ensureLoaded()` post-invalidation réattendrait la promesse périmée.
   */
  reset: () => void
}

export function createInFlightDeduper(): InFlightDeduper {
  let current: Promise<void> | null = null

  return {
    run(task: () => Promise<void>): Promise<void> {
      if (current) return current

      const promise = task().finally(() => {
        // Garde d'identité : après un `reset()` suivi d'un nouveau `run()`, la
        // promesse périmée ne doit pas effacer le créneau de sa remplaçante.
        if (current === promise) current = null
      })
      current = promise
      return promise
    },
    reset(): void {
      current = null
    }
  }
}

/**
 * Déduper inerte : `runExclusive` côté serveur ne doit rien déclencher.
 *
 * Le SSR est désactivé sur `/provider/**`, mais aucun token n'est en mémoire
 * côté serveur — un `GET /provider/account` accidentel y répondrait 401 et
 * verrouillerait le gate pour rien.
 */
export const NOOP_IN_FLIGHT_DEDUPER: InFlightDeduper = {
  run: () => Promise.resolve(),
  reset: () => {}
}
