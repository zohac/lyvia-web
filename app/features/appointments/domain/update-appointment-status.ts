/**
 * Execution of a discovery appointment status update.
 *
 * hotfix-24 — the provider discovery page used to build and send this request
 * inline. Two failures shipped green through that arrangement: hotfix-23's
 * prefixed 404 and hotfix-24's 422 on a body property the server does not
 * whitelist. Both were invisible to `pnpm test:unit` because the page imports
 * the Nuxt-bound `apiFetch` and cannot run under `node:test`, and because the
 * only checks that touched it were source-text greps — a page that called the
 * builders and then ignored their result passed them.
 *
 * The request composition and its error handling therefore live here, with the
 * transport injected. A test can now assert the exact path, verb and body that
 * reach the network, which is the only check that can fail if a non-whitelisted
 * property or a wrong route is reintroduced at the call site.
 */

import { ApiFetchError } from '../../../services/api/api-error'
import type { UpdateAppointmentStatusRequest } from '../api/appointments.contract'
import {
  buildDiscoveryAppointmentStatusBody,
  buildUpdateAppointmentStatusCall
} from '../api/appointments.request'
import {
  isRequestedStatusAlreadyApplied,
  type StatusBearingAppointment
} from './status-update-conflict'

export type StatusUpdateOutcome = { ok: true } | { ok: false, message: string }

/** The exact call the page hands to `apiFetch`. */
export interface StatusUpdateRequest {
  path: string
  method: 'PATCH'
  body: UpdateAppointmentStatusRequest
}

export interface StatusUpdateDependencies {
  /** Performs the request. Injected so the test can observe it. */
  send: (request: StatusUpdateRequest) => Promise<unknown>
  /**
   * Re-reads the appointments list and returns it. Only called after a 409.
   *
   * Known limitation, deliberately not guarded: the page's `useAsyncData`
   * handler swallows its own errors and resolves to an empty list, so a failed
   * re-read is indistinguishable here from an appointment that left the list.
   * Both yield the mapped error. Separating them would mean inspecting
   * `systemError`, for a branch the page cannot currently reach.
   */
  reRead: () => Promise<readonly StatusBearingAppointment[] | undefined>
  /** Maps an API error code to its user-facing message. */
  messageFor: (code: string) => string
  /** Message used when the failure is not an API error. */
  fallbackMessage: string
}

const INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION'

/**
 * Sends `PATCH /appointments/:id/status` with the whitelisted body and turns the
 * outcome into a message the page can display.
 *
 * A 409 `INVALID_STATUS_TRANSITION` triggers a re-read: if the row now carries
 * the requested status the operation effectively landed and the caller reports
 * success. Note this is defensive — see the review triage log: the discovery
 * page only ever acts on `scheduled` rows, and the API is idempotent on an
 * unchanged status, so the 409 branch is currently unreachable from here.
 */
export async function runDiscoveryAppointmentStatusUpdate(
  appointmentId: string,
  status: UpdateAppointmentStatusRequest['status'],
  deps: StatusUpdateDependencies
): Promise<StatusUpdateOutcome> {
  const call = buildUpdateAppointmentStatusCall(
    appointmentId,
    buildDiscoveryAppointmentStatusBody(status)
  )
  const request: StatusUpdateRequest = {
    path: call.path,
    method: call.options.method,
    body: call.options.body
  }

  try {
    await deps.send(request)
    return { ok: true }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === INVALID_STATUS_TRANSITION) {
        const appointments = await deps.reRead()
        if (isRequestedStatusAlreadyApplied(appointments, appointmentId, status)) {
          return { ok: true }
        }
      }

      return { ok: false, message: deps.messageFor(err.apiError.code) }
    }
    return { ok: false, message: deps.fallbackMessage }
  }
}
