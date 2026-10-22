/**
 * Contrat commun aux deux clients du formulaire public.
 *
 * Le formulaire a deux clients : le chemin JavaScript (`WaitlistForm.vue`) et
 * le chemin sans JavaScript (`POST /waitlist-submit`). Ils doivent relayer les
 * mêmes champs, classer les mêmes échecs et afficher les mêmes messages —
 * sinon l'un des deux continue de fonctionner quand l'autre casse, sans que
 * personne ne le voie (le mode de panne exact de LB2-13).
 */

/**
 * Liste blanche des champs relayés à l'API, dans l'ordre du formulaire.
 *
 * Le champ `website` est le leurre anti-robot : il est relayé **pour que
 * l'API puisse le rejeter**, jamais pour qu'il soit stocké. Son absence ici
 * le supprimerait du corps avant l'appel API — le rejet n'aurait alors jamais
 * lieu, silencieusement.
 */
export const WAITLIST_SUBMIT_FIELDS = [
  'firstName', 'lastName', 'email', 'specialty', 'activityStage',
  'mainBlocker', 'discoverySource', 'message', 'website'
] as const

/**
 * Libellés verbatim de l'epic (AC-3), lus par l'alerte du rendu comme par le
 * toast du chemin JavaScript : les deux clients doivent dire la même chose.
 *
 * C'est aussi la **liste des états** : un état ajouté ici est rendu par les
 * deux clients sans qu'aucun d'eux ait à le connaître.
 */
export const WAITLIST_FAILURE_MESSAGES = {
  'error': 'Votre demande n’a pas pu être envoyée. Merci de vérifier les champs obligatoires puis de réessayer.',
  'rate-limited': 'Trop de tentatives. Réessayez plus tard.',
  'unavailable': 'Un problème technique a empêché l’envoi de votre demande. Vos informations restent pré-remplies ci-dessous — vous pouvez réessayer.'
} as const

export type WaitlistFailureState = keyof typeof WAITLIST_FAILURE_MESSAGES
export type WaitlistAccessState = 'received' | WaitlistFailureState

/**
 * Classe un statut HTTP en état d'échec nommé.
 *
 * `429` est imputable au débit, `5xx` et l'absence de réponse au système :
 * les deux sont donc distingués, pour que la visiteuse sache si l'échec est
 * de son côté ou du nôtre.
 */
export function waitlistAccessStateForStatus(status: number | undefined): WaitlistFailureState {
  if (status === 429) return 'rate-limited'
  // apiFetch représente une panne réseau par le statut 0 (pas une validation).
  if (status === undefined || status === 0 || status >= 500) return 'unavailable'
  return 'error'
}

/**
 * Traduit la valeur `?access=` en état d'échec.
 *
 * La liste des états vit ici, et nulle part ailleurs : un état ajouté au
 * contrat doit être rendu sans que le composant ait à le connaître. Une
 * valeur inconnue ou absente ne produit aucun état — le formulaire reste muet
 * plutôt que d'afficher un message qui ne correspond à aucun échec réel.
 */
export function waitlistFailureStateFromAccess(access: unknown): WaitlistFailureState | null {
  if (typeof access !== 'string') return null
  const states = Object.keys(WAITLIST_FAILURE_MESSAGES) as WaitlistFailureState[]
  return states.find(state => state === access) ?? null
}

/**
 * Extrait le statut HTTP d'une erreur de fetch.
 *
 * `ofetch` expose le même statut sous `status` et `statusCode` ; sans réponse
 * (panne réseau), les deux valent `undefined` — l'absence de statut est donc
 * un cas attendu, pas une erreur de lecture.
 */
export function waitlistErrorStatus(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object') return undefined
  const candidate = error as { statusCode?: unknown, status?: unknown }
  if (typeof candidate.statusCode === 'number') return candidate.statusCode
  if (typeof candidate.status === 'number') return candidate.status
  return undefined
}

/** Options de collecte des valeurs relayées. */
export interface WaitlistValuesOptions {
  /**
   * `true` pour les valeurs de restitution : le champ leurre n'y entre
   * jamais. Sa valeur est un prédicat de rejet, pas une donnée à restituer
   * ni à stocker.
   */
  replay?: boolean
}

/**
 * Règle de relayabilité d'une valeur : une chaîne non vide, ébarbée.
 *
 * C'est la règle unique partagée par les deux clients — le formulaire JS et
 * le fallback no-JS — pour que les mêmes champs partent dans les mêmes
 * conditions.
 */
export function pickWaitlistValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Ne conserve que les champs de la liste blanche, non vides, ébarbés.
 */
export function pickWaitlistValues(
  values: Record<string, unknown>,
  options: WaitlistValuesOptions = {}
): Record<string, string> {
  const body: Record<string, string> = {}
  for (const field of WAITLIST_SUBMIT_FIELDS) {
    if (options.replay && field === 'website') continue
    const value = pickWaitlistValue(values[field])
    if (value !== undefined) body[field] = value
  }
  return body
}
