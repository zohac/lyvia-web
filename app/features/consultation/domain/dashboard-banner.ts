/**
 * Pure helpers for the client dashboard action banner (Story 0.21).
 *
 * Resolves:
 * - The payment action banner (title + pay URL) when the client has an
 *   awaiting-payment consultation assigned by a provider.
 * - The greeting subtitle, personalized on first visit with an awaiting
 *   payment (no payment history yet).
 *
 * Extracted as pure functions to be unit-testable without Vue/Nuxt runtime.
 */

import type { ConsultationDashboardState } from '../api/next-consultation.contract'
import { formatDateLong, formatPrice, formatTime } from './formatting'

export type DashboardPaymentBanner = {
  title: string
  url: string
}

export const DEFAULT_PROVIDER_FALLBACK = 'Votre coach'
export const DEFAULT_GREETING_SUBTITLE = 'Votre espace accompagnement'

/**
 * Resolves the payment action banner to show at the top of the dashboard.
 *
 * Returns `null` when no banner should be rendered (any state other than
 * `awaiting_payment`, or while state is still loading).
 *
 * AC-3 mandate: the title MUST include the coach name, the formatted date,
 * and the amount. Removing any of these three is a regression and is covered
 * by `dashboard-banner.test.ts`.
 */
export function resolvePaymentBanner(
  state: ConsultationDashboardState | null
): DashboardPaymentBanner | null {
  if (!state || state.kind !== 'awaiting_payment') return null

  const providerName = state.providerDisplayName ?? DEFAULT_PROVIDER_FALLBACK
  const formattedDate = formatDateLong(state.scheduledAt)
  const formattedTime = formatTime(state.scheduledAt)
  const formattedAmount = formatPrice(state.amountCents)

  return {
    title: `${providerName} vous a planifié une consultation le ${formattedDate} à ${formattedTime}. Montant : ${formattedAmount}. Réglez le paiement pour confirmer votre rendez-vous.`,
    url: `/client/consultation/pay?appointmentId=${state.appointmentId}`
  }
}

/**
 * Resolves the greeting subtitle shown under the page header.
 *
 * Returns a personalized "welcome" message on first visit (no payment history
 * yet) when a consultation is awaiting payment. Falls back to the default
 * subtitle otherwise.
 */
export function resolveGreetingSubtitle(input: {
  state: ConsultationDashboardState | null
  paymentsCount: number
  paymentsPending: boolean
}): string {
  const { state, paymentsCount, paymentsPending } = input

  if (
    state?.kind === 'awaiting_payment'
    && paymentsCount === 0
    && !paymentsPending
  ) {
    const providerName = state.providerDisplayName ?? DEFAULT_PROVIDER_FALLBACK
    return `Bienvenue dans votre espace — ${providerName} vous accompagne`
  }

  return DEFAULT_GREETING_SUBTITLE
}
