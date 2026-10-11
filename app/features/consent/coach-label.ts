/**
 * Libellé `{coach}` des cases de consentement de contact — story cc-3.
 *
 * La case doit nommer le responsable de traitement, sans quoi le consentement
 * n'est pas éclairé (RGPD art. 7(1)) et c'est la provider qui est exposée sur
 * son domaine. La source est **la même** que celle déclarée dans la politique
 * de confidentialité sur domaine custom :
 *
 *   `app/pages/legal/confidentialite.vue:48`
 *   `isCustomDomain ? (tenant?.legalInfo?.companyName || tenant?.brand?.displayName) : 'Simon JOUAN EI (Keova)'`
 *
 * C'est cette correspondance qui rend le consentement éclairé : la case nomme
 * le même responsable que la politique du domaine concerné.
 *
 * Sur le domaine plateforme, l'AC 2 de la story impose le nom court `Keova` :
 * la politique y nomme la personne morale complète « Simon JOUAN EI (Keova) » —
 * même entité, dénomination plus longue. L'AC fait foi pour la case.
 *
 * Règle pure, testée seule (Convention 5) : le composant ne lit jamais le
 * tenant lui-même, il reçoit le libellé déjà résolu.
 */

export type ConsentCoachLabelInput = {
  mode: 'platform' | 'custom_domain' | null | undefined
  companyName?: string | null
  displayName?: string | null
}

/**
 * Repli explicite quand un domaine custom ne porte ni raison sociale ni nom
 * d'affichage : le libellé ne peut pas rester vide (« Je souhaite que  m'envoie… »).
 * Même formulation de repli que `confidentialite.vue:14` (`|| 'votre praticienne'`).
 */
export const CONSENT_COACH_LABEL_FALLBACK = 'votre praticienne'

/**
 * Résout la clause `{coach}` des libellés de consentement.
 *
 * - domaine custom : `companyName` (trim) s'il est renseigné, sinon `displayName`
 *   (trim), sinon {@link CONSENT_COACH_LABEL_FALLBACK} ;
 * - tout autre contexte (plateforme) : `'Keova'`.
 */
export function resolveConsentCoachLabel(input: ConsentCoachLabelInput): string {
  if (input.mode !== 'custom_domain') return 'Keova'

  const companyName = input.companyName?.trim()
  if (companyName) return companyName

  const displayName = input.displayName?.trim()
  if (displayName) return displayName

  return CONSENT_COACH_LABEL_FALLBACK
}

/** Une phrase de consentement, coupée autour du nom du responsable. */
export type ConsentLabelParts = { lead: string, tail: string }

/** Les deux phrases de consentement de contact, coupées autour de `{coach}`. */
export type ConsentLabels = { email: ConsentLabelParts, sms: ConsentLabelParts }

/**
 * Compose les deux libellés de consentement de contact (cc-3).
 *
 * Les phrases vivent **ici**, en un seul endroit, et non dupliquées dans le SFC :
 * elles peuvent donc être *exécutées* par un test — `renderConsentLabel`
 * reconstruit la phrase avec un nom donné et la compare au texte figé, ce qu'une
 * assertion sur le texte source ne fait pas (elle ne prouve qu'une sous-chaîne).
 * La coupe autour de `{coach}` existe pour que le template garde l'emphase de la
 * copy (`**{coach}**`) sans faire revenir la phrase dans le composant.
 *
 * `lead` se termine par une espace et `tail` en commence une : le template colle
 * directement `<strong>{{ coachLabel }}</strong>` entre les deux, sans espace
 * ajoutée — sinon la phrase porterait une double espace.
 */
export function buildConsentLabels(): ConsentLabels {
  return {
    email: {
      lead: 'Je souhaite que ',
      tail: ' m\'envoie par email des conseils bien-être et des actualités sur son accompagnement. Je peux retirer mon consentement à tout moment depuis le lien de retrait reçu par email, ou depuis mon compte client Keova une fois activé (optionnel).'
    },
    sms: {
      lead: 'Je souhaite que ',
      tail: ' m\'envoie par SMS des messages courts sur son accompagnement. Des frais peuvent être facturés par mon opérateur. Je peux retirer mon consentement à tout moment depuis le lien de retrait reçu par email (optionnel).'
    }
  }
}

/** Reconstruit la phrase complète, `{coach}` remplacé par `coachLabel`. */
export function renderConsentLabel(
  parts: ConsentLabelParts,
  coachLabel: string
): string {
  return `${parts.lead}${coachLabel}${parts.tail}`
}
