import { defineEventHandler, getMethod, getQuery, getRequestURL, setResponseHeader } from 'h3'

import { waitlistReplayStore } from '../utils/waitlist-replay-store'

/**
 * Consomme le jeton de restitution (`?r=…`) posé par `POST /waitlist-submit`
 * quand une demande sans JavaScript a échoué, et l'expose au rendu SSR via
 * `event.context`. Le formulaire le lit avec `useRequestEvent()`.
 *
 * Le jeton est à usage unique : une seconde requête sur la même URL (rechargement)
 * n'obtient plus rien, et la page s'affiche simplement sans les valeurs.
 *
 * ---
 *
 * **Périmètre du garde `no-store` — contrat amendé (WA.7, C3).**
 *
 * Le garde couvre **toute réponse HTML** portant `?access=…` ou `?r=…` : ce
 * sont les seules réponses qui peuvent porter la restitution (donc de la PII).
 *
 * Il ne couvre **pas** les fichiers statiques de `public/`, et ce n'est pas un
 * oubli : en dev, le serveur Nitro les sert **avant** l'application h3 (le
 * gestionnaire de fichiers statiques est en amont des middlewares), et en
 * production le gestionnaire statique de Nitro est un middleware enregistré
 * **en tête** de la pile. Un point d'extension qui s'exécute après lui ne
 * peut donc plus poser l'en-tête de la réponse — et le réécrire est
 * explicitement interdit par la story.
 *
 * **L'écart est sans risque, et c'est ce qui autorise l'amendement** : le corps
 * servi est un asset public (aucune PII), et le jeton **n'est pas consommé**
 * hors du couple chemin `/` + méthode `GET` — il ne peut donc pas finir dans
 * un cache partagé sous une forme qui le rendrait rejouable.
 *
 * La décision écrite et sa trace sont dans
 * `docs/implementation-artifacts/epics/epic-wa/wa-1-7-observabilite-rejets.md`
 * (§ « C3 ») et dans `docs/implementation-artifacts/deferred-work.md`.
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
