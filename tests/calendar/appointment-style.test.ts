import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAppointmentDisplayStatus,
  getAppointmentTypeConfig,
  getAppointmentTypePillClass,
  getAppointmentNameClass,
  getMonthChipStyle,
  getTimeEventStyle,
  getStatusDotStyle,
  STATUS_CONFIG,
  STATUS_LEGEND_ORDER
} from '../../app/features/calendar/presentation/appointment-style'

// ---- Display status mapping (status + paymentStatus → lifecycle) ----
test('display status: cancelled wins', () => {
  assert.equal(getAppointmentDisplayStatus({ status: 'cancelled', paymentStatus: 'paid' }), 'cancelled')
})
test('display status: completed → done', () => {
  assert.equal(getAppointmentDisplayStatus({ status: 'completed', paymentStatus: 'not_required' }), 'done')
})
test('display status: scheduled + paid → paid', () => {
  assert.equal(getAppointmentDisplayStatus({ status: 'scheduled', paymentStatus: 'paid' }), 'paid')
})
test('display status: scheduled + unpaid → planned', () => {
  assert.equal(getAppointmentDisplayStatus({ status: 'scheduled', paymentStatus: 'unpaid' }), 'planned')
})

// ---- Type hue mapping ----
test('type config: discovery → sunset, consultation → crepuscule, followup → success', () => {
  assert.ok(getAppointmentTypeConfig('discovery').fill.includes('sunset'))
  assert.ok(getAppointmentTypeConfig('consultation').fill.includes('crepuscule'))
  assert.ok(getAppointmentTypeConfig('free_followup').fill.includes('success'))
})

test('type pill class is soft tint + readable text per type', () => {
  assert.equal(getAppointmentTypePillClass('consultation'), 'bg-crepuscule-100 text-crepuscule-700')
  assert.equal(getAppointmentTypePillClass('discovery'), 'bg-sunset-100 text-sunset-700')
  assert.equal(getAppointmentTypePillClass('free_followup'), 'bg-success-100 text-success-700')
})

// ---- Status config exposes the gold "Payé" status ----
test('status config includes a gold paid status', () => {
  assert.equal(STATUS_CONFIG.paid.label, 'Payé')
  assert.ok(STATUS_CONFIG.paid.dot.includes('gold'))
})
test('only planned reads as a hollow dot', () => {
  assert.equal(STATUS_CONFIG.planned.hollow, true)
  assert.equal(STATUS_CONFIG.done.hollow, false)
  assert.equal(STATUS_CONFIG.paid.hollow, false)
  assert.equal(STATUS_CONFIG.cancelled.hollow, false)
})
test('legend order lists the four lifecycle statuses', () => {
  assert.deepEqual(STATUS_LEGEND_ORDER, ['planned', 'done', 'paid', 'cancelled'])
})

// ---- Month chip style: left accent bar in the type hue, soft tint ----
test('month chip uses a 3px left bar in the type fill and a soft tint', () => {
  const style = getMonthChipStyle({ type: 'consultation', status: 'scheduled' })
  assert.ok(style.borderLeft.startsWith('3px solid'))
  assert.ok(style.borderLeft.includes('crepuscule'))
  assert.ok(style.background.includes('color-mix'))
})
test('cancelled month chip is greyed (neutral bar, transparent bg, muted text)', () => {
  const style = getMonthChipStyle({ type: 'consultation', status: 'cancelled' })
  assert.ok(style.borderLeft.includes('neutral-300'))
  assert.equal(style.background, 'transparent')
  assert.ok(style.color.includes('text-muted'))
})

// ---- Time event style: dashed greyed borders when cancelled ----
test('time event uses solid hairline borders normally', () => {
  const style = getTimeEventStyle({ type: 'discovery', status: 'scheduled', paymentStatus: 'not_required' })
  assert.ok(style.borderTop.includes('solid'))
  assert.ok(style.borderLeft.includes('sunset'))
})
test('cancelled time event uses dashed borders and white surface', () => {
  const style = getTimeEventStyle({ type: 'consultation', status: 'cancelled', paymentStatus: 'unpaid' })
  assert.ok(style.borderTop.includes('dashed'))
  assert.equal(style.background, 'var(--color-surface-card)')
})

// ---- Status dot: hollow ring for planned, solid otherwise ----
test('planned dot is hollow (inset white ring)', () => {
  const dot = getStatusDotStyle({ status: 'scheduled', paymentStatus: 'unpaid' })
  assert.ok(dot.boxShadow.includes('inset'))
})
test('done dot is solid', () => {
  const dot = getStatusDotStyle({ status: 'completed', paymentStatus: 'not_required' })
  assert.equal(dot.boxShadow, 'none')
  assert.ok(dot.background.includes('success'))
})

// ---- Name class ----
test('cancelled name is struck through', () => {
  assert.equal(getAppointmentNameClass({ status: 'cancelled' }), 'line-through')
  assert.equal(getAppointmentNameClass({ status: 'scheduled' }), '')
})
