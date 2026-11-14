/**
 * Résolution et transport de la `release` Sentry côté serveur (obs-3).
 *
 * ## Pourquoi un plugin NITRO, et pas un plugin Nuxt `app/plugins/*.server.ts`
 *
 * Les espaces authentifiés (`/client/**`, `/provider/**`, `/admin/**`) sont en
 * `ssr: false` (cf. `routeRules`). Nitro les sert avec son *SPA renderer* :
 * l'entrée serveur Nuxt n'est jamais exécutée, donc **aucun plugin
 * d'application ne tourne** et `runtimeConfig.public.release` resterait la
 * valeur par défaut `''`. Le SPA renderer lit en revanche
 * `useRuntimeConfig(event)` au moment de rendre le shell
 * (`@nuxt/nitro-server` → `build-files.mjs`, `getSPARenderer`). Un hook Nitro
 * `request`, exécuté avant tout renderer (SSR comme SPA), couvre donc les deux
 * cas avec un seul mécanisme.
 *
 * ## Ce que fait ce plugin
 *
 * 1. Résout la release **une fois par processus**, au démarrage, via le
 *    résolveur pur (`CONTAINER_VERSION` → `SOURCE_VERSION` → `unknown`).
 * 2. Émet le `warn` de repli une seule fois, et seulement si un DSN Sentry est
 *    configuré — comme la moitié API, qui logue après sa garde `SENTRY_DSN`
 *    pour ne pas bruiter les lancements locaux et les tests.
 * 3. Injecte la valeur dans `runtimeConfig.public.release` de **chaque
 *    requête** (la config runtime est un clone par requête), d'où elle est
 *    sérialisée dans `window.__NUXT__`.
 *
 * La clé `release` de `nuxt.config.ts` est réservée : la recopier à la main via
 * `NUXT_PUBLIC_RELEASE` serait écrasée ici, et c'est voulu — la release doit
 * suivre le déploiement sans intervention (AC-3).
 */
import { applyReleaseToPublicConfig } from '~/features/observability/release-transport'
import { resolveRelease, warnOnUnresolvedRelease } from '~/features/observability/resolve-release'

export default defineNitroPlugin((nitroApp) => {
  const resolved = resolveRelease(process.env as Record<string, string | undefined>)

  const publicConfig = useRuntimeConfig().public as Record<string, unknown> | undefined
  const dsn = publicConfig?.sentryDsn
  if (typeof dsn === 'string' && dsn.trim() !== '') {
    warnOnUnresolvedRelease(resolved)
  }

  nitroApp.hooks.hook('request', (event) => {
    const config = useRuntimeConfig(event)
    if (!applyReleaseToPublicConfig(config.public, resolved.release)) {
      console.warn('[observability] unable to inject the Sentry release into the runtime config of this request.')
    }
  })
})
