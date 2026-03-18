import * as assert from 'node:assert/strict'
import test from 'node:test'

import { extractReferrerDomain } from '../../app/features/analytics/helpers/extract-referrer'

test('extractReferrerDomain: external referrer → returns hostname', () => {
  assert.equal(extractReferrerDomain('https://instagram.com/p/abc123', 'keova.fr'), 'instagram.com')
})

test('extractReferrerDomain: external referrer with path → returns hostname only', () => {
  assert.equal(extractReferrerDomain('https://www.google.com/search?q=coaching', 'keova.fr'), 'www.google.com')
})

test('extractReferrerDomain: self-referral → returns undefined', () => {
  assert.equal(extractReferrerDomain('https://keova.fr/coach/sophie', 'keova.fr'), undefined)
})

test('extractReferrerDomain: empty referrer → returns undefined', () => {
  assert.equal(extractReferrerDomain('', 'keova.fr'), undefined)
})

test('extractReferrerDomain: invalid URL → returns undefined', () => {
  assert.equal(extractReferrerDomain('not-a-url', 'keova.fr'), undefined)
})

test('extractReferrerDomain: different subdomain is external', () => {
  assert.equal(extractReferrerDomain('https://blog.example.com/article', 'keova.fr'), 'blog.example.com')
})
