import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderAccountResponse } from '../account/api/provider-account.contract'
import {
  createFeatureGate,
  createInitialFeatureGateState,
  type FeatureGateState
} from './createFeatureGate'
import {
  createInFlightDeduper,
  NOOP_IN_FLIGHT_DEDUPER,
  type InFlightDeduper
} from './in-flight-deduper'

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
 *
 * 🚨 Story 18.2 (CR) — `useNuxtApp()` est appelé DANS LE CORPS, pas à chaque
 * `ensureLoaded()`. Appelé paresseusement, il levait « instance unavailable »
 * dès qu'`ensureLoaded()` partait d'un gestionnaire d'événement ou d'un
 * watcher (piège #4 des Dev Notes, celui-là même qui a mordu le toast) — et
 * comme `FeatureGate.vue` fait `void ensureLoaded()`, la rejection était
 * silencieuse. Ici, la contrainte de contexte est celle de `useState`, déjà
 * présente une ligne plus haut, et le gate rendu est utilisable partout.
 */

export const FEATURE_GATE_STATE_KEY = 'plans.feature-gate'

type NuxtAppWithFeatureGate = ReturnType<typeof useNuxtApp> & {
  __lyvia_feature_gate__?: InFlightDeduper
}

export function useFeatureGate() {
  const state = useState<FeatureGateState>(
    FEATURE_GATE_STATE_KEY,
    createInitialFeatureGateState
  )
  const nuxtApp = useNuxtApp() as NuxtAppWithFeatureGate
  nuxtApp.__lyvia_feature_gate__ ??= createInFlightDeduper()

  return createFeatureGate({
    state,
    dedupe: import.meta.server
      ? NOOP_IN_FLIGHT_DEDUPER
      : nuxtApp.__lyvia_feature_gate__,
    fetchAccount: async () => {
      const account = await apiFetch<ProviderAccountResponse>('/provider/account')
      return { plan: account.plan, enabledFeatures: account.enabledFeatures }
    }
  })
}
