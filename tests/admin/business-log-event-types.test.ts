import * as assert from 'node:assert/strict'
import test from 'node:test'

import { BUSINESS_LOG_EVENT_FAMILIES } from '../../app/features/admin/domain/business-log-event-types'

test('em-2: la famille Paiements couvre le pluriel PAYMENTS_', () => {
  const payment = BUSINESS_LOG_EVENT_FAMILIES.find(f => f.key === 'payment')!
  assert.ok(payment)
  assert.ok(payment.prefixes.includes('PAYMENT_'))
  assert.ok(payment.prefixes.includes('PAYMENTS_'))
})

test('em-2: la famille RDV couvre le pluriel APPOINTMENTS_', () => {
  const appointment = BUSINESS_LOG_EVENT_FAMILIES.find(f => f.key === 'appointment')!
  assert.ok(appointment)
  assert.ok(appointment.prefixes.includes('APPOINTMENT_'))
  assert.ok(appointment.prefixes.includes('APPOINTMENTS_'))
})

test('em-2: tous les préfixes historiques sont conservés', () => {
  const all = BUSINESS_LOG_EVENT_FAMILIES.flatMap(f => f.prefixes)
  for (const p of ['CLIENT_', 'PROVIDER_', 'STRIPE_', 'AUTH_']) {
    assert.ok(all.includes(p), `missing prefix ${p}`)
  }
})
