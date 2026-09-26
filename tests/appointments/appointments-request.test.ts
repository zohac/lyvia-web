/**
 * hotfix-23 — route contract for the provider actions on the appointments chain.
 *
 * The "Convertir en cliente" and "Marquer comme terminé" actions both returned 404
 * in production for eight months. The services import the Nuxt-bound `apiFetch`
 * and cannot run under `node:test`, and the API-side E2E only pins what the
 * *server* serves — so nothing observed the path the *client* asked for, and
 * `pnpm test:unit` stayed green with the bug in place.
 *
 * These assertions run the pure builders the services now delegate to, so
 * reintroducing the `provider/` prefix fails the suite.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  buildConvertDiscoveryLeadCall,
  buildUpdateAppointmentStatusCall
} from '../../app/features/appointments/api/appointments.request'

const APPOINTMENT_ID = 'appt-1'

describe('appointments/api — convert discovery lead request', () => {
  test('targets POST /appointments/:id/convert without the provider/ prefix', () => {
    const call = buildConvertDiscoveryLeadCall(APPOINTMENT_ID)

    assert.equal(call.path, `/appointments/${APPOINTMENT_ID}/convert`)
    assert.equal(call.options.method, 'POST')
    assert.equal(call.options.withAuth, true)
  })

  test('never builds the /provider/appointments variant that 404s', () => {
    const call = buildConvertDiscoveryLeadCall(APPOINTMENT_ID)

    assert.ok(!call.path.startsWith('/provider/appointments'))
  })

  test('keeps a relative path so the Nitro proxy preserves the tenant host', () => {
    const call = buildConvertDiscoveryLeadCall(APPOINTMENT_ID)

    assert.ok(call.path.startsWith('/'))
    assert.ok(!call.path.startsWith('http'))
  })

  test('sends no body, which the server accepts (conversionNote is optional)', () => {
    const call = buildConvertDiscoveryLeadCall(APPOINTMENT_ID)

    assert.equal('body' in call.options, false)
  })
})

describe('appointments/api — update appointment status request', () => {
  test('targets PATCH /appointments/:id/status without the provider/ prefix', () => {
    const call = buildUpdateAppointmentStatusCall(APPOINTMENT_ID, { status: 'completed' })

    assert.equal(call.path, `/appointments/${APPOINTMENT_ID}/status`)
    assert.equal(call.options.method, 'PATCH')
    assert.equal(call.options.withAuth, true)
    assert.deepEqual(call.options.body, { status: 'completed' })
  })

  test('never builds the /provider/appointments variant that 404s', () => {
    const call = buildUpdateAppointmentStatusCall(APPOINTMENT_ID, { status: 'completed' })

    assert.ok(!call.path.startsWith('/provider/appointments'))
  })

  test('keeps a relative path so the Nitro proxy preserves the tenant host', () => {
    const call = buildUpdateAppointmentStatusCall(APPOINTMENT_ID, { status: 'completed' })

    assert.ok(call.path.startsWith('/'))
    assert.ok(!call.path.startsWith('http'))
  })

  test('carries only whitelisted properties: cancelledByRole would be rejected 422', () => {
    const call = buildUpdateAppointmentStatusCall(APPOINTMENT_ID, {
      status: 'completed',
      reason: 'terminée en séance'
    })

    // `UpdateAppointmentStatusDto` whitelists status + reason only, and the
    // production ValidationPipe runs with forbidNonWhitelisted: true.
    assert.deepEqual(Object.keys(call.options.body).sort(), ['reason', 'status'])
    assert.equal('cancelledByRole' in call.options.body, false)
  })
})
