import type { ConsentValue } from '~/features/consent/consent-logic'

/**
 * LB.3 — Événements marketing minimaux de la landing B2B.
 *
 * Décisions 2026-09-19 (doc `decisions_landing_B2B_Keova.md`, §23) : très peu
 * d'événements, aucun heatmap / session replay / scroll tracking / fingerprint.
 * Aucune PII, aucune persistance navigateur.
 *
 * Module pur pour être testable hors runtime Nuxt (convention C5).
 */

export const LANDING_EVENTS = {
  landingView: 'landing_view',
  accessCtaClick: 'access_cta_click',
  accessFormStart: 'access_form_start',
  accessRequestSuccess: 'access_request_success',
  proofSophieClick: 'proof_sophie_click',
  loginClick: 'login_click'
} as const

export type LandingEventName = typeof LANDING_EVENTS[keyof typeof LANDING_EVENTS]

export type AccessCtaZone = 'hero' | 'mid_page' | 'pricing' | 'footer'

/** Propriétés autorisées par événement — liste blanche stricte, pas de PII. */
const ALLOWED_PROPS: Record<LandingEventName, readonly string[]> = {
  landing_view: [],
  access_cta_click: ['zone'],
  access_form_start: [],
  access_request_success: [],
  proof_sophie_click: [],
  login_click: []
}

/**
 * Le tracking n'est autorisé qu'après un choix explicite d'accepter.
 *
 * Seul `all` (la visiteuse a accepté via le bandeau) ouvre le tracking. En
 * particulier, `acknowledged` — posé par le clic « Compris » du bandeau
 * informatif servi sur les domaines sans Google Ads — NE suffit PAS : c'est un
 * accusé de lecture, pas un consentement à des événements marketing
 * (décision 22 du doc de décisions landing B2B).
 *
 * `null` = pas encore choisi, `essential` = cookies optionnels refusés.
 */
export function isLandingTrackingAllowed(consent: ConsentValue): boolean {
  return consent === 'all'
}

export function isLandingEventName(value: string): value is LandingEventName {
  return (Object.values(LANDING_EVENTS) as string[]).includes(value)
}

/**
 * Pousse un événement dans la couche de données — si et seulement si le
 * consentement l'autorise et si le nom d'événement est connu.
 *
 * La couche de données est injectée plutôt que lue depuis `window` : c'est ce
 * qui rend la garde de consentement testable en la faisant tourner pour de vrai
 * (et non en assertant le texte source du composable).
 *
 * @returns `true` si un push a effectivement eu lieu.
 */
export function pushLandingEvent(
  consent: ConsentValue,
  dataLayer: Array<Record<string, string>>,
  name: string,
  props?: Record<string, string>
): boolean {
  if (!isLandingTrackingAllowed(consent)) return false

  const payload = buildLandingEventPayload(name, props)
  if (!payload) return false

  dataLayer.push(payload)
  return true
}

export function isAccessCtaZone(value: string): value is AccessCtaZone {
  return value === 'hero' || value === 'mid_page' || value === 'pricing' || value === 'footer'
}

/**
 * Construit le payload de l'événement en filtrant toute propriété non whitelistée.
 * Retourne `null` si le nom d'événement est inconnu.
 */
export function buildLandingEventPayload(
  name: string,
  props?: Record<string, string>
): Record<string, string> | null {
  if (!isLandingEventName(name)) return null

  const allowed = ALLOWED_PROPS[name]
  const payload: Record<string, string> = { event: name }

  if (props) {
    for (const key of allowed) {
      const value = props[key]
      if (typeof value === 'string' && value.length > 0) {
        payload[key] = value
      }
    }
  }

  return payload
}
