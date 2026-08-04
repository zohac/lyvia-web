import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderAccountResponse } from '../account/api/provider-account.contract'
import {
  createFeatureGate,
  createInitialFeatureGateState,
  type FeatureGateState
} from './createFeatureGate'

/**
 * Story 18.2 — Wrapper Nuxt de `createFeatureGate` (≤ 10 lignes de logique).
 *
 * Fetch autonome et session-cached : `useProviderAccount()` n'est PAS un
 * singleton (`ref()` interne, piège documenté dans `coach-page.vue`) — le
 * réutiliser doublerait les requêtes à chaque page. Coût réel : un `GET
 * /provider/account` par session.
 *
 * `app/features/**` n'est pas auto-importé : les composants importent
 * explicitement `useFeatureGate` depuis ce fichier.
 */

type NuxtAppWithFeatureGate = ReturnType<typeof useNuxtApp> & {
  __lyvia_feature_gate__?: Promise<void> | null
}

export function useFeatureGate() {
  const state = useState<FeatureGateState>(
    'plans.feature-gate',
    createInitialFeatureGateState
  )

  return createFeatureGate({
    state,
    fetchAccount: async () => {
      const account = await apiFetch<ProviderAccountResponse>('/provider/account')
      return { plan: account.plan, enabledFeatures: account.enabledFeatures }
    },
    runExclusive: (task) => {
      // Le SSR est désactivé sur `/provider/**`, mais la garde protège d'un
      // appel serveur accidentel (aucun token en mémoire côté serveur → 401).
      if (import.meta.server) return Promise.resolve()

      const nuxtApp = useNuxtApp() as NuxtAppWithFeatureGate
      const existing = nuxtApp.__lyvia_feature_gate__
      if (existing) return existing

      const promise = task().finally(() => {
        nuxtApp.__lyvia_feature_gate__ = null
      })
      nuxtApp.__lyvia_feature_gate__ = promise
      return promise
    }
  })
}
