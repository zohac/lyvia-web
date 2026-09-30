/**
 * Pure request builders for the provider actions on the appointments chain.
 *
 * hotfix-23 — the "Convertir en cliente" and "Marquer comme terminé" actions both
 * returned 404 because the services called `/provider/appointments/:id/...`
 * while these routes live on `AppointmentsController` (`@Controller('appointments')`,
 * unprefixed). The mistake shipped green for eight months: the services import the
 * Nuxt-bound `apiFetch` and cannot run under `node:test`, and the API-side E2E
 * only pins what the *server* serves, so nothing observed the path the *client*
 * asked for.
 *
 * Extracting the path/method/body construction here — the same pattern as
 * `features/pages/api/provider-pages.request.ts` (V2.2b, fix VG-1) — makes the
 * route contract behaviourally covered, so reintroducing the `provider/` prefix
 * fails `pnpm test:unit`.
 *
 * hotfix-24 — "Annuler un appel découverte" sent `cancelledByRole`, which
 * `UpdateAppointmentStatusDto` does not whitelist, and the production
 * `ValidationPipe` (`forbidNonWhitelisted: true`) answered 422
 * `VALIDATION_ERROR` on **every** cancellation. The body construction therefore
 * moved out of `pages/provider/discovery.vue` into `buildDiscoveryAppointmentStatusBody`
 * so the whitelist is produced by something `node:test` can execute.
 *
 * Source of truth: `repositories/lyvia-api/openapi.yaml`
 * (`/appointments/{id}/convert`, `/appointments/{id}/status`).
 */

import type { UpdateAppointmentStatusRequest } from './appointments.contract'

export interface ConvertDiscoveryLeadCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface UpdateAppointmentStatusCall {
  path: string
  options: {
    method: 'PATCH'
    withAuth: true
    body: UpdateAppointmentStatusRequest
  }
}

/**
 * `POST /appointments/:id/convert` — converts a completed discovery lead into an
 * active client. The body is optional server-side (`conversionNote`), so an empty
 * body is valid and the service sends none.
 */
export function buildConvertDiscoveryLeadCall(
  appointmentId: string
): ConvertDiscoveryLeadCall {
  return {
    path: `/appointments/${appointmentId}/convert`,
    options: { method: 'POST', withAuth: true }
  }
}

/**
 * hotfix-24 — the body of `PATCH /appointments/:id/status` for a discovery call.
 *
 * Only `status` is whitelisted by `UpdateAppointmentStatusDto`. The front MUST
 * NOT send `cancelledByRole`: the production `ValidationPipe` runs with
 * `forbidNonWhitelisted: true` and rejects it with 422 `VALIDATION_ERROR`,
 * which is what made "Annuler un appel découverte" permanently fail. The server
 * derives `cancelled_by_role` from the authenticated actor's role, so the
 * builder carries the single accepted key and nothing else.
 */
export function buildDiscoveryAppointmentStatusBody(
  status: UpdateAppointmentStatusRequest['status']
): UpdateAppointmentStatusRequest {
  return { status }
}

/**
 * `PATCH /appointments/:id/status` — marks a consultation as completed or
 * cancels it.
 *
 * The request must NOT carry `cancelledByRole`: the server DTO
 * (`UpdateAppointmentStatusDto`) only whitelists `status` and `reason`, and the
 * production `ValidationPipe` runs with `forbidNonWhitelisted: true`.
 */
export function buildUpdateAppointmentStatusCall(
  appointmentId: string,
  body: UpdateAppointmentStatusRequest
): UpdateAppointmentStatusCall {
  return {
    path: `/appointments/${appointmentId}/status`,
    options: { method: 'PATCH', withAuth: true, body }
  }
}
