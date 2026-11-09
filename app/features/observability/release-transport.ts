/**
 * Transport de la `release` Sentry entre le serveur et le navigateur (obs-3).
 *
 * Deux opérations, toutes deux pures et testables sans Nuxt ni SDK :
 *  - `applyReleaseToPublicConfig` : côté serveur, écrit la release résolue dans
 *    la config runtime *de la requête* (`runtimeConfig.public`), que Nitro
 *    sérialise ensuite dans `window.__NUXT__` — y compris pour les shells SPA
 *    des espaces `ssr: false`, qui ne rendent aucun plugin d'application ;
 *  - `normaliseBrowserRelease` : côté navigateur, transforme la valeur
 *    sérialisée en ce que le SDK reçoit réellement. Jamais une chaîne vide,
 *    jamais une forme qui ne peut pas être un SHA (version sémantique, date).
 *
 * AC-5 et D3 se jouent ici : c'est le dernier point où la valeur pourrait
 * devenir vide, être écrasée, ou perdre sa forme avant d'atteindre le SDK.
 */
import { UNKNOWN_RELEASE, isDeploymentShaShaped } from './resolve-release'

/**
 * Texte du `warn` émis une fois par session quand le navigateur ne reçoit pas
 * de release utilisable. Le repli est bruyant, jamais silencieux (D3) ; il est
 * distinct du log serveur, qui nomme les variables absentes.
 */
export const BROWSER_RELEASE_FALLBACK_WARNING
  = '[observability] Sentry release is unresolved (runtimeConfig.public.release): browser events will be tagged "unknown".'

/**
 * La valeur exacte donnée au SDK : une chaîne non vide dont la forme peut être
 * un SHA de déploiement, sinon `unknown`.
 *
 * La garde de forme est appliquée **de nouveau** ici, alors que le résolveur
 * l'a déjà fait côté serveur : la valeur traverse le HTML sérialisé, et une clé
 * `NUXT_PUBLIC_RELEASE` recopiée à la main ou une régression de transport ne
 * doit jamais faire porter une version sémantique au tag `release` (AC-5).
 */
export function normaliseBrowserRelease(value: unknown): string {
  if (typeof value !== 'string') return UNKNOWN_RELEASE
  const trimmed = value.trim()
  if (trimmed === '' || !isDeploymentShaShaped(trimmed)) return UNKNOWN_RELEASE
  return trimmed
}

/**
 * Écrit la release résolue dans la config runtime publique de la requête.
 * Renvoie `false` quand la cible n'est pas un objet (config absente), pour que
 * l'appelant puisse le signaler au lieu d'échouer en silence.
 */
export function applyReleaseToPublicConfig(target: unknown, release: string): boolean {
  if (target === null || typeof target !== 'object') return false
  ;(target as Record<string, unknown>).release = release
  return true
}
