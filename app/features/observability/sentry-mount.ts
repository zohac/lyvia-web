/**
 * Sentry browser SDK adapter.
 *
 * Initialisation happens exactly once per session, client-side only: the
 * plugin lazy-imports this module after mount, so the SDK never lands in the
 * landing's critical entry chunk and no Nitro/SSR code is instrumented.
 *
 * Everything the privacy contract depends on lives in `sentry-options.ts`
 * (pure, testable without the SDK). This file only resolves the DSN, the
 * tenant and the environment, then hands the options to the SDK.
 */

import * as Sentry from '@sentry/vue'

import { buildSentryOptions } from './sentry-options'
import { resolveTenantTag } from './sentry-tenant-tag'

declare const process: { env: Record<string, string | undefined> }

let initialized = false
let initializationFailed = false
let missingDsnWarned = false

/**
 * The DSN is declared in `runtimeConfig.public` (nuxt.config.ts). Reading
 * `process.env` here would not work: Vite replaces `process.env` with an empty
 * object in the browser bundle, so the deployment variable never reaches it.
 */
function readDsn(): string {
  try {
    const runtimeConfig = useRuntimeConfig()
    const value = (runtimeConfig?.public as Record<string, unknown> | undefined)?.sentryDsn
    return typeof value === 'string' ? value.trim() : ''
  } catch {
    return ''
  }
}

function readEnvironment(): string {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

/**
 * La release est résolue côté serveur (plugin Nitro, obs-3) à partir de
 * `CONTAINER_VERSION` → `SOURCE_VERSION` → `unknown`, puis injectée dans
 * `runtimeConfig.public.release`. Le navigateur ne fait que la lire : il n'a
 * pas accès à `process.env`. Une valeur vide (release non injectée) est
 * traitée comme `unknown` pour ne jamais envoyer une chaîne vide au SDK.
 */
function readRelease(): string {
  try {
    const runtimeConfig = useRuntimeConfig()
    const value = (runtimeConfig?.public as Record<string, unknown> | undefined)?.release
    if (typeof value !== 'string') return 'unknown'
    const trimmed = value.trim()
    return trimmed === '' ? 'unknown' : trimmed
  } catch {
    return 'unknown'
  }
}

export function mountSentry(app?: unknown): void {
  if (initialized || initializationFailed) return
  if (typeof window === 'undefined') return

  const dsn = readDsn()
  if (dsn === '') {
    // A dead channel must be visible, not silent.
    if (!missingDsnWarned) {
      missingDsnWarned = true
      console.warn('[observability] NUXT_PUBLIC_SENTRY_DSN is not configured: browser errors are not collected.')
    }
    return
  }

  const options = buildSentryOptions({
    dsn,
    release: readRelease(),
    tenant: resolveTenantTag(window.location.hostname),
    environment: readEnvironment(),
    integrations: app ? [Sentry.vueIntegration({ app: app as never })] : []
  })

  try {
    // The builder's option names are typed against `SentryClientOptions`, so a
    // mistyped option fails here; only the SDK's callback signatures differ.
    Sentry.init(options as unknown as Parameters<typeof Sentry.init>[0])
    initialized = true
  } catch {
    // A broken SDK must never break the page, and must not retry on every page.
    initializationFailed = true
    console.warn('[observability] Sentry initialisation failed: browser errors are not collected.')
  }
}
