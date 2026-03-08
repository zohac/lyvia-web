import * as assert from 'node:assert/strict'
import test from 'node:test'

import { extractReferrerDomain } from '../../app/features/analytics/helpers/extract-referrer'

test('extractReferrerDomain: external referrer → returns hostname', () => {
  assert.equal(extractReferrerDomain('https://instagram.com/p/abc123', 'kaora.app'), 'instagram.com')
})

test('extractReferrerDomain: external referrer with path → returns hostname only', () => {
  assert.equal(extractReferrerDomain('https://www.google.com/search?q=coaching', 'kaora.app'), 'www.google.com')
})

test('extractReferrerDomain: self-referral → returns undefined', () => {
  assert.equal(extractReferrerDomain('https://kaora.app/coach/sophie', 'kaora.app'), undefined)
})

test('extractReferrerDomain: empty referrer → returns undefined', () => {
  assert.equal(extractReferrerDomain('', 'kaora.app'), undefined)
})

test('extractReferrerDomain: invalid URL → returns undefined', () => {
  assert.equal(extractReferrerDomain('not-a-url', 'kaora.app'), undefined)
})

test('extractReferrerDomain: different subdomain is external', () => {
  assert.equal(extractReferrerDomain('https://blog.example.com/article', 'kaora.app'), 'blog.example.com')
})
