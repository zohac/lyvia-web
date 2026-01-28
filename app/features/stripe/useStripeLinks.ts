/**
 * Composable for Stripe dashboard links (US-7).
 *
 * Provides helper functions for generating Stripe dashboard URLs
 * and determining if a refund action should be shown.
 */

const STRIPE_DASHBOARD_BASE = 'https://dashboard.stripe.com'

export function useStripeLinks() {
  const paymentsUrl = `${STRIPE_DASHBOARD_BASE}/payments`

  /**
   * Get URL to a specific payment or fallback to payments list
   */
  function getPaymentUrl(paymentIntentId: string | null | undefined): string {
    return paymentIntentId
      ? `${paymentsUrl}/${paymentIntentId}`
      : paymentsUrl
  }

  /**
   * Check if refund button should be shown for an appointment
   */
  function canRefund(appointment: {
    status: string
    paymentStatus: string
  }): boolean {
    return appointment.status === 'cancelled'
      && appointment.paymentStatus === 'paid'
  }

  return {
    paymentsUrl,
    getPaymentUrl,
    canRefund
  }
}
