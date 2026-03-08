import * as assert from 'node:assert/strict'
import test from 'node:test'

import { SLUG_REGEX, SIRET_REGEX, EMAIL_REGEX } from '../../app/utils/validation-regex'

// ── SLUG_REGEX ──

test('SLUG_REGEX: accepts lowercase kebab-case', () => {
  assert.ok(SLUG_REGEX.test('sophie-martin'))
  assert.ok(SLUG_REGEX.test('abc'))
  assert.ok(SLUG_REGEX.test('coach-123'))
  assert.ok(SLUG_REGEX.test('a1b2c3'))
})

test('SLUG_REGEX: rejects uppercase', () => {
  assert.ok(!SLUG_REGEX.test('Sophie-Martin'))
})

test('SLUG_REGEX: rejects leading dash', () => {
  assert.ok(!SLUG_REGEX.test('-leading'))
})

test('SLUG_REGEX: rejects trailing dash', () => {
  assert.ok(!SLUG_REGEX.test('trailing-'))
})

test('SLUG_REGEX: rejects double dash', () => {
  assert.ok(!SLUG_REGEX.test('double--dash'))
})

test('SLUG_REGEX: rejects spaces', () => {
  assert.ok(!SLUG_REGEX.test('has space'))
})

test('SLUG_REGEX: rejects underscores', () => {
  assert.ok(!SLUG_REGEX.test('has_underscore'))
})

// ── SIRET_REGEX ──

test('SIRET_REGEX: accepts SIREN (9 digits)', () => {
  assert.ok(SIRET_REGEX.test('123456789'))
})

test('SIRET_REGEX: accepts SIRET (14 digits)', () => {
  assert.ok(SIRET_REGEX.test('12345678901234'))
})

test('SIRET_REGEX: rejects 8 digits', () => {
  assert.ok(!SIRET_REGEX.test('12345678'))
})

test('SIRET_REGEX: rejects 10 digits', () => {
  assert.ok(!SIRET_REGEX.test('1234567890'))
})

test('SIRET_REGEX: rejects 13 digits', () => {
  assert.ok(!SIRET_REGEX.test('1234567890123'))
})

test('SIRET_REGEX: rejects 15 digits', () => {
  assert.ok(!SIRET_REGEX.test('123456789012345'))
})

test('SIRET_REGEX: rejects letters', () => {
  assert.ok(!SIRET_REGEX.test('abcdefghi'))
})

// ── EMAIL_REGEX ──

test('EMAIL_REGEX: accepts valid emails', () => {
  assert.ok(EMAIL_REGEX.test('user@example.com'))
  assert.ok(EMAIL_REGEX.test('first.last@domain.fr'))
  assert.ok(EMAIL_REGEX.test('user+tag@domain.co.uk'))
})

test('EMAIL_REGEX: rejects missing @', () => {
  assert.ok(!EMAIL_REGEX.test('nope'))
})

test('EMAIL_REGEX: rejects missing local part', () => {
  assert.ok(!EMAIL_REGEX.test('@domain.com'))
})

test('EMAIL_REGEX: rejects missing domain', () => {
  assert.ok(!EMAIL_REGEX.test('user@'))
})

test('EMAIL_REGEX: rejects spaces', () => {
  assert.ok(!EMAIL_REGEX.test('user @domain.com'))
})
