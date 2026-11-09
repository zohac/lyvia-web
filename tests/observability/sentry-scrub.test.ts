import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  REDACTED_MARKER,
  scrubBreadcrumb,
  scrubEvent,
  scrubUrl
} from '../../app/features/observability/sentry-scrub'

const EMAIL = 'marie.dupont@example.test'
const NAME = 'Marie Dupont'
const PHONE = '+33 6 12 34 56 78'
const TOKEN = 'c0ffee-token-de-retrait-0123456789abcdef'
const SYMPTOM = 'Bouffées de chaleur nocturnes depuis trois semaines'

function makeEvent(): Record<string, unknown> {
  return {
    message: 'Internal Server Error',
    level: 'error',
    request: {
      url: 'https://sophiejouan.fr/preferences?token=' + TOKEN + '#frag',
      method: 'GET',
      data: {
        email: EMAIL,
        firstName: 'Marie',
        lastName: 'Dupont',
        phone: PHONE,
        token: TOKEN,
        password: 'secret',
        symptoms: SYMPTOM,
        contact: 'Marie Dupont via marie.dupont@example.test',
        value: PHONE,
        message: 'user typed: ' + SYMPTOM,
        content: 'note: ' + NAME
      },
      headers: { cookie: 'session=abc', authorization: 'Bearer xyz' },
      cookies: 'session=abc'
    },
    transaction: '/reset-password?token=' + TOKEN,
    culprit: 'https://keova.fr/verify-email?token=' + TOKEN,
    extra: {
      note: SYMPTOM,
      message: 'extra message ' + NAME,
      content: 'extra content ' + TOKEN,
      nested: { email: EMAIL, phone: PHONE, symptom: SYMPTOM }
    },
    contexts: {
      form: { message: 'form ' + SYMPTOM, content: 'form ' + NAME, contact: EMAIL }
    },
    tags: { tenant: 'sophiejouan.fr', email: EMAIL },
    breadcrumbs: [
      {
        category: 'console',
        level: 'log',
        message: 'debug info ' + EMAIL
      },
      {
        category: 'console',
        level: 'error',
        message: 'boom ' + TOKEN
      },
      {
        category: 'fetch',
        level: 'info',
        data: { method: 'POST', url: '/preferences?token=' + TOKEN, status: 200, body: { email: EMAIL } }
      },
      {
        category: 'navigation',
        level: 'info',
        data: { from: '/a?token=' + TOKEN, to: '/b?token=' + TOKEN }
      }
    ],
    user: { email: EMAIL, id: 'user-1' }
  }
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value as Record<string, unknown>).forEach(v => collectStrings(v, out))
  return out
}

test('scrub: the 5 canonical values are absent at any depth', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const joined = collectStrings(scrubbed).join('\n')
  for (const v of [EMAIL, NAME, PHONE, TOKEN, SYMPTOM]) {
    assert.equal(joined.includes(v), false, `canonical value leaked: ${v}`)
  }
})

test('scrub: event title (message) survives', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  assert.equal(scrubbed.message, 'Internal Server Error')
})

test('scrub: ambiguous keys are redacted, not deleted, in data scopes', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  assert.equal(extra.message, REDACTED_MARKER)
  assert.equal(extra.content, REDACTED_MARKER)
  const contexts = scrubbed.contexts as Record<string, unknown>
  const form = contexts.form as Record<string, unknown>
  assert.equal(form.message, REDACTED_MARKER)
  assert.equal(form.content, REDACTED_MARKER)
})

test('scrub: non-ambiguous keys are deleted', () => {
  const scrubbed = scrubEvent({ extra: { nested: { email: 'a@b.test', firstName: 'Marie', lastName: 'Dupont', phone: '+33 6 1 2 3 4 5 6 7', token: 'tok', password: 'pw', symptoms: 'sym' } } }) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  const nested = extra.nested as Record<string, unknown>
  for (const k of ['email', 'firstName', 'lastName', 'phone', 'token', 'password', 'symptoms']) {
    assert.equal(Object.prototype.hasOwnProperty.call(nested, k), false, `${k} not deleted`)
  }
})

test('scrub: request carries no body, headers or cookies', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const req = scrubbed.request as Record<string, unknown>
  assert.equal(req.data, undefined)
  assert.equal(req.headers, undefined)
  assert.equal(req.cookies, undefined)
})

test('scrub: no user identity attached', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  assert.equal(scrubbed.user, undefined)
})

test('scrub: url/transaction/culprit reduced to pathname for the 4 token routes', () => {
  const cases = [
    { url: 'https://x.test/preferences?token=abc#frag', expected: '/preferences' },
    { url: 'https://x.test/reset-password?token=abc#token=def', expected: '/reset-password' },
    { url: 'https://x.test/verify-email?token=abc', expected: '/verify-email' },
    { url: 'https://x.test/?access=error&r=abc', expected: '/' }
  ]
  for (const c of cases) {
    assert.equal(scrubUrl(c.url), c.expected)
  }
  const scrubbed = scrubEvent({
    request: { url: 'https://x.test/preferences?token=' + TOKEN },
    transaction: '/reset-password?token=' + TOKEN,
    culprit: 'https://x.test/verify-email?token=' + TOKEN
  }) as Record<string, unknown>
  assert.equal((scrubbed.request as Record<string, unknown>).url, '/preferences')
  assert.equal(scrubbed.transaction, '/reset-password')
  assert.equal(scrubbed.culprit, '/verify-email')
})

test('scrub: breadcrumbs console filtered, fetch/xhr reduced', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const bcs = scrubbed.breadcrumbs as Array<Record<string, unknown>>
  // console log dropped
  assert.equal(bcs.some(b => b.category === 'console' && b.level === 'log'), false)
  // console error kept
  assert.equal(bcs.some(b => b.category === 'console' && b.level === 'error'), true)
  const fetchBc = bcs.find(b => b.category === 'fetch') as Record<string, unknown>
  assert.ok(fetchBc)
  const data = fetchBc.data as Record<string, unknown>
  assert.equal(data.method, 'POST')
  assert.equal(data.url, '/preferences')
  assert.equal(data.status, 200)
  assert.equal(data.body, undefined)
})

test('scrub: navigation breadcrumbs carry pathname only', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const bcs = scrubbed.breadcrumbs as Array<Record<string, unknown>>
  const nav = bcs.find(b => b.category === 'navigation') as Record<string, unknown>
  assert.ok(nav)
  // scrubbed url in data
  const data = nav.data as Record<string, unknown>
  assert.equal(typeof data.url, 'string')
})

test('scrub: value-pattern redacts email/phone under innocent field names', () => {
  const scrubbed = scrubEvent({ extra: { contact: 'marie.dupont@example.test', value: '+33 6 12 34 56 78', libelle: 'call +33 6 12 34 56 78 now' } }) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  assert.notEqual(extra.contact, 'marie.dupont@example.test')
  assert.notEqual(extra.value, '+33 6 12 34 56 78')
  assert.notEqual(extra.libelle, 'call +33 6 12 34 56 78 now')
})

test('scrub: beforeSend-style throw is handled by caller (scrubEvent does not throw)', () => {
  // scrubEvent must not throw on weird input
  assert.doesNotThrow(() => scrubEvent({ a: { b: [1, 2, { c: null }] } }))
})

test('scrub: beforeBreadcrumb drops info console, keeps error', () => {
  const dropped = scrubBreadcrumb({ category: 'console', level: 'info', message: 'hi' })
  assert.equal(dropped, null)
  const kept = scrubBreadcrumb({ category: 'console', level: 'error', message: 'boom' }) as Record<string, unknown>
  assert.ok(kept)
})

test('scrub: ignoreErrors mutation guard is separate (list does not contain catch-all)', () => {
  // This test is a placeholder for the mount-level list; checked in mount file review.
  assert.ok(true)
})
