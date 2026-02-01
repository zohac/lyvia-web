import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAppointmentStatusDotClass,
  getAppointmentNameClass,
  getAppointmentAccentClass,
  getAppointmentMetaClass
} from '../../app/features/calendar/presentation/appointment-style'

test('getAppointmentStatusDotClass returns bg-red-500 for cancelled', () => {
  assert.equal(getAppointmentStatusDotClass({ status: 'cancelled' }), 'bg-red-500')
})

test('getAppointmentStatusDotClass returns bg-green-500 for completed', () => {
  assert.equal(getAppointmentStatusDotClass({ status: 'completed' }), 'bg-green-500')
})

test('getAppointmentStatusDotClass returns null for scheduled', () => {
  assert.equal(getAppointmentStatusDotClass({ status: 'scheduled' }), null)
})

test('getAppointmentNameClass returns line-through for cancelled', () => {
  assert.equal(getAppointmentNameClass({ status: 'cancelled' }), 'line-through')
})

test('getAppointmentNameClass returns empty string for scheduled', () => {
  assert.equal(getAppointmentNameClass({ status: 'scheduled' }), '')
})

test('getAppointmentAccentClass returns crepuscule for consultation', () => {
  assert.ok(getAppointmentAccentClass({ type: 'consultation' }).includes('crepuscule'))
})

test('getAppointmentAccentClass returns amber for discovery', () => {
  assert.ok(getAppointmentAccentClass({ type: 'discovery' }).includes('amber'))
})

test('getAppointmentMetaClass returns opacity-60 for cancelled', () => {
  assert.ok(getAppointmentMetaClass({ status: 'cancelled', paymentStatus: 'not_required' }).includes('opacity-60'))
})

test('getAppointmentMetaClass returns opacity-85 for completed', () => {
  assert.ok(getAppointmentMetaClass({ status: 'completed', paymentStatus: 'not_required' }).includes('opacity-85'))
})

test('getAppointmentMetaClass returns ring for paid', () => {
  assert.ok(getAppointmentMetaClass({ status: 'scheduled', paymentStatus: 'paid' }).includes('ring-2'))
})
