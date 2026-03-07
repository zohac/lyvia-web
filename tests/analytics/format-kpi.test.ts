import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatKpiValue, getDeltaIcon, getDeltaClasses } from '../../app/features/analytics/helpers/format-kpi'

// ── formatKpiValue ──

test('formatKpiValue: formats number with FR locale', () => {
  const result = formatKpiValue(1234)
  // fr-FR uses narrow no-break space as thousand separator
  assert.ok(result.includes('1'))
  assert.ok(result.includes('234'))
})

test('formatKpiValue: formats zero', () => {
  assert.equal(formatKpiValue(0), '0')
})

test('formatKpiValue: currency divides by 100 and formats EUR', () => {
  const result = formatKpiValue(45000, 'currency')
  assert.ok(result.includes('450'))
  assert.ok(result.includes('€'))
})

test('formatKpiValue: currency handles zero cents', () => {
  const result = formatKpiValue(0, 'currency')
  assert.ok(result.includes('0'))
  assert.ok(result.includes('€'))
})

test('formatKpiValue: currency with fractional euros', () => {
  const result = formatKpiValue(1599, 'currency')
  assert.ok(result.includes('15'))
  assert.ok(result.includes('99'))
  assert.ok(result.includes('€'))
})

test('formatKpiValue: number format explicit', () => {
  const result = formatKpiValue(42, 'number')
  assert.equal(result, '42')
})

// ── getDeltaIcon ──

test('getDeltaIcon: positive delta → ↑', () => {
  assert.equal(getDeltaIcon(12.5), '↑')
})

test('getDeltaIcon: negative delta → ↓', () => {
  assert.equal(getDeltaIcon(-3.2), '↓')
})

test('getDeltaIcon: zero delta → —', () => {
  assert.equal(getDeltaIcon(0), '—')
})

// ── getDeltaClasses ──

test('getDeltaClasses: positive → green', () => {
  assert.equal(getDeltaClasses(5), 'text-green-600')
})

test('getDeltaClasses: negative → red', () => {
  assert.equal(getDeltaClasses(-1), 'text-red-600')
})

test('getDeltaClasses: zero → stone', () => {
  assert.equal(getDeltaClasses(0), 'text-stone-400')
})
