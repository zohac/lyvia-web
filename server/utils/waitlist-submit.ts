/**
 * Logique décisionnelle du fallback sans JavaScript (`POST /waitlist-submit`).
 *
 * Extraite du handler Nitro pour être testable en exécutant réellement le code :
 * les champs autorisés et les cibles de redirection sont le contrat du chemin
 * no-JS, et une inversion de `received` / `error` y passerait autrement
 * inaperçue (le chemin JS, lui, continuerait de fonctionner).
 */

/** Liste blanche stricte : rien d'autre n'est relayé à l'API. */
export const WAITLIST_SUBMIT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'specialty',
  'activityStage',
  'mainBlocker',
  'discoverySource',
  'message'
] as const

export const WAITLIST_ERROR_REDIRECT = '/?access=error#waitlist'
export const WAITLIST_RECEIVED_REDIRECT = '/?access=received#waitlist'

/** Cible d'erreur portant le jeton de restitution des valeurs saisies. */
export function waitlistErrorRedirectWithReplay(token: string): string {
  return `/?access=error&r=${encodeURIComponent(token)}#waitlist`
}

/**
 * Ne conserve que les champs de la liste blanche, non vides, ébarbés.
 * Un `FormData` vide (cas d'un formulaire soumis sans aucun `name`) produit
 * donc `{}` — et l'API répond 422, ce que la page traduit en état d'erreur.
 */
export function pickWaitlistFields(form: FormData): Record<string, string> {
  const body: Record<string, string> = {}

  for (const field of WAITLIST_SUBMIT_FIELDS) {
    const value = form.get(field)
    if (typeof value === 'string' && value.trim().length > 0) {
      body[field] = value.trim()
    }
  }

  return body
}

/** Cible de redirection selon la réponse de l'API (303 dans tous les cas). */
export function waitlistRedirectFor(registered: boolean | undefined): string {
  return registered ? WAITLIST_RECEIVED_REDIRECT : WAITLIST_ERROR_REDIRECT
}
