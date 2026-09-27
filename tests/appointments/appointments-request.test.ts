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
import type { AppointmentStatus } from '../../app/features/appointments/api/appointments.contract'
import { isRequestedStatusAlreadyApplied } from '../../app/features/appointments/domain/status-update-conflict'
import { runDiscoveryAppointmentStatusUpdate } from '../../app/features/appointments/domain/update-appointment-status'
import { ApiFetchError } from '../../app/services/api/api-error'

const APPOINTMENT_ID = 'appt-1'

/** The error the transport throws for a given API error code. */
function apiError(code: string): ApiFetchError {
  return new ApiFetchError({ statusCode: 409, code, message: 'boom' })
}

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

/**
 * Removes block and line comments so a source-text guard can forbid a token in
 * code without forbidding the rationale that explains why it is forbidden.
 */
function stripVueComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
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
  // Second layer, kept deliberately narrow. The page now hands its transport to
  // `runDiscoveryAppointmentStatusUpdate`, so the outgoing request itself is
  // asserted by executing that function (next describe). What is left to prove
  // here is that the page does not compose a request of its own beside it.

  test('the page delegates to the tested runner instead of composing a request', () => {
    const source = readDiscoveryPage()

    assert.match(source, /runDiscoveryAppointmentStatusUpdate\(/)
    assert.ok(
      !source.includes('buildUpdateAppointmentStatusCall('),
      'the page must not rebuild the request beside the delegated runner'
    )
  })

  test('the page never re-introduces the non-whitelisted property in code', () => {
    // Comments are stripped first: the rationale may name the field, only
    // executable code is forbidden from carrying it.
    const code = stripVueComments(readDiscoveryPage())

    assert.ok(
      !code.includes('cancelledByRole'),
      'cancelledByRole is not whitelisted by UpdateAppointmentStatusDto — it must not reappear in discovery.vue code'
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

  const LIST: ReadonlyArray<{ id: string, status: AppointmentStatus }> = [
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

describe('appointments/domain — discovery status update execution (hotfix-24)', () => {
  // The load-bearing layer. It runs the function the page delegates to, with a
  // fake transport, and asserts what actually reaches the network. Source-text
  // guards cannot do this: a page that called the builders and then ignored their
  // result passed every regex while sending a 404 route and a 422 body.

  const FALLBACK = 'Une erreur est survenue. Veuillez réessayer.'
  type Row = { id: string, status: 'scheduled' | 'completed' | 'cancelled' }

  function harness(options: { failWith?: unknown, list?: readonly Row[] } = {}) {
    const sent: Array<{ path: string, method: string, body: unknown }> = []
    let reReadCalls = 0

    return {
      sent,
      get reReadCalls() {
        return reReadCalls
      },
      run: (appointmentId: string, status: 'completed' | 'cancelled') =>
        runDiscoveryAppointmentStatusUpdate(appointmentId, status, {
          send: async (request) => {
            sent.push(request)
            if (options.failWith !== undefined) throw options.failWith
            return { updated: true, status }
          },
          reRead: async () => {
            reReadCalls++
            return options.list
          },
          messageFor: code => `mapped:${code}`,
          fallbackMessage: FALLBACK
        })
    }
  }

  test('sends PATCH /appointments/:id/status with the whitelisted body only', async () => {
    const h = harness()

    await h.run(APPOINTMENT_ID, 'cancelled')

    assert.equal(h.sent.length, 1)
    assert.equal(h.sent[0]?.path, `/appointments/${APPOINTMENT_ID}/status`)
    assert.equal(h.sent[0]?.method, 'PATCH')
    assert.deepEqual(h.sent[0]?.body, { status: 'cancelled' })
    assert.equal('cancelledByRole' in (h.sent[0]?.body as object), false)
  })

  test('never builds the /provider/appointments variant that 404s', async () => {
    const h = harness()

    await h.run(APPOINTMENT_ID, 'cancelled')

    assert.ok(!h.sent[0]?.path.startsWith('/provider/appointments'))
  })

  test('reports success on a 2xx without re-reading the list', async () => {
    const h = harness()

    assert.deepEqual(await h.run(APPOINTMENT_ID, 'cancelled'), { ok: true })
    assert.equal(h.reReadCalls, 0)
  })

  test('maps an API error code without re-reading the list', async () => {
    const h = harness({ failWith: apiError('VALIDATION_ERROR') })

    assert.deepEqual(await h.run(APPOINTMENT_ID, 'cancelled'), {
      ok: false,
      message: 'mapped:VALIDATION_ERROR'
    })
    assert.equal(h.reReadCalls, 0)
  })

  test('falls back to the generic message when the failure is not an API error', async () => {
    const h = harness({ failWith: new TypeError('network down') })

    assert.deepEqual(await h.run(APPOINTMENT_ID, 'cancelled'), {
      ok: false,
      message: FALLBACK
    })
  })

  test('on a 409, re-reads and reports success when the status did land', async () => {
    const h = harness({
      failWith: apiError('INVALID_STATUS_TRANSITION'),
      list: [{ id: APPOINTMENT_ID, status: 'cancelled' }]
    })

    assert.deepEqual(await h.run(APPOINTMENT_ID, 'cancelled'), { ok: true })
    assert.equal(h.reReadCalls, 1)
  })

  test('on a 409, surfaces the mapped error when the re-read shows another status', async () => {
    const h = harness({
      failWith: apiError('INVALID_STATUS_TRANSITION'),
      list: [{ id: APPOINTMENT_ID, status: 'scheduled' }]
    })

    assert.deepEqual(await h.run(APPOINTMENT_ID, 'cancelled'), {
      ok: false,
      message: 'mapped:INVALID_STATUS_TRANSITION'
    })
    assert.equal(h.reReadCalls, 1)
  })

  test('the completed branch is whitelisted exactly like the cancelled one', async () => {
    const h = harness()

    await h.run(APPOINTMENT_ID, 'completed')

    assert.deepEqual(h.sent[0]?.body, { status: 'completed' })
    assert.equal('cancelledByRole' in (h.sent[0]?.body as object), false)
  })
})
