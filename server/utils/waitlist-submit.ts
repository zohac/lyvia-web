/**
 * Logique décisionnelle du fallback sans JavaScript (`POST /waitlist-submit`).
 *
 * Extraite du handler Nitro pour être testable en exécutant réellement le code :
 * les champs autorisés et les cibles de redirection sont le contrat du chemin
 * no-JS, et une inversion de `received` / `error` y passerait autrement
 * inaperçue (le chemin JS, lui, continuerait de fonctionner).
 */

import {
  pickWaitlistValue,
  WAITLIST_SUBMIT_FIELDS,
  type WaitlistAccessState
} from '#shared/utils/waitlist-submission'

export const WAITLIST_ERROR_REDIRECT = '/?access=error#waitlist'
export const WAITLIST_RECEIVED_REDIRECT = '/?access=received#waitlist'

export function waitlistRedirectForState(state: WaitlistAccessState): string {
  return `/?access=${state}#waitlist`
}

export function waitlistStateRedirectWithReplay(state: WaitlistAccessState, token: string): string {
  return `/?access=${state}&r=${encodeURIComponent(token)}#waitlist`
}

/**
 * Ne conserve que les champs de la liste blanche, non vides, ébarbés.
 *
 * Les champs sont lus **un par un** dans le `FormData` : `form.get()` rend
 * la première valeur d'un nom répétée, et la liste blanche n'est jamais
 * materialisée au-delà de ce qu'elle autorise. Un `FormData` vide (cas d'un
 * formulaire soumis sans aucun `name`) produit donc `{}` — et l'API répond
 * 422, ce que la page traduit en état d'erreur.
 */
export function pickWaitlistFields(form: FormData): Record<string, string> {
  const body: Record<string, string> = {}
  for (const field of WAITLIST_SUBMIT_FIELDS) {
    const value = pickWaitlistValue(form.get(field))
    if (value !== undefined) body[field] = value
  }
  return body
}

/** Cible de redirection selon la réponse de l'API (303 dans tous les cas). */
export function waitlistRedirectFor(registered: boolean | undefined): string {
  return registered ? WAITLIST_RECEIVED_REDIRECT : WAITLIST_ERROR_REDIRECT
}
