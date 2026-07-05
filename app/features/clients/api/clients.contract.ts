/**
 * Client stage in the journey (source of truth from ClientProfile).
 * 4-stage model validated by PM (2026-01-21).
 */
export type ProviderClientStage = 'discovery' | 'lead' | 'active' | 'paused'

/**
 * Computed status for display purposes.
 * Simplified: computedStatus = stage (4-stage model).
 */
export type ProviderClientStatus = 'discovery' | 'lead' | 'active' | 'paused'

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
  stage: ProviderClientStage
  onboardingCallDone: boolean
  currentProgramMonth: number | null
  computedStatus: ProviderClientStatus
  stats: ProviderClientStats
  createdAt: string
  /**
   * Indicates if the client has a discovery appointment currently scheduled
   * (not yet completed or cancelled). Used to prevent duplicate discovery bookings.
   */
  hasScheduledDiscovery: boolean
  /**
   * Indicates if the client has an active discovery (scheduled or completed).
   * Used by the calendar modal to determine discovery replanification eligibility.
   */
  hasActiveDiscovery: boolean
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
// verified against OpenAPI spec
export type AppointmentType = 'discovery' | 'consultation' | 'free_followup'

/**
 * Appointment status.
 */
export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed'

/**
 * Payment status for an appointment.
 */
// verified against OpenAPI spec
export type AppointmentPaymentStatus = 'not_required' | 'unpaid' | 'paid' | 'covered_by_program'

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
  stage: ProviderClientStage
  onboardingCallDone: boolean
  program: ProviderClientDetailProgram
  stats: ProviderClientDetailStats
  computedStatus: ProviderClientStatus
  /**
   * Whether the client has activated their account (logged in at least once).
   */
  isActivated: boolean
  /**
   * When the client was paused (ISO 8601), null if not paused.
   */
  pausedAt: string | null
  /**
   * Reason for pausing the client, null if not paused or no reason provided.
   */
  pauseReason: string | null
  timezone: string
  appointments: ProviderClientDetailAppointment[]
  payments: ProviderClientDetailPayment[]
}

/**
 * Response from resending activation email.
 */
export type ResendActivationResponse = {
  sent: boolean
  alreadyActivated?: boolean
}

// ============================================================================
// Provider Client Create / Update (Story 14-1)
// ============================================================================

/**
 * Request body for creating a client as a provider.
 */
export type CreateClientByProviderRequest = {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

/**
 * Request body for updating a client as a provider.
 * All fields optional — only changed fields should be sent.
 */
export type UpdateClientByProviderRequest = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

/**
 * Response from creating or updating a client as a provider.
 * (verified against OpenAPI ProviderClientResponseDto)
 */
export type ProviderClientResponse = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  stage: ProviderClientStage
  isActive: boolean
  createdAt: string
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
 *
 * HF18: `platformFeeCents`, `stripeFeeCents` and `netAmountCents` are optional
 * so the same component works for listings that do not expose fees. When
 * present, `stripeFeeCents`/`netAmountCents` may be null while the actual
 * Stripe fee is still unknown (never show an exact net computed with a 0 fee).
 */
export type PaymentDisplayItem = {
  id: string
  amountCents: number
  platformFeeCents?: number
  stripeFeeCents?: number | null
  netAmountCents?: number | null
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
  platformFeeCents: number
  // Actual Stripe fee in cents (HF18) – null until captured from Stripe.
  stripeFeeCents: number | null
  // Net amount – null while the actual Stripe fee is unknown (HF18).
  netAmountCents: number | null
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
