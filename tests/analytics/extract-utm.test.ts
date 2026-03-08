import * as assert from 'node:assert/strict'
import test from 'node:test'

import { extractUtmParams } from '../../app/features/analytics/helpers/extract-utm'

test('extractUtmParams: extracts all 3 UTM params', () => {
  const result = extractUtmParams('?utm_source=google&utm_medium=cpc&utm_campaign=spring')
  assert.deepEqual(result, {
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'spring'
  })
})

test('extractUtmParams: partial params — only utm_source', () => {
  const result = extractUtmParams('?utm_source=instagram')
  assert.equal(result.utmSource, 'instagram')
  assert.equal(result.utmMedium, undefined)
  assert.equal(result.utmCampaign, undefined)
})

test('extractUtmParams: no UTM params → all undefined', () => {
  const result = extractUtmParams('?page=1&sort=name')
  assert.equal(result.utmSource, undefined)
  assert.equal(result.utmMedium, undefined)
  assert.equal(result.utmCampaign, undefined)
})

test('extractUtmParams: empty string → all undefined', () => {
  const result = extractUtmParams('')
  assert.equal(result.utmSource, undefined)
  assert.equal(result.utmMedium, undefined)
  assert.equal(result.utmCampaign, undefined)
})

test('extractUtmParams: ignores unrelated params', () => {
  const result = extractUtmParams('?utm_source=twitter&ref=abc&utm_term=coaching')
  assert.equal(result.utmSource, 'twitter')
  assert.equal(result.utmMedium, undefined)
  assert.equal(result.utmCampaign, undefined)
})
