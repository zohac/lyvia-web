/**
 * Calendar contracts (Provider calendar ops).
 *
 * Source of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/appointments/presentation/provider-appointments.controller.ts`
 */

export type ProviderCalendarAppointmentType = 'discovery' | 'consultation'

export type ProviderCalendarAppointmentStatus = 'scheduled' | 'cancelled' | 'completed'

export type ProviderCalendarPaymentStatus = 'not_required' | 'unpaid' | 'paid'

export type ProviderCalendarAppointmentSource = 'client_booking' | 'provider_manual' | 'admin'

export type ProviderCalendarClientStage = 'lead' | 'active'

export type ProviderAppointmentListItem = {
  id: string
  startAt: string
  endAt: string
  durationMinutes: number
  type: ProviderCalendarAppointmentType
  status: ProviderCalendarAppointmentStatus
  paymentStatus: ProviderCalendarPaymentStatus
  source: ProviderCalendarAppointmentSource
  notes?: string | null
  cancelledAt?: string | null
  cancelledByRole?: 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'SYSTEM' | null
  cancellationReason?:
    | 'client_request'
    | 'provider_unavailable'
    | 'client_no_show'
    | 'emergency'
    | 'other'
    | null
  cancellationReasonText?: string | null
  clientProfileId: string
  firstname: string
  lastname: string
  clientStage: ProviderCalendarClientStage
}

export type ListProviderAppointmentsQuery = {
  from: string
  to: string
  type?: ProviderCalendarAppointmentType
  status?: ProviderCalendarAppointmentStatus
}

export type ListProviderAppointmentsResponse = {
  timezone: string
  appointments: ProviderAppointmentListItem[]
}

export type CreateProviderManualAppointmentRequest = {
  type: ProviderCalendarAppointmentType
  /**
   * UTC ISO date-time.
   */
  startAt: string
  /**
   * Required for consultation. Ignored for discovery (fixed 15).
   */
  durationMinutes?: number
  /**
   * Client profile ID (uuid).
   */
  clientProfileId: string
  notes?: string | null
}

export type CreateProviderManualAppointmentResponse = {
  appointmentId: string
  startAt: string
  endAt: string
}

export type UpdateProviderAppointmentRequest = {
  startAt?: string
  durationMinutes?: number
  notes?: string | null
}

export type UpdateProviderAppointmentResponse = {
  appointmentId: string
  startAt: string
  endAt: string
  durationMinutes: number
  notes?: string | null
}

export type CancelProviderAppointmentRequest = {
  reason: 'PROVIDER_UNAVAILABLE' | 'CLIENT_REQUEST' | 'EMERGENCY' | 'OTHER'
  reasonText?: string | null
}

export type CancelProviderAppointmentResponse = {
  appointmentId: string
  cancelled: boolean
  alreadyCancelled: boolean
  notification: {
    attempted: boolean
    sent: boolean
    alreadySent: boolean
  }
}
