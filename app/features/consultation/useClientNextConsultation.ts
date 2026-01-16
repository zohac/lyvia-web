/**
 * Composable for fetching and managing client next consultation state.
 *
 * Provides reactive state for the dashboard card including:
 * - Loading/error states
 * - Derived display state (onboarding required, awaiting payment, confirmed, etc.)
 * - Formatted date/time and price utilities
 *
 * @see Ticket RF6 - Front : dashboard cliente (CTA paiement RDV assigné)
 */

import type {
  GetNextClientConsultationResponse,
  ConsultationDashboardState
} from './api/next-consultation.contract'
import { getNextClientConsultation } from './services/client-consultation.service'
import { mapNextConsultationErrorToMessage } from './api/next-consultation-error'
import {
  formatPrice,
  formatDateLong,
  formatDateShort,
  formatTime,
  formatTimeRange
} from './domain/formatting'

// Re-export formatting functions for backwards compatibility
export { formatPrice, formatDateLong, formatDateShort, formatTime, formatTimeRange }

/**
 * Derives the UI display state from the API response.
 *
 * @param response - API response from /client/consultations/next
 * @returns Discriminated union for simplified UI rendering
 */
function deriveDisplayState(response: GetNextClientConsultationResponse): ConsultationDashboardState {
  // Gate 1: Onboarding not completed
  if (!response.onboardingCallDone) {
    return { kind: 'onboarding_required' }
  }

  // Gate 2: No assigned consultation
  if (!response.hasAssignedConsultation || !response.appointmentId) {
    return { kind: 'no_consultation' }
  }

  // Gate 3: Consultation is paid
  if (response.paymentStatus === 'paid') {
    return {
      kind: 'payment_confirmed',
      appointmentId: response.appointmentId,
      scheduledAt: new Date(response.scheduledAt!),
      durationMinutes: response.durationMinutes!
    }
  }

  // Default: Awaiting payment (unpaid or not_required treated as awaiting)
  return {
    kind: 'awaiting_payment',
    appointmentId: response.appointmentId,
    scheduledAt: new Date(response.scheduledAt!),
    durationMinutes: response.durationMinutes!,
    amountCents: response.amountCents!,
    currency: response.currency ?? 'EUR'
  }
}

/**
 * Composable for client next consultation dashboard state.
 *
 * Usage:
 * ```ts
 * const { pending, errorMessage, displayState, refresh } = await useClientNextConsultation()
 * ```
 */
export async function useClientNextConsultation() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const rawResponse = ref<GetNextClientConsultationResponse | null>(null)

  /**
   * Derived display state computed from raw response.
   * Returns null during loading or on error.
   */
  const displayState = computed<ConsultationDashboardState | null>(() => {
    if (!rawResponse.value) return null
    return deriveDisplayState(rawResponse.value)
  })

  /**
   * Convenience getters for common checks
   */
  const isOnboardingRequired = computed(() => displayState.value?.kind === 'onboarding_required')
  const hasNoConsultation = computed(() => displayState.value?.kind === 'no_consultation')
  const isAwaitingPayment = computed(() => displayState.value?.kind === 'awaiting_payment')
  const isPaymentConfirmed = computed(() => displayState.value?.kind === 'payment_confirmed')

  /**
   * Fetches (or re-fetches) the next consultation from the API.
   */
  async function refresh() {
    pending.value = true
    errorMessage.value = null

    try {
      rawResponse.value = await getNextClientConsultation()
    } catch (err) {
      errorMessage.value = mapNextConsultationErrorToMessage(err)
      rawResponse.value = null
    } finally {
      pending.value = false
    }
  }

  // Initial fetch
  await refresh()

  return {
    // State
    pending,
    errorMessage,
    rawResponse,
    displayState,

    // Convenience booleans
    isOnboardingRequired,
    hasNoConsultation,
    isAwaitingPayment,
    isPaymentConfirmed,

    // Actions
    refresh
  }
}
