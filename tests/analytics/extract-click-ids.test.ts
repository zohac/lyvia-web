import * as assert from 'node:assert/strict'
import test from 'node:test'

import { extractClickIds } from '../../app/features/analytics/helpers/extract-click-ids'

test('extractClickIds: ?gclid=ABC → { gclid: "ABC" }', () => {
  const result = extractClickIds('?gclid=ABC')
  assert.deepEqual(result, { gclid: 'ABC' })
})

test('extractClickIds: ?msclkid=XYZ → { msclkid: "XYZ" }', () => {
  const result = extractClickIds('?msclkid=XYZ')
  assert.deepEqual(result, { msclkid: 'XYZ' })
})

test('extractClickIds: ?fbclid=DEF → { fbclid: "DEF" }', () => {
  const result = extractClickIds('?fbclid=DEF')
  assert.deepEqual(result, { fbclid: 'DEF' })
})

test('extractClickIds: ?gbraid=ABC → { gbraid: "ABC" } (iOS Google Ads)', () => {
  const result = extractClickIds('?gbraid=ABC')
  assert.deepEqual(result, { gbraid: 'ABC' })
})

test('extractClickIds: ?wbraid=ABC → { wbraid: "ABC" } (Web→App Google Ads)', () => {
  const result = extractClickIds('?wbraid=ABC')
  assert.deepEqual(result, { wbraid: 'ABC' })
})

test('extractClickIds: ?gclid=ABC&msclkid=XYZ&utm_source=foo → { gclid, msclkid } (utm ignored)', () => {
  const result = extractClickIds('?gclid=ABC&msclkid=XYZ&utm_source=foo')
  assert.deepEqual(result, { gclid: 'ABC', msclkid: 'XYZ' })
})

test('extractClickIds: ?utm_source=newsletter → {} (no click ID)', () => {
  const result = extractClickIds('?utm_source=newsletter')
  assert.deepEqual(result, {})
})

test('extractClickIds: empty string → {}', () => {
  const result = extractClickIds('')
  assert.deepEqual(result, {})
})

test('extractClickIds: ?gclid= (empty value) → {} (skip empty)', () => {
  const result = extractClickIds('?gclid=')
  assert.deepEqual(result, {})
})

test('extractClickIds: drops values exceeding 512 chars', () => {
  const tooLong = 'a'.repeat(513)
  const result = extractClickIds(`?gclid=${tooLong}`)
  assert.deepEqual(result, {})
})

test('extractClickIds: keeps boundary 512-char values', () => {
  const exact = 'a'.repeat(512)
  const result = extractClickIds(`?gclid=${exact}`)
  assert.deepEqual(result, { gclid: exact })
})
