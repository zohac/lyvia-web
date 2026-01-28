/**
 * Contract for provider appointment requests endpoints (US-6).
 *
 * Allows providers to view and process client cancellation/reschedule requests.
 *
 * @see handoff-frontend-provider-request-processing.md
 */

/**
 * Request status filter
 */
export type ProviderRequestStatusFilter = 'pending' | 'accepted' | 'rejected' | 'all'

/**
 * Request type
 */
export type ProviderRequestType = 'cancellation' | 'reschedule'

/**
 * Request status
 */
export type ProviderRequestStatus = 'pending' | 'accepted' | 'rejected'

/**
 * Client info in request
 */
export interface ProviderRequestClient {
  id: string
  firstName: string
  lastName: string
}

/**
 * Appointment info in request
 */
export interface ProviderRequestAppointment {
  id: string
  scheduledAt: string
  durationMinutes: number
  client: ProviderRequestClient
}

/**
 * Single request item
 */
export interface ProviderRequestItem {
  id: string
  type: ProviderRequestType
  status: ProviderRequestStatus
  reason: string
  details: string | null
  createdAt: string
  appointment: ProviderRequestAppointment
}

/**
 * Response from GET /provider/appointments/requests
 */
export interface ListProviderRequestsResponse {
  requests: ProviderRequestItem[]
  meta: {
    total: number
    pending: number
  }
}

/**
 * Request body for POST /provider/appointments/requests/:id/accept
 */
export interface AcceptRequestBody {
  providerNote?: string | null
  /** Required for reschedule requests */
  newScheduledAt?: string
}

/**
 * Response from accept cancellation
 */
export interface AcceptCancellationResponse {
  request: {
    id: string
    status: 'accepted'
    processedAt: string
  }
  appointment: {
    id: string
    status: 'cancelled'
    cancelledAt: string
  }
}

/**
 * Response from accept reschedule
 */
export interface AcceptRescheduleResponse {
  request: {
    id: string
    status: 'accepted'
    processedAt: string
  }
  appointment: {
    id: string
    status: 'scheduled'
    scheduledAt: string
    previousScheduledAt: string
  }
}

/**
 * Request body for POST /provider/appointments/requests/:id/reject
 */
export interface RejectRequestBody {
  providerNote?: string | null
}

/**
 * Response from reject
 */
export interface RejectRequestResponse {
  request: {
    id: string
    status: 'rejected'
    processedAt: string
  }
}

/**
 * Error codes from the API
 */
export type ProviderRequestErrorCode
  = 'REQUEST_NOT_FOUND'
    | 'REQUEST_NOT_OWNED'
    | 'REQUEST_ALREADY_PROCESSED'
    | 'NEW_SCHEDULED_AT_REQUIRED'
    | 'SLOT_NOT_AVAILABLE'

/**
 * Labels for request reasons (French)
 */
export const REQUEST_REASON_LABELS: Record<string, string> = {
  schedule_conflict: 'Conflit d\'horaire',
  health_issue: 'Problème de santé',
  personal_emergency: 'Urgence personnelle',
  financial_reason: 'Raison financière',
  no_longer_needed: 'Plus nécessaire',
  prefer_different_time: 'Préfère un autre horaire',
  work_commitment: 'Engagement professionnel',
  travel_plans: 'Plans de voyage',
  personal_reason: 'Raison personnelle',
  other: 'Autre'
}

/**
 * Labels for request status (French)
 */
export const REQUEST_STATUS_LABELS: Record<ProviderRequestStatusFilter, string> = {
  pending: 'En attente',
  accepted: 'Acceptées',
  rejected: 'Refusées',
  all: 'Toutes'
}

/**
 * Get label for a reason code
 */
export function getReasonLabel(reason: string): string {
  return REQUEST_REASON_LABELS[reason] ?? reason
}

/**
 * Get label for a status
 */
export function getStatusLabel(status: ProviderRequestStatusFilter): string {
  return REQUEST_STATUS_LABELS[status] ?? status
}
