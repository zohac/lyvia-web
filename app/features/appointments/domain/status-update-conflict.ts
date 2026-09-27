/**
 * Resolution of a `INVALID_STATUS_TRANSITION` conflict on an appointment status
 * update.
 *
 * `PATCH /appointments/:id/status` answers 409 when the transition is no longer
 * legal — typically because the appointment was already moved to the target
 * status. The provider page reacts by re-reading the list: if the row now carries
 * the status it asked for, the operation effectively landed and the action is
 * reported as a success instead of an error.
 *
 * hotfix-24 — this decision was inline in `pages/provider/discovery.vue` and had
 * no executing test. The page imports the Nuxt-bound `apiFetch` and cannot run
 * under `node:test`, so the branch was invisible to `pnpm test:unit`; extracting
 * it here is what makes the conflict path covered.
 *
 * The helper is pure: no refresh, no network, no Vue state. The caller owns the
 * `refresh()` and passes the re-read list.
 */

/** Minimal shape the resolver needs from the discovery appointments list. */
export type StatusBearingAppointment = {
  id: string
  status: string
}

/**
 * Whether the requested status is already applied on the appointment, i.e. the
 * 409 conflict is a no-op and the caller may report success.
 *
 * Returns `false` when the appointment is absent from the list or carries another
 * status: in both cases the conflict is genuine and the error must surface.
 */
export function isRequestedStatusAlreadyApplied(
  appointments: readonly StatusBearingAppointment[] | undefined,
  appointmentId: string,
  requestedStatus: string
): boolean {
  if (!appointments) return false

  const appointment = appointments.find(item => item.id === appointmentId)
  if (!appointment) return false

  return appointment.status === requestedStatus
}
