import { defineEventHandler, getQuery } from 'h3'

import { waitlistReplayStore } from '../utils/waitlist-replay-store'

/**
 * Consomme le jeton de restitution (`?r=…`) posé par `POST /waitlist-submit`
 * quand une demande sans JavaScript a échoué, et l'expose au rendu SSR via
 * `event.context`. Le formulaire le lit avec `useRequestEvent()`.
 *
 * Le jeton est à usage unique : une seconde requête sur la même URL (rechargement)
 * n'obtient plus rien, et la page s'affiche simplement sans les valeurs.
 */
export default defineEventHandler((event) => {
  const token = getQuery(event).r
  if (typeof token !== 'string' || token.length === 0) return

  const values = waitlistReplayStore.consume(token)
  if (values) event.context.waitlistReplay = values
})
