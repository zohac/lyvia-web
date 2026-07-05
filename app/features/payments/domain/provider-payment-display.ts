import type { ProviderPaymentListItem } from '../api/provider-payments.contract'

/**
 * Formats a currency amount in cents to a localized string.
 *
 * @param cents - Amount in cents
 * @param currency - ISO 4217 currency code (e.g., 'eur')
 * @param locale - BCP 47 locale (default: 'fr-FR')
 * @returns Formatted currency string (e.g., '100,00 €')
 */
export function formatCentsToCurrency(
  cents: number,
  currency: string,
  locale = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(cents / 100)
}

/**
 * Formats a nullable cents amount, returning null when the value is unavailable.
 *
 * Used for both the Stripe fee and the net amount (HF18): while the actual
 * Stripe fee is unknown, neither should be presented as an exact figure.
 *
 * @param cents - Amount in cents, or null if unavailable
 * @param currency - ISO 4217 currency code
 * @param locale - BCP 47 locale (default: 'fr-FR')
 * @returns Formatted string or null
 */
export function formatNullableCents(
  cents: number | null,
  currency: string,
  locale = 'fr-FR'
): string | null {
  if (cents === null) return null
  return formatCentsToCurrency(cents, currency, locale)
}

/**
 * @deprecated Use {@link formatNullableCents}. Kept as an alias for clarity.
 */
export const formatStripeFee = formatNullableCents

export type FormattedProviderPayment = {
  amount: string
  platformFee: string
  stripeFee: string | null
  // Null while the actual Stripe fee is unknown (HF18): render a placeholder, never an exact net.
  net: string | null
}

/**
 * Formats all monetary fields of a provider payment for display.
 *
 * @param payment - Provider payment with amounts in cents
 * @param locale - BCP 47 locale (default: 'fr-FR')
 * @returns Object with formatted currency strings
 */
export function formatProviderPaymentAmounts(
  payment: Pick<ProviderPaymentListItem, 'amountCents' | 'platformFeeCents' | 'stripeFeeCents' | 'netAmountCents' | 'currency'>,
  locale = 'fr-FR'
): FormattedProviderPayment {
  return {
    amount: formatCentsToCurrency(payment.amountCents, payment.currency, locale),
    platformFee: formatCentsToCurrency(payment.platformFeeCents, payment.currency, locale),
    stripeFee: formatNullableCents(payment.stripeFeeCents, payment.currency, locale),
    net: formatNullableCents(payment.netAmountCents, payment.currency, locale)
  }
}
