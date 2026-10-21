import { defineEventHandler, getMethod, getQuery, getRequestURL, setResponseHeader } from 'h3'

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
  const query = getQuery(event)
  // Après routeRules : seuls les états personnels perdent le cache CDN.
  if (query.access !== undefined || query.r !== undefined) {
    setResponseHeader(event, 'cache-control', 'no-store')
  }
  const token = query.r
  if (typeof token !== 'string' || token.length === 0) return
  if (getRequestURL(event).pathname !== '/' || getMethod(event) !== 'GET') return

  const values = waitlistReplayStore.consume(token)
  if (values) event.context.waitlistReplay = values
})
