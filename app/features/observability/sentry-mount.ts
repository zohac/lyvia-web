import * as Sentry from '@sentry/browser'

import { IGNORE_ERRORS } from './sentry-ignore-errors'
import { scrubBreadcrumb, scrubEvent, scrubUrl } from './sentry-scrub'
import { resolveTenantTag } from './sentry-tenant-tag'

let initialized = false

function readDsn(): string | undefined {
  try {
    const rc = useRuntimeConfig()
    const value = (rc?.public as Record<string, unknown> | undefined)?.sentryDsn
    return typeof value === 'string' && value !== '' ? value : process.env.NUXT_PUBLIC_SENTRY_DSN
  } catch {
    return process.env.NUXT_PUBLIC_SENTRY_DSN
  }
}

export function mountSentry(): void {
  if (initialized) return
  if (typeof window === 'undefined') return
  initialized = true

  const tenant = resolveTenantTag(window.location.hostname)
  const dsn = readDsn()

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    tracesSampleRate: 0,
    ignoreErrors: IGNORE_ERRORS,
    initialScope: { tags: { tenant } },
    beforeSend(event: any) {
      try {
        const scrubbed = scrubEvent(event) as any
        if (scrubbed?.request) {
          delete scrubbed.request.data
          delete scrubbed.request.headers
          delete scrubbed.request.cookies
          if (typeof scrubbed.request.url === 'string') {
            scrubbed.request.url = scrubUrl(scrubbed.request.url)
          }
        }
        if (typeof scrubbed?.transaction === 'string') {
          scrubbed.transaction = scrubUrl(scrubbed.transaction)
        }
        if (typeof scrubbed?.culprit === 'string') {
          scrubbed.culprit = scrubUrl(scrubbed.culprit)
        }
        // Never attach an identity.
        delete scrubbed.user
        return scrubbed
      } catch {
        // An exception inside beforeSend drops the event without breaking the app.
        return null
      }
    },
    beforeBreadcrumb(breadcrumb: any) {
      return scrubBreadcrumb(breadcrumb) as any
    }
  } as any)
}
