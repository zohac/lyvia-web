/**
 * Contract for the client next consultation endpoint (RB7).
 *
 * This contract defines the response shape for fetching the next assigned
 * consultation for a client, used to display payment CTAs on the dashboard.
 *
 * @see Ticket RB7 - Backend/API : contexte dashboard cliente (RDV assigné)
 */

/**
 * Payment status for an assigned consultation.
 *
 * - `not_required`: Discovery calls or free appointments
 * - `unpaid`: Consultation assigned but not yet paid
 * - `paid`: Payment confirmed via Stripe webhook
 */
export type ConsultationPaymentStatus = 'not_required' | 'unpaid' | 'paid'

/**
 * Response from GET /client/consultations/next
 *
 * Provides the context needed to display the appropriate CTA on the client
 * dashboard based on their onboarding status and next consultation state.
 */
export type GetNextClientConsultationResponse = {
  /**
   * Whether the client has an assigned consultation waiting.
   * If false, the other appointment-related fields will be null.
   */
  hasAssignedConsultation: boolean

  /**
   * Whether the client has completed their discovery call.
   * Used to gate access to consultation booking/payment.
   */
  onboardingCallDone: boolean

  /**
   * UUID of the assigned appointment, if any.
   * Required for the payment flow redirect.
   */
  appointmentId: string | null

  /**
   * Scheduled date/time in UTC ISO format.
   * Must be formatted to Europe/Paris timezone for display.
   */
  scheduledAt: string | null

  /**
   * Duration of the consultation in minutes.
   */
  durationMinutes: number | null

  /**
   * Price in cents (e.g., 8000 = 80.00€).
   * Must be formatted with Intl.NumberFormat for display.
   */
  amountCents: number | null

  /**
   * Currency code (always EUR for V0).
   */
  currency: 'EUR' | null

  /**
   * Current payment status of the consultation.
   */
  paymentStatus: ConsultationPaymentStatus | null

  /**
   * Video conference meeting link (URL).
   * Present when the provider has added a link for the consultation.
   */
  meetingLink: string | null
}

/**
 * Derived display state for the consultation dashboard card.
 *
 * Used internally by the composable to simplify UI rendering logic.
 */
export type ConsultationDashboardState
  = | { kind: 'onboarding_required' }
    | { kind: 'no_consultation' }
    | {
      kind: 'awaiting_payment'
      appointmentId: string
      scheduledAt: Date
      durationMinutes: number
      amountCents: number
      currency: 'EUR'
    }
    | {
      kind: 'payment_confirmed'
      appointmentId: string
      scheduledAt: Date
      durationMinutes: number
      meetingLink: string | null
      /** Whether a request is pending (to be added by backend) */
      hasPendingRequest: boolean
      /** Whether appointment is eligible for request (> 24h) - computed locally */
      canRequest: boolean
    }
