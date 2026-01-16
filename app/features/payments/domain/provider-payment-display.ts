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
 * Formats Stripe fees, returning null if not available.
 *
 * @param stripeFeeCents - Stripe fee in cents, or null if unavailable
 * @param currency - ISO 4217 currency code
 * @param locale - BCP 47 locale (default: 'fr-FR')
 * @returns Formatted string or null
 */
export function formatStripeFee(
  stripeFeeCents: number | null,
  currency: string,
  locale = 'fr-FR'
): string | null {
  if (stripeFeeCents === null) return null
  return formatCentsToCurrency(stripeFeeCents, currency, locale)
}

export type FormattedProviderPayment = {
  amount: string
  platformFee: string
  stripeFee: string | null
  net: string
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
    stripeFee: formatStripeFee(payment.stripeFeeCents, payment.currency, locale),
    net: formatCentsToCurrency(payment.netAmountCents, payment.currency, locale)
  }
}
