/**
 * Story 18.2 — Copy du feature gating, source UNIQUE.
 *
 * Convention A31 : les textes UI définis dans les ACs sont des constantes. Les
 * tests vérifient ce wording mot pour mot — toute paraphrase dans un composant
 * est une régression, d'où l'interdiction de réécrire ces chaînes ailleurs.
 */

import { FEATURE_MIN_PLAN_LABEL, type PlanFeatureCode } from './feature-codes'

/**
 * Adresse de contact canonique (mentions légales, CGU, `CoachUnavailableTemplate`).
 *
 * ⚠️ Ne PAS utiliser `dpo@keova.fr`, réservé aux demandes RGPD.
 */
export const KEOVA_CONTACT_EMAIL = 'contact@keova.fr'

/** Lien `mailto:` prêt à poser dans un `href`. */
export const KEOVA_CONTACT_MAILTO = `mailto:${KEOVA_CONTACT_EMAIL}`

/**
 * Titre du toast global déclenché par un 403 `FEATURE_NOT_AVAILABLE`.
 *
 * ⚠️ Divergence volontaire avec le backend : le message API est en ASCII
 * (`Cette fonctionnalite necessite un plan superieur`) parce qu'il est relogué
 * en clair par le `HttpExceptionFilter`. La copy UI, elle, est accentuée.
 */
export const FEATURE_GATE_TOAST_TITLE = 'Cette fonctionnalité nécessite un plan supérieur'

/** Libellé du CTA, partagé par le toast et le panneau de verrouillage. */
export const FEATURE_GATE_CTA_LABEL = 'Contactez Keova'

/** Titre du panneau de verrouillage : « Disponible avec le plan Premium ». */
export function featureGateLockTitle(code: PlanFeatureCode): string {
  return `Disponible avec le plan ${FEATURE_MIN_PLAN_LABEL[code]}`
}
