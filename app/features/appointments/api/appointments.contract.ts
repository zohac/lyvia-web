/**
 * Appointments contracts (provider/admin).
 *
 * Source of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/appointments/presentation/*`
 */

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

export type DiscoveryAppointmentClient = {
  firstname: string
  lastname: string
  email: string
  phone: string
  stage: 'lead' | 'active'
}

export type DiscoveryAppointmentListItem = {
  id: string
  scheduledAt: string
  status: AppointmentStatus
  client: DiscoveryAppointmentClient
}

export type ListDiscoveryAppointmentsResponse = {
  timezone: string
  appointments: DiscoveryAppointmentListItem[]
}

/**
 * The body sent on `PATCH /appointments/:id/status`.
 *
 * Mirrors `UpdateAppointmentStatusDto`, which whitelists `status` and `reason`
 * only. It deliberately does NOT include `cancelledByRole`: the production
 * `ValidationPipe` runs with `forbidNonWhitelisted: true`, so sending that
 * property is rejected with 422 `VALIDATION_ERROR` (hotfix-24 — that field
 * broke "Annuler un appel découverte" in `pages/provider/discovery.vue`).
 * The server derives the cancellation attribution from the authenticated
 * actor's role (`UpdateAppointmentStatusUseCase`), so the front must never
 * assert it. `cancelledByRole` remains a *read* field on the calendar and
 * clients response models.
 */
export type UpdateAppointmentStatusRequest = {
  status: 'completed' | 'cancelled'
  reason?: string | null
}

export type UpdateAppointmentStatusResponse = {
  updated: true
  status: 'completed' | 'cancelled'
}

export type ConvertDiscoveryToActiveClientRequest = {
  conversionNote?: string
}

export type ConvertDiscoveryToActiveClientResponse = {
  converted: true
  alreadyActive: boolean
}
