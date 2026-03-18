/**
 * Contract for the client appointments endpoint.
 *
 * Lists all appointments (discovery + consultations) for the current client.
 */

/**
 * Appointment type.
 */
export type ClientAppointmentType = 'discovery' | 'consultation' | 'free_followup'

/**
 * Appointment status.
 */
export type ClientAppointmentStatus = 'scheduled' | 'cancelled' | 'completed'

/**
 * Payment status.
 */
export type ClientAppointmentPaymentStatus = 'not_required' | 'unpaid' | 'paid' | 'covered_by_program'

/**
 * Cancellation reason.
 */
export type ClientAppointmentCancellationReason
  = | 'client_request'
    | 'provider_unavailable'
    | 'client_no_show'
    | 'emergency'
    | 'other'

/**
 * Single appointment item in the list response.
 */
export type ClientAppointmentItem = {
  id: string
  type: ClientAppointmentType
  status: ClientAppointmentStatus
  scheduledAt: string
  durationMinutes: number
  paymentStatus: ClientAppointmentPaymentStatus
  cancellationReason: ClientAppointmentCancellationReason | null
  meetingLink: string | null
  /** True if there is a pending cancellation/reschedule request (US-4) */
  hasPendingRequest: boolean
}

/**
 * Response from GET /client/appointments
 */
export type ListClientAppointmentsResponse = {
  items: ClientAppointmentItem[]
}

/**
 * Query parameters for GET /client/appointments
 */
export type ListClientAppointmentsQuery = {
  type?: ClientAppointmentType
  status?: ClientAppointmentStatus
}
