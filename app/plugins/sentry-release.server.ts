/**
 * Résolution de la `release` Sentry côté serveur (obs-3).
 *
 * Lit `CONTAINER_VERSION` → `SOURCE_VERSION` au runtime (Scalingo), résout la
 * release via le résolveur pur, émet le `warn` de repli, et l'injecte dans
 * `runtimeConfig.public.release` pour qu'elle soit sérialisée vers le navigateur.
 * Plugin `.server` : n'exécute jamais côté client (où `process.env` est vide).
 */
import { resolveRelease, warnOnUnresolvedRelease } from '~/features/observability/resolve-release'

let resolvedOnce: ReturnType<typeof resolveRelease> | null = null
let warnedOnce = false

export default defineNuxtPlugin(() => {
  if (!import.meta.server) return

  if (resolvedOnce === null) {
    resolvedOnce = resolveRelease(process.env as Record<string, string | undefined>)
    if (!warnedOnce) {
      warnOnUnresolvedRelease(resolvedOnce)
      warnedOnce = true
    }
  }

  try {
    const config = useRuntimeConfig()
    if (config?.public && typeof config.public === 'object') {
      ;(config.public as Record<string, unknown>).release = resolvedOnce.release
    }
  } catch (error) {
    console.warn('[observability] unable to inject Sentry release into runtime config:', error)
  }
})
