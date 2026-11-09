import * as assert from 'node:assert/strict'
import test from 'node:test'

import { IGNORE_ERRORS } from '../../app/features/observability/sentry-ignore-errors'
import { buildSentryOptions } from '../../app/features/observability/sentry-options'
import { REDACTED_MARKER } from '../../app/features/observability/sentry-scrub'

const EMAIL = 'marie.dupont@example.test'
const TOKEN = 'c0ffee-token-de-retrait-0123456789abcdef'

function buildOptions() {
  return buildSentryOptions({
    dsn: 'https://abc123@o1.ingest.sentry.io/42',
    tenant: 'sophiejouan.fr',
    environment: 'production'
  })
}

test('options: sendDefaultPii is disabled explicitly', () => {
  assert.equal(buildOptions().sendDefaultPii, false)
})

test('options: replay and tracing are explicitly disabled', () => {
  const options = buildOptions()
  assert.equal(options.replaysSessionSampleRate, 0)
  assert.equal(options.replaysOnErrorSampleRate, 0)
  assert.equal(options.tracesSampleRate, 0)
})

test('options: the named ignoreErrors list is the one given to the SDK', () => {
  assert.deepEqual(buildOptions().ignoreErrors, IGNORE_ERRORS)
})

test('options: the tenant tag carries the domain and nothing else', () => {
  const options = buildOptions()
  assert.deepEqual(options.initialScope.tags, { tenant: 'sophiejouan.fr' })
  const tag = options.initialScope.tags.tenant
  assert.equal(tag.includes('@'), false)
  assert.equal(/provider|user|client/i.test(tag), false)
})

test('options: the DSN and environment are forwarded', () => {
  const options = buildOptions()
  assert.equal(options.dsn, 'https://abc123@o1.ingest.sentry.io/42')
  assert.equal(options.environment, 'production')
})

test('options: integrations supplied by the adapter are forwarded', () => {
  const integration = { name: 'Vue' }
  const options = buildSentryOptions({ dsn: 'https://k@x.test/1', tenant: 'keova.fr', integrations: [integration] })
  assert.deepEqual(options.integrations, [integration])
})

// The three assertions below are the mutation-proof of AC-2/AC-8: removing
// beforeSend, beforeBreadcrumb or sendDefaultPii makes one of them fall.
test('options.beforeSend scrubs the event it receives', () => {
  const options = buildOptions()
  const scrubbed = options.beforeSend({
    message: 'Internal Server Error',
    request: { url: 'https://x.test/preferences?token=' + TOKEN, data: { email: EMAIL } },
    extra: { email: EMAIL },
    user: { email: EMAIL }
  })
  if (scrubbed === null) {
    assert.fail('a well-formed event must survive beforeSend')
  }
  assert.equal(scrubbed.message, 'Internal Server Error')
  assert.equal((scrubbed.request as Record<string, unknown>).url, '/preferences')
  assert.equal((scrubbed.request as Record<string, unknown>).data, undefined)
  assert.equal((scrubbed.extra as Record<string, unknown>).email, undefined)
  assert.equal(scrubbed.user, undefined)
  assert.equal(JSON.stringify(scrubbed).includes(EMAIL), false)
})

test('options.beforeSend drops the event when the scrub throws, without throwing', () => {
  const options = buildOptions()
  const hostile = {
    get message(): string {
      throw new Error('boom')
    }
  }
  assert.doesNotThrow(() => options.beforeSend(hostile as Record<string, unknown>))
  assert.equal(options.beforeSend(hostile as Record<string, unknown>), null)
})

test('options.beforeBreadcrumb drops console log and keeps a reduced fetch', () => {
  const options = buildOptions()
  assert.equal(options.beforeBreadcrumb({ category: 'console', level: 'log', message: 'debug' }), null)
  const reduced = options.beforeBreadcrumb({
    category: 'fetch',
    level: 'info',
    data: { method: 'POST', url: '/preferences?token=' + TOKEN, status_code: 201, body: { email: EMAIL } }
  }) as Record<string, unknown>
  assert.deepEqual(reduced.data, { method: 'POST', url: '/preferences', status: 201 })
})

test('options.beforeBreadcrumb drops the breadcrumb when the scrub throws', () => {
  const options = buildOptions()
  const hostile = {
    get category(): string {
      throw new Error('boom')
    }
  }
  assert.equal(options.beforeBreadcrumb(hostile as Record<string, unknown>), null)
})

test('options: an ambiguous data key is redacted, not deleted', () => {
  const options = buildOptions()
  const scrubbed = options.beforeSend({ extra: { message: 'secret form text' } })
  assert.equal((scrubbed?.extra as Record<string, unknown>).message, REDACTED_MARKER)
})
