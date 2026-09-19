import {
  COOKIE_CONSENT_NAME,
  type ConsentValue
} from '~/features/consent/consent-logic'
import {
  isLandingTrackingAllowed,
  pushLandingEvent
} from '~/features/marketing/landing-events'

type DataLayer = Array<Record<string, string>>

/**
 * LB.3 — Émission des événements marketing de la landing, post-consentement.
 *
 * - Aucun événement avant un choix explicite (`isLandingTrackingAllowed`).
 * - Aucune PII, aucune persistance navigateur.
 * - Push dans `window.dataLayer` si présent (GTM) ; sinon no-op silencieux.
 *
 * `trackOnce` existe parce que le consentement est donné APRÈS le montage pour
 * une première visite : un `track` déclenché dans `onMounted` (le cas de
 * `landing_view`) serait perdu à jamais. `trackOnce` met l'événement en attente
 * et le rattrape dès que le consentement devient favorable.
 */
export function useLandingAnalytics() {
  const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME, {
    default: () => null
  })

  const emitted = new Set<string>()
  const pending = new Map<string, Record<string, string> | undefined>()

  function resolveDataLayer(): DataLayer {
    const w = window as unknown as { dataLayer?: DataLayer }
    w.dataLayer = w.dataLayer || []
    return w.dataLayer
  }

  function track(name: string, props?: Record<string, string>): void {
    if (import.meta.server) return
    pushLandingEvent(consent.value, resolveDataLayer(), name, props)
  }

  if (import.meta.client) {
    watch(consent, () => {
      if (!isLandingTrackingAllowed(consent.value)) return
      for (const [name, props] of pending) {
        emitted.add(name)
        track(name, props)
      }
      pending.clear()
    })
  }

  function trackOnce(name: string, props?: Record<string, string>): void {
    if (import.meta.server) return
    if (emitted.has(name)) return

    if (isLandingTrackingAllowed(consent.value)) {
      emitted.add(name)
      track(name, props)
      return
    }

    pending.set(name, props)
  }

  return { track, trackOnce }
}
