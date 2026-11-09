/**
 * Pure builder for the Sentry client options.
 *
 * The options are the only place where the privacy contract is enforced
 * (`sendDefaultPii: false`, replay/tracing off, PII scrub in `beforeSend` and
 * `beforeBreadcrumb`, tenant tag). Keeping the builder free of any SDK import
 * is what makes that contract executable by a unit test — the SDK is only the
 * adapter that receives the object.
 */

import { IGNORE_ERRORS } from './sentry-ignore-errors'
import { scrubBreadcrumb, scrubEvent } from './sentry-scrub'

export type SentryEventLike = Record<string, unknown>
export type SentryBreadcrumbLike = Record<string, unknown>

export interface SentryClientOptions {
  dsn?: string
  /**
   * SHA du déploiement porté par l'événement (obs-3). Jamais une version
   * sémantique, jamais une date : `unknown` en repli explicite.
   */
  release?: string
  environment: string
  /** Never let the SDK attach cookies, headers or an IP. */
  sendDefaultPii: false
  /** Replay and tracing are non-goals of the spec: kept explicit at 0. */
  replaysSessionSampleRate: 0
  replaysOnErrorSampleRate: 0
  tracesSampleRate: 0
  ignoreErrors: Array<string | RegExp>
  /** `tags.tenant` carries the domain, never an identity (see D3). */
  initialScope: { tags: { tenant: string } }
  integrations?: unknown[]
  beforeSend: (event: SentryEventLike) => SentryEventLike | null
  beforeBreadcrumb: (breadcrumb: SentryBreadcrumbLike) => SentryBreadcrumbLike | null
}

export interface BuildSentryOptionsInput {
  dsn?: string
  /** SHA du déploiement (obs-3) — transmis tel quel au SDK. */
  release?: string
  /** Domain resolved from `location.hostname`, already format-validated. */
  tenant: string
  /** Deployment environment; defaults to `production`. */
  environment?: string
  /** SDK integrations supplied by the adapter (e.g. the Vue app handler). */
  integrations?: unknown[]
}

export function buildSentryOptions(input: BuildSentryOptionsInput): SentryClientOptions {
  return {
    dsn: input.dsn,
    release: input.release,
    environment: input.environment ?? 'production',
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    tracesSampleRate: 0,
    ignoreErrors: IGNORE_ERRORS,
    initialScope: { tags: { tenant: input.tenant } },
    integrations: input.integrations,
    beforeSend(event) {
      try {
        return scrubEvent(event)
      } catch {
        // An exception inside beforeSend drops the event without breaking the app.
        return null
      }
    },
    beforeBreadcrumb(breadcrumb) {
      try {
        return scrubBreadcrumb(breadcrumb) as SentryBreadcrumbLike | null
      } catch {
        // Same contract as beforeSend: observability never breaks the page.
        return null
      }
    }
  }
}
