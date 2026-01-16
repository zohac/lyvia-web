/**
 * Contract for the appointment payment context endpoint (RB3).
 *
 * This contract defines the response shape for fetching payment context
 * of an assigned consultation, used to display the payment page.
 *
 * @see Ticket RB3 - Backend/API : contexte paiement RDV assigné (client)
 * @see Ticket RF1 - Front : page paiement consultation (créneau assigné)
 */

/**
 * Response from GET /client/appointments/:id/payment-context
 *
 * Provides all context needed to display the payment page and initiate
 * checkout for an assigned consultation.
 */
export type GetAppointmentPaymentContextResponse = {
  /**
   * UUID of the appointment to pay for.
   */
  appointmentId: string

  /**
   * UUID of the provider (coach).
   */
  providerId: string

  /**
   * UUID of the consultation price plan.
   */
  pricePlanId: string

  /**
   * Scheduled date/time in UTC ISO format.
   * Must be formatted to provider's timezone for display.
   */
  slotStartAt: string

  /**
   * Duration of the consultation in minutes.
   */
  durationMinutes: number

  /**
   * Provider's timezone (e.g., "Europe/Paris").
   * Used for formatting the appointment date/time.
   */
  timezone: string

  /**
   * Human-readable label for the price plan (e.g., "Consultation 60 min").
   * May be null if plan has no label.
   */
  pricePlanLabel: string | null

  /**
   * Price in cents (e.g., 8000 = 80.00€).
   * Must be formatted with Intl.NumberFormat for display.
   */
  amountCents: number

  /**
   * Currency code (always EUR for V0).
   */
  currency: 'EUR'

  /**
   * UUID of an existing pending payment, if any.
   * Allows resuming a previous checkout attempt.
   */
  paymentId: string | null

  /**
   * Stripe session ID of an existing pending payment, if any.
   * Can be used to redirect back to Stripe checkout.
   */
  stripeSessionId: string | null
}

/**
 * Derived UI state for the payment page.
 *
 * Simplifies template rendering logic by providing discriminated states.
 */
export type PaymentPageState
  = | { kind: 'loading' }
    | { kind: 'missing_appointment_id' }
    | { kind: 'not_found', message: string }
    | { kind: 'already_paid', message: string }
    | { kind: 'error', message: string }
    | {
      kind: 'ready'
      context: GetAppointmentPaymentContextResponse
      hasPendingPayment: boolean
    }

/**
 * Request body for creating checkout session with assigned appointment.
 *
 * Uses appointmentId as the primary identifier (RB4/RB8 flow).
 */
export type CreateAssignedConsultationCheckoutRequest = {
  /**
   * UUID of the pre-assigned appointment.
   * Backend derives providerId, pricePlanId, slotStartAt from it.
   */
  appointmentId: string

  /**
   * Return URLs for Stripe checkout redirect.
   */
  returnUrls: {
    success: string
    cancel: string
  }
}
