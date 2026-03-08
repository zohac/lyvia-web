import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatDateShort, formatDateTime } from '../../app/composables/useDateFormat'

// ── formatDateShort ──

test('formatDateShort: formats ISO date to fr-FR short date', () => {
  const result = formatDateShort('2026-03-08T14:30:00.000Z')
  assert.ok(result.includes('2026'))
  assert.ok(result.includes('mars'))
})

test('formatDateShort: formats december correctly', () => {
  const result = formatDateShort('2025-12-25T00:00:00.000Z')
  assert.ok(result.includes('2025'))
})

// ── formatDateTime ──

test('formatDateTime: includes time component', () => {
  const result = formatDateTime('2026-03-08T14:30:00.000Z')
  assert.ok(result.includes('2026'))
  assert.match(result, /\d{2}:\d{2}/)
})

test('formatDateTime: formats january correctly', () => {
  const result = formatDateTime('2026-01-15T09:00:00.000Z')
  assert.ok(result.includes('2026'))
  assert.match(result, /\d{2}:\d{2}/)
})
