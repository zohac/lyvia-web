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
  /**
   * Consultation price plan (provider-defined). Nullable for discovery or legacy data.
   */
  pricePlanId: string | null
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
  /**
   * Video meeting link (Google Meet, Zoom, Teams, etc.).
   * Only applicable for consultations.
   */
  meetingLink: string | null
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
  /**
   * Client profile ID (uuid).
   */
  clientProfileId: string
  /**
   * UTC ISO date-time.
   */
  startAt: string
  notes?: string | null
} & (
  | {
    type: 'discovery'
  }
  | {
    type: 'consultation'
    /**
     * Consultation only. The active price plan to apply.
     */
    pricePlanId: string
    /**
     * Video meeting link (Google Meet, Zoom, Teams, etc.).
     */
    meetingLink?: string | null
  }
)

export type CreateProviderManualAppointmentResponse = {
  appointmentId: string
  startAt: string
  endAt: string
  /**
   * True when the appointment is payable (consultation).
   */
  paymentRequired: boolean
  /**
   * Payment status for the appointment.
   */
  paymentStatus: ProviderCalendarPaymentStatus
  /**
   * Price plan applied (consultation only).
   */
  pricePlanId: string | null
  /**
   * Video meeting link (Google Meet, Zoom, Teams, etc.).
   * Only applicable for consultations.
   */
  meetingLink: string | null
}

export type UpdateProviderAppointmentRequest = {
  startAt?: string
  /**
   * Consultation only. Switch to another active price plan.
   */
  pricePlanId?: string
  notes?: string | null
  /**
   * Video meeting link (Google Meet, Zoom, Teams, etc.).
   * Only applicable for consultations.
   */
  meetingLink?: string | null
}

export type UpdateProviderAppointmentResponse = {
  appointmentId: string
  startAt: string
  endAt: string
  durationMinutes: number
  notes: string | null
  /**
   * Video meeting link (Google Meet, Zoom, Teams, etc.).
   */
  meetingLink: string | null
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

/**
 * PATCH /provider/appointments/:id/status
 * Mark a consultation as completed.
 */
export type UpdateProviderAppointmentStatusRequest = {
  status: 'completed'
}

export type UpdateProviderAppointmentStatusResponse = {
  appointmentId: string
  status: ProviderCalendarAppointmentStatus
}
