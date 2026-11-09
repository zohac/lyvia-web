import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  REDACTED_MARKER,
  scrubBreadcrumb,
  scrubEvent,
  scrubUrl
} from '../../app/features/observability/sentry-scrub'

// The five canonical values of pii-scrub-policy.md § « Preuve attendue ».
const EMAIL = 'marie.dupont@example.test'
const NAME = 'Marie Dupont'
const PHONE = '+33 6 12 34 56 78'
const TOKEN = 'c0ffee-token-de-retrait-0123456789abcdef'
const SYMPTOM = 'Bouffées de chaleur nocturnes depuis trois semaines'

/**
 * An event shaped like the ones the SDK builds, with the five canonical values
 * placed where a real payload carries them: identity under form keys, tokens in
 * the URL and in the token key, health text under a symptom field and in a
 * free-text data scope. No literal-value matching is used by the scrub, so this
 * fixture only passes when the three families actually work.
 */
function makeEvent(): Record<string, unknown> {
  return {
    message: 'Internal Server Error',
    level: 'error',
    request: {
      url: 'https://sophiejouan.fr/preferences?token=' + TOKEN + '#frag',
      method: 'GET',
      query_string: 'token=' + TOKEN,
      data: {
        email: EMAIL,
        firstName: 'Marie',
        lastName: 'Dupont',
        phone: PHONE,
        token: TOKEN,
        password: 'secret',
        symptoms: SYMPTOM,
        contact: 'Écrire à ' + EMAIL,
        value: PHONE,
        libelle: 'Rappeler au ' + PHONE,
        message: 'saisie: ' + SYMPTOM,
        content: 'note: ' + NAME
      },
      headers: { cookie: 'session=abc', authorization: 'Bearer xyz' },
      cookies: 'session=abc'
    },
    transaction: '/reset-password?token=' + TOKEN,
    culprit: 'https://keova.fr/verify-email?token=' + TOKEN,
    extra: {
      message: 'extra ' + NAME,
      content: 'extra ' + TOKEN,
      symptoms: SYMPTOM,
      fitJson: { answer: SYMPTOM },
      problemStatementJson: { blocks: [{ text: SYMPTOM }] },
      notes: SYMPTOM,
      nested: { email: EMAIL, phone: PHONE }
    },
    contexts: {
      form: { message: 'form ' + SYMPTOM, content: 'form ' + NAME, emergencyContact: EMAIL }
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
        message: 'failed to load /preferences?token=' + TOKEN
      },
      {
        // Shape emitted by @sentry/browser@11 for fetch breadcrumbs.
        category: 'fetch',
        level: 'info',
        data: { method: 'POST', url: '/preferences?token=' + TOKEN, status_code: 200, body: { email: EMAIL } }
      },
      {
        category: 'xhr',
        level: 'error',
        data: { method: 'GET', url: 'https://x.test/reset-password?token=' + TOKEN, status_code: 500 }
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

test('scrub: family-1 inventory keys are deleted (fit, problem statement, notes, address)', () => {
  // Inventory measured in app/ (grep, 2026-11-09): the fit answers and the
  // provider's problem statement are free text the policy forbids, the session
  // notes carry health content too, and `address`/`adresse` are identity. None
  // of them is an email/phone pattern and none is named `message`/`content`,
  // so only family 1 catches them. Every key of the family-1 inventory that the
  // product uses must appear here: a list entry with no pin is a rule that can
  // be deleted without a single test falling.
  const scrubbed = scrubEvent({
    extra: {
      fitJson: { audience: 'femmes en ménopause', painPoints: ['bouffées de chaleur'] },
      fitForm: { audience: 'femmes en ménopause' },
      fit_json: { audience: 'femmes en ménopause' },
      fit: { audience: 'femmes en ménopause' },
      problemStatementJson: { blocks: [{ text: 'Elle se réveille la nuit' }] },
      problemStatement: 'Elle se réveille la nuit',
      problem_statement: 'Elle se réveille la nuit',
      symptoms: 'Bouffées de chaleur nocturnes',
      symptom: 'Bouffées de chaleur nocturnes',
      notes: 'Séance du 3 : insomnie, anxiété',
      pauseReason: 'Symptômes trop intenses pour continuer',
      reasonText: 'Annulé, douleurs importantes',
      address: '12 rue des Lilas',
      adresse: '12 rue des Lilas',
      city: 'Nantes'
    }
  }) as Record<string, unknown>

  const extra = scrubbed.extra as Record<string, unknown>
  const forbidden = [
    'fitJson', 'fitForm', 'fit_json', 'fit',
    'problemStatementJson', 'problemStatement', 'problem_statement',
    'symptoms', 'symptom',
    'notes', 'pauseReason', 'reasonText',
    'address', 'adresse'
  ]
  for (const key of forbidden) {
    assert.equal(Object.prototype.hasOwnProperty.call(extra, key), false, `${key} not deleted`)
  }
  // `city` is deliberately kept: it is not identity-direct and it is useful context.
  assert.equal(extra.city, 'Nantes')
  // No health text survives anywhere in the event.
  assert.equal(collectStrings(scrubbed).join('\n').includes('ménopause'), false)
})

test('scrub: the 5 canonical values are absent at any depth', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const joined = collectStrings(scrubbed).join('\n')
  for (const value of [EMAIL, NAME, PHONE, TOKEN, SYMPTOM]) {
    assert.equal(joined.includes(value), false, `canonical value leaked: ${value}`)
  }
})

test('scrub: event title (message) survives', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  assert.equal(scrubbed.message, 'Internal Server Error')
})

test('scrub: ambiguous keys are redacted, not deleted, only in data scopes', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  assert.equal(extra.message, REDACTED_MARKER)
  assert.equal(extra.content, REDACTED_MARKER)
  const form = (scrubbed.contexts as Record<string, unknown>).form as Record<string, unknown>
  assert.equal(form.message, REDACTED_MARKER)
  assert.equal(form.content, REDACTED_MARKER)
  // The event title is not a data scope: the key is kept untouched.
  assert.equal(Object.prototype.hasOwnProperty.call(scrubbed, 'message'), true)
})

test('scrub: non-ambiguous keys are deleted at any depth', () => {
  const scrubbed = scrubEvent({
    extra: { nested: { email: 'a@b.test', firstName: 'Marie', lastName: 'Dupont', phone: '+33 6 1 2 3 4 5 6 7', token: 'tok', password: 'pw', symptoms: 'sym' } }
  }) as Record<string, unknown>
  const nested = (scrubbed.extra as Record<string, unknown>).nested as Record<string, unknown>
  for (const key of ['email', 'firstName', 'lastName', 'phone', 'token', 'password', 'symptoms']) {
    assert.equal(Object.prototype.hasOwnProperty.call(nested, key), false, `${key} not deleted`)
  }
})

test('scrub: request carries no body, headers, cookies nor query string', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const request = scrubbed.request as Record<string, unknown>
  assert.equal(request.data, undefined)
  assert.equal(request.headers, undefined)
  assert.equal(request.cookies, undefined)
  assert.equal(request.query_string, undefined)
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
  for (const testCase of cases) {
    assert.equal(scrubUrl(testCase.url), testCase.expected)
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

test('scrub: console breadcrumbs filtered, fetch/xhr reduced to method + pathname + status', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const breadcrumbs = scrubbed.breadcrumbs as Array<Record<string, unknown>>
  assert.equal(breadcrumbs.some(b => b.category === 'console' && b.level === 'log'), false)
  assert.equal(breadcrumbs.some(b => b.category === 'console' && b.level === 'error'), true)

  const fetchBreadcrumb = breadcrumbs.find(b => b.category === 'fetch') as Record<string, unknown>
  const fetchData = fetchBreadcrumb.data as Record<string, unknown>
  assert.equal(fetchData.method, 'POST')
  assert.equal(fetchData.url, '/preferences')
  assert.equal(fetchData.status, 200)
  assert.equal(fetchData.body, undefined)

  const xhrBreadcrumb = breadcrumbs.find(b => b.category === 'xhr') as Record<string, unknown>
  const xhrData = xhrBreadcrumb.data as Record<string, unknown>
  assert.equal(xhrData.status, 500, 'the SDK emits status_code: the status must survive the reduction')
  assert.equal(xhrData.url, '/reset-password')
})

test('scrub: navigation breadcrumbs carry pathname only', () => {
  const scrubbed = scrubEvent(makeEvent()) as Record<string, unknown>
  const breadcrumbs = scrubbed.breadcrumbs as Array<Record<string, unknown>>
  const navigation = breadcrumbs.find(b => b.category === 'navigation') as Record<string, unknown>
  const data = navigation.data as Record<string, unknown>
  assert.equal(data.url, '/b')
  assert.equal(collectStrings(data).join('\n').includes(TOKEN), false)
})

test('scrub: value-pattern family redacts emails and phones under innocent field names', () => {
  const scrubbed = scrubEvent({
    extra: {
      contact: 'someone.else@example.org',
      value: '06 98 76 54 32',
      libelle: 'Rappeler au +1 (555) 010-9999'
    }
  }) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  assert.equal(extra.contact, REDACTED_MARKER)
  assert.equal(extra.value, REDACTED_MARKER)
  assert.equal(extra.libelle, 'Rappeler au ' + REDACTED_MARKER)
})

test('scrub: dates, versions, error codes and epoch ids are not redacted as phones', () => {
  const scrubbed = scrubEvent({
    extra: {
      date: '2026-11-09',
      timestamp: '2026-11-09T10:00:00.000Z',
      browserVersion: 'Chrome/131.0.0.0',
      errorCode: '123456789',
      epoch: '1699900000000'
    }
  }) as Record<string, unknown>
  const extra = scrubbed.extra as Record<string, unknown>
  assert.equal(extra.date, '2026-11-09')
  assert.equal(extra.timestamp, '2026-11-09T10:00:00.000Z')
  assert.equal(extra.browserVersion, 'Chrome/131.0.0.0')
  assert.equal(extra.errorCode, '123456789')
  assert.equal(extra.epoch, '1699900000000')
})

test('scrub: a token carried in free text is redacted, not only under a url key', () => {
  const scrubbed = scrubEvent({
    message: 'GET /preferences?token=' + TOKEN + ' failed',
    tags: { route: '/reset-password#token=' + TOKEN }
  }) as Record<string, unknown>
  const joined = collectStrings(scrubbed).join('\n')
  assert.equal(joined.includes(TOKEN), false)
  assert.equal((scrubbed.message as string).includes('/preferences?token=' + REDACTED_MARKER), true)
})

test('scrub: beforeBreadcrumb drops info console, keeps error', () => {
  assert.equal(scrubBreadcrumb({ category: 'console', level: 'info', message: 'hi' }), null)
  assert.equal(scrubBreadcrumb({ category: 'console', level: 'debug', message: 'hi' }), null)
  const kept = scrubBreadcrumb({ category: 'console', level: 'error', message: 'boom' }) as Record<string, unknown>
  assert.ok(kept)
})

test('scrub: circular and over-deep data does not throw', () => {
  const circular: Record<string, unknown> = { label: 'root' }
  circular.self = circular
  assert.doesNotThrow(() => scrubEvent(circular))
  let deep: Record<string, unknown> = { leaf: 'end' }
  for (let index = 0; index < 40; index += 1) deep = { child: deep }
  assert.doesNotThrow(() => scrubEvent(deep))
})
