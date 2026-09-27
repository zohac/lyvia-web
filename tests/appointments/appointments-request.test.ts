/**
 * hotfix-23 — route contract for the provider actions on the appointments chain.
 *
 * The "Convertir en cliente" and "Marquer comme terminé" actions both returned 404
 * in production for eight months. The services import the Nuxt-bound `apiFetch`
 * and cannot run under `node:test`, and the API-side E2E only pins what the
 * *server* serves — so nothing observed the path the *client* asked for, and
 * `pnpm test:unit` stayed green with the bug in place.
 *
 * hotfix-24 — "Annuler un appel découverte" returned 422 `VALIDATION_ERROR` on
 * every cancellation: `pages/provider/discovery.vue` built its body inline with
 * `cancelledByRole`, which `UpdateAppointmentStatusDto` does not whitelist under
 * `forbidNonWhitelisted: true`. The body construction now lives in
 * `buildDiscoveryAppointmentStatusBody`, so the whitelist is asserted against
 * what the page really sends. A second, structural layer pins that the page
 * delegates to the builders instead of re-inlining a literal.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  buildConvertDiscoveryLeadCall,
  buildDiscoveryAppointmentStatusBody,
  buildUpdateAppointmentStatusCall
} from '../../app/features/appointments/api/appointments.request'
import { isRequestedStatusAlreadyApplied } from '../../app/features/appointments/domain/status-update-conflict'

const APPOINTMENT_ID = 'appt-1'

const appRoot = path.resolve(process.cwd(), 'app')
const DISCOVERY_PAGE_PATH = 'pages/provider/discovery.vue'
const CONTRACT_PATH = 'features/appointments/api/appointments.contract.ts'
const DUPLICATE_TYPE_NAME = 'UpdateAppointmentStatusBody'

function readDiscoveryPage(): string {
  return fs.readFileSync(path.join(appRoot, DISCOVERY_PAGE_PATH), 'utf-8')
}

function readContract(): string {
  return fs.readFileSync(path.join(appRoot, CONTRACT_PATH), 'utf-8')
}

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    return entry.isFile() ? [full] : []
  })
}

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

describe('appointments/api — discovery appointment status body (hotfix-24)', () => {
  // The previous "carries only whitelisted properties" case was vacuous for this
  // bug: it hand-built the body it then inspected, so it could never observe what
  // the page sends. These cases run the builder the page delegates to.

  test('cancelled body carries exactly the whitelisted status key', () => {
    const body = buildDiscoveryAppointmentStatusBody('cancelled')

    assert.deepEqual(body, { status: 'cancelled' })
    assert.deepEqual(Object.keys(body), ['status'])
  })

  test('cancelled body never carries cancelledByRole — that is the 422', () => {
    const body = buildDiscoveryAppointmentStatusBody('cancelled')

    assert.equal('cancelledByRole' in body, false)
  })

  test('completed body is unchanged and equally whitelisted', () => {
    const body = buildDiscoveryAppointmentStatusBody('completed')

    assert.deepEqual(body, { status: 'completed' })
    assert.equal('cancelledByRole' in body, false)
  })

  test('cancelled branch keeps the same relative PATCH /appointments/:id/status', () => {
    const call = buildUpdateAppointmentStatusCall(
      APPOINTMENT_ID,
      buildDiscoveryAppointmentStatusBody('cancelled')
    )

    assert.equal(call.path, `/appointments/${APPOINTMENT_ID}/status`)
    assert.equal(call.options.method, 'PATCH')
    assert.equal(call.options.withAuth, true)
    assert.ok(call.path.startsWith('/'))
    assert.ok(!call.path.startsWith('http'))
  })

  test('completed branch keeps the same relative PATCH /appointments/:id/status', () => {
    const call = buildUpdateAppointmentStatusCall(
      APPOINTMENT_ID,
      buildDiscoveryAppointmentStatusBody('completed')
    )

    assert.equal(call.path, `/appointments/${APPOINTMENT_ID}/status`)
    assert.equal(call.options.method, 'PATCH')
    assert.equal(call.options.withAuth, true)
    assert.ok(call.path.startsWith('/'))
    assert.ok(!call.path.startsWith('http'))
  })
})

describe('appointments/api — provider discovery page wiring (hotfix-24)', () => {
  // Structural second layer: the behavioural cases above prove the builders are
  // correct, this one proves `discovery.vue` actually goes through them and does
  // not re-inline the forbidden literal.

  test('requestUpdateAppointmentStatus delegates path and body to the tested builders', () => {
    const source = readDiscoveryPage()

    assert.match(source, /buildDiscoveryAppointmentStatusBody\(status\)/)
    assert.match(source, /buildUpdateAppointmentStatusCall\(/)
  })

  test('page no longer contains the cancelledByRole literal anywhere', () => {
    const source = readDiscoveryPage()

    assert.ok(
      !source.includes('cancelledByRole'),
      'cancelledByRole is not whitelisted by UpdateAppointmentStatusDto — it must not reappear in discovery.vue'
    )
  })

  test('the 409 branch delegates to the pure conflict resolver instead of re-inlining it', () => {
    const source = readDiscoveryPage()

    assert.match(source, /isRequestedStatusAlreadyApplied\(/)
    assert.ok(
      !/\.find\(\s*\w+\s*=>\s*\w+\.id\s*===\s*appointmentId\s*\)/.test(source),
      'the status re-read must stay in the pure resolver, not be re-inlined in the page'
    )
  })
})

describe('appointments/api — status request contract (hotfix-24)', () => {
  // `UpdateAppointmentStatusRequest` is the single request type on this route.
  // It used to carry the forbidden `cancelledByRole` and to coexist with the
  // hotfix-23 duplicate `UpdateAppointmentStatusBody`; neither may come back.

  test('UpdateAppointmentStatusRequest declares only status and reason', () => {
    const declaration = readContract().match(
      /export type UpdateAppointmentStatusRequest = \{[\s\S]*?\}/
    )

    if (!declaration) {
      assert.fail('UpdateAppointmentStatusRequest must exist')
      return
    }
    assert.ok(
      !declaration[0].includes('cancelledByRole'),
      'cancelledByRole must not return to the request type — it is what re-introduced the 422'
    )
    assert.ok(declaration[0].includes('status:'))
    assert.ok(declaration[0].includes('reason?:'))
  })

  test('the hotfix-23 duplicate UpdateAppointmentStatusBody is gone from app/', () => {
    const offenders = listSourceFiles(appRoot)
      .filter(file => file.endsWith('.ts') || file.endsWith('.vue'))
      .filter(file => fs.readFileSync(file, 'utf-8').includes(DUPLICATE_TYPE_NAME))
      .map(file => path.relative(appRoot, file))

    assert.deepEqual(offenders, [])
  })
})

describe('appointments/domain — INVALID_STATUS_TRANSITION resolution (hotfix-24)', () => {
  // The 409 branch lived inline in the page: re-read the list, and if the row now
  // carries the requested status the action effectively landed, so report success.
  // Extracted as a pure helper because the page cannot run under `node:test`.

  const LIST = [
    { id: 'appt-1', status: 'scheduled' },
    { id: 'appt-2', status: 'cancelled' }
  ]

  test('reports success when the row already carries the requested status', () => {
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-2', 'cancelled'), true)
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-1', 'scheduled'), true)
  })

  test('surfaces the conflict when the row carries another status', () => {
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-1', 'cancelled'), false)
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-2', 'completed'), false)
  })

  test('surfaces the conflict when the appointment is absent from the re-read list', () => {
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-unknown', 'cancelled'), false)
  })

  test('handles a missing or empty list without throwing', () => {
    assert.equal(isRequestedStatusAlreadyApplied(undefined, 'appt-1', 'cancelled'), false)
    assert.equal(isRequestedStatusAlreadyApplied([], 'appt-1', 'cancelled'), false)
  })

  test('never treats a completed request as applied on a cancelled row', () => {
    assert.equal(isRequestedStatusAlreadyApplied(LIST, 'appt-2', 'completed'), false)
  })
})
