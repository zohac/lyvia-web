export type ProviderClientStatus = 'onboarding' | 'in_progress' | 'completed'

export type ProviderClientStats = {
  consultationsCompleted: number
  appointmentsTotal: number
  lastAppointmentAt: string | null
  nextAppointmentAt: string | null
}

export type ProviderClientDetailStats = {
  consultationsCompleted: number
  lastAppointmentAt: string | null
  nextConsultationAt: string | null
}

export type ProviderClientDetailProfile = {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
  phone: string
}

export type ProviderClientDetailProgram = {
  currentProgramMonth: number | null
  totalMonths: number
}

export type ProviderClientListItem = {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
  phone: string
  onboardingCallDone: boolean
  currentProgramMonth: number | null
  computedStatus: ProviderClientStatus
  stats: ProviderClientStats
  createdAt: string
}

export type ProviderClientsPage = {
  limit: number
  nextCursor: string | null
}

export type ListProviderClientsResponse = {
  items: ProviderClientListItem[]
  page: ProviderClientsPage
}

export type ListProviderClientsParams = {
  q?: string
  status?: ProviderClientStatus
  limit?: number
  cursor?: string
  sort?: 'createdAt' | 'lastname' | 'nextAppointmentAt'
}

/**
 * Appointment type for provider client detail.
 */
export type AppointmentType = 'discovery' | 'consultation'

/**
 * Appointment status.
 */
export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed'

/**
 * Payment status for an appointment.
 */
export type AppointmentPaymentStatus = 'not_required' | 'unpaid' | 'paid'

/**
 * Role that cancelled an appointment.
 */
export type CancelledByRole = 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'SYSTEM'

/**
 * Cancellation reason.
 */
export type CancellationReason
  = | 'client_request'
    | 'provider_unavailable'
    | 'client_no_show'
    | 'emergency'
    | 'other'

/**
 * Notification channel for appointments.
 */
export type NotificationChannel
  = | 'discovery_confirmation'
    | 'discovery_reminder_j1'
    | 'consultation_confirmation'
    | 'consultation_reminder_j1'
    | 'consultation_reminder_h2'

/**
 * Notification log status.
 */
export type NotificationLogStatus = 'sent' | 'failed' | 'skipped'

/**
 * Notification log item for an appointment.
 */
export type NotificationLogItem = {
  channel: NotificationChannel
  status: NotificationLogStatus
  createdAt: string
}

/**
 * Appointment item in provider client detail response.
 */
export type ProviderClientDetailAppointment = {
  id: string
  type: AppointmentType
  status: AppointmentStatus
  scheduledAt: string
  durationMinutes: number
  paymentStatus: AppointmentPaymentStatus
  pricePlanId: string | null
  notes: string | null
  cancelledAt: string | null
  cancelledByRole: CancelledByRole | null
  cancellationReason: CancellationReason | null
  cancellationReasonText: string | null
}

/**
 * Payment status.
 */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed'

/**
 * Payment item in provider client detail response.
 */
export type ProviderClientDetailPayment = {
  id: string
  status: PaymentStatus
  amountCents: number
  platformFeeCents: number
  currency: 'EUR'
  receiptUrl: string | null
  createdAt: string
  pricePlanId: string | null
}

export type ProviderClientDetailResponse = {
  client: ProviderClientDetailProfile
  onboardingCallDone: boolean
  program: ProviderClientDetailProgram
  stats: ProviderClientDetailStats
  computedStatus: ProviderClientStatus
  timezone: string
  appointments: ProviderClientDetailAppointment[]
  payments: ProviderClientDetailPayment[]
}

// ============================================================================
// Update Program Month (D3 / D5-b)
// ============================================================================

/**
 * Warning returned when updating program month while onboarding is not completed.
 */
export type UpdateProgramWarning = 'ONBOARDING_NOT_COMPLETED'

/**
 * Request body for updating client program month.
 */
export type UpdateProviderClientProgramRequest = {
  currentProgramMonth: number | null
}

/**
 * Response from updating client program month.
 */
export type UpdateProviderClientProgramResponse = {
  previousProgramMonth: number | null
  currentProgramMonth: number | null
  computedStatus: ProviderClientStatus
  updatedAt: string
  warning: UpdateProgramWarning | null
}

// ============================================================================
// Provider Client Appointments List (D5-c)
// ============================================================================

/**
 * Common appointment display fields used by AppointmentLine component.
 * Defines the minimal shape needed for appointment display.
 */
export type AppointmentDisplayItem = {
  id: string
  type: AppointmentType
  status: AppointmentStatus
  scheduledAt: string
  durationMinutes: number
  paymentStatus: AppointmentPaymentStatus
  cancellationReason: CancellationReason | null
  cancellationReasonText?: string | null
  notes?: string | null
  notifications?: NotificationLogItem[]
}

/**
 * Appointment item in paginated appointments list.
 */
export type ProviderClientAppointmentItem = {
  id: string
  type: AppointmentType
  status: AppointmentStatus
  scheduledAt: string
  durationMinutes: number
  paymentStatus: AppointmentPaymentStatus
  cancellationReason: CancellationReason | null
  notes: string | null
  notifications: NotificationLogItem[]
}

/**
 * Pagination info for appointments list.
 */
export type ProviderClientAppointmentsPage = {
  limit: number
  nextCursor: string | null
}

/**
 * Query params for fetching appointments list.
 */
export type ListProviderClientAppointmentsParams = {
  type?: AppointmentType
  status?: AppointmentStatus
  limit?: number
  cursor?: string
}

/**
 * Response from fetching paginated appointments.
 */
export type ListProviderClientAppointmentsResponse = {
  items: ProviderClientAppointmentItem[]
  page: ProviderClientAppointmentsPage
}

// ============================================================================
// Provider Client Payments List (D5-d)
// ============================================================================

/**
 * Common payment display fields used by PaymentLine component.
 * Defines the minimal shape needed for payment display.
 */
export type PaymentDisplayItem = {
  id: string
  amountCents: number
  currency: 'EUR'
  status: PaymentStatus
  receiptUrl: string | null
  createdAt: string
}

/**
 * Payment item in paginated payments list.
 */
export type ProviderClientPaymentItem = {
  id: string
  appointmentId: string | null
  amountCents: number
  currency: 'EUR'
  status: PaymentStatus
  receiptUrl: string | null
  createdAt: string
}

/**
 * Pagination info for payments list.
 */
export type ProviderClientPaymentsPage = {
  limit: number
  nextCursor: string | null
}

/**
 * Query params for fetching payments list.
 */
export type ListProviderClientPaymentsParams = {
  status?: PaymentStatus
  limit?: number
  cursor?: string
}

/**
 * Response from fetching paginated payments.
 */
export type ListProviderClientPaymentsResponse = {
  items: ProviderClientPaymentItem[]
  page: ProviderClientPaymentsPage
}
