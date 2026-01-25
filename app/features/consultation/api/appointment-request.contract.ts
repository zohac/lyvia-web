/**
 * Contract for client appointment request endpoints (US-2, US-3).
 *
 * Defines types for cancellation and reschedule requests submitted by clients.
 * The provider must approve or reject each request.
 *
 * @see feature-spec-client-cancellation-requests.md
 */

/**
 * Cancellation reasons - must match backend enum
 */
export type CancellationReason
  = 'schedule_conflict'
    | 'health_issue'
    | 'personal_emergency'
    | 'financial_reason'
    | 'no_longer_needed'
    | 'other'

/**
 * Reschedule reasons - must match backend enum
 */
export type RescheduleReason
  = 'schedule_conflict'
    | 'health_issue'
    | 'personal_emergency'
    | 'prefer_different_time'
    | 'other'

/**
 * Request status
 */
export type RequestStatus = 'pending' | 'accepted' | 'rejected'

/**
 * Request body for POST /client/appointments/:id/request-cancellation
 */
export interface RequestCancellationBody {
  reason: CancellationReason
  details?: string | null
}

/**
 * Request body for POST /client/appointments/:id/request-reschedule
 */
export interface RequestRescheduleBody {
  reason: RescheduleReason
  details?: string | null
}

/**
 * Response from request endpoints (201 Created)
 */
export interface AppointmentRequestResponse {
  requestId: string
  status: RequestStatus
  createdAt: string
}

/**
 * Error codes from the API
 */
export type AppointmentRequestErrorCode
  = 'APPOINTMENT_NOT_OWNED'
    | 'APPOINTMENT_NOT_FOUND'
    | 'REQUEST_ALREADY_EXISTS'
    | 'TOO_CLOSE_TO_APPOINTMENT'
    | 'APPOINTMENT_NOT_CANCELLABLE'

/**
 * API error response structure
 */
export interface AppointmentRequestError {
  code: AppointmentRequestErrorCode
  message: string
  details?: {
    reason?: 'not_consultation' | 'not_scheduled' | 'not_paid' | 'already_cancelled' | 'already_completed'
    hoursRemaining?: number
    existingRequestId?: string
  }
}

/**
 * Labels for cancellation reasons (French)
 */
export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  schedule_conflict: 'Conflit d\'emploi du temps',
  health_issue: 'Problème de santé',
  personal_emergency: 'Urgence personnelle',
  financial_reason: 'Raison financière',
  no_longer_needed: 'Je n\'ai plus besoin de cette consultation',
  other: 'Autre (préciser)'
}

/**
 * Labels for reschedule reasons (French)
 */
export const RESCHEDULE_REASON_LABELS: Record<RescheduleReason, string> = {
  schedule_conflict: 'Conflit d\'emploi du temps',
  health_issue: 'Problème de santé',
  personal_emergency: 'Urgence personnelle',
  prefer_different_time: 'Je préfère un autre horaire',
  other: 'Autre (préciser)'
}

/**
 * Check if an appointment is eligible for request (> 24h before)
 */
export function isEligibleForRequest(scheduledAt: Date): boolean {
  const now = new Date()
  const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntil > 24
}

/**
 * Get hours remaining until appointment
 */
export function getHoursUntilAppointment(scheduledAt: Date): number {
  const now = new Date()
  return Math.max(0, (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60))
}
