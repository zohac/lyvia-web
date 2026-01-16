/**
 * Composable for managing assigned consultation payment flow.
 *
 * Handles:
 * - Loading payment context from backend
 * - Creating checkout session
 * - Managing UI states (loading, error, ready, action pending)
 * - Resuming pending payments
 *
 * @see Ticket RF1 - Front : page paiement consultation (créneau assigné)
 * @see Ticket RF2 - Front : création checkout (RDV assigné) + redirection Stripe
 * @see Ticket RF7 - Front : returnUrls respectent le domaine (white-label)
 */

import type {
  GetAppointmentPaymentContextResponse,
  PaymentPageState
} from './api/payment-context.contract'
import {
  getAppointmentPaymentContext,
  createAssignedConsultationCheckout
} from './services/client-consultation.service'
import {
  mapPaymentContextErrorToMessage,
  mapCheckoutErrorToMessage,
  isPaymentAlreadyCompleted
} from './api/payment-context-error'
import {
  buildCheckoutReturnUrls,
  getCurrentOrigin,
  isValidReturnUrl,
  type CheckoutReturnUrls
} from './domain/return-urls'
import {
  formatPrice,
  formatDateLongWithYear,
  formatTime,
  formatTimeRange
} from './domain/formatting'

/**
 * Stores checkout metadata in sessionStorage for the success page.
 *
 * @param sessionId - Stripe session ID
 * @param meta - Checkout metadata to store
 */
function storeCheckoutMeta(
  sessionId: string,
  meta: {
    appointmentId: string
    pricePlanLabel: string | null
    durationMinutes: number
    slotStartAt: string
    timezone: string
    amountCents: number
    currency: 'EUR'
  }
): void {
  if (typeof window === 'undefined') return
  try {
    const key = `checkout_meta_${sessionId}`
    window.sessionStorage.setItem(key, JSON.stringify(meta))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Composable for assigned consultation payment page.
 *
 * @param appointmentId - UUID of the appointment to pay for (from query params)
 *
 * Usage:
 * ```ts
 * const payment = useAssignedConsultationPayment(appointmentId)
 * await payment.loadContext()
 * ```
 */
export function useAssignedConsultationPayment(appointmentId: Ref<string | null>) {
  // State
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const context = ref<GetAppointmentPaymentContextResponse | null>(null)
  const isAlreadyPaid = ref(false)

  // Action state
  const actionPending = ref(false)
  const actionErrorMessage = ref<string | null>(null)

  /**
   * Derived page state for template rendering.
   */
  const pageState = computed<PaymentPageState>(() => {
    if (!appointmentId.value) {
      return { kind: 'missing_appointment_id' }
    }

    if (pending.value) {
      return { kind: 'loading' }
    }

    if (isAlreadyPaid.value) {
      return {
        kind: 'already_paid',
        message: 'Ce rendez-vous a déjà été payé.'
      }
    }

    if (errorMessage.value) {
      return {
        kind: 'error',
        message: errorMessage.value
      }
    }

    if (context.value) {
      return {
        kind: 'ready',
        context: context.value,
        hasPendingPayment: !!context.value.stripeSessionId
      }
    }

    return {
      kind: 'error',
      message: 'État inattendu. Veuillez rafraîchir la page.'
    }
  })

  /**
   * Formatted display values for the payment context.
   */
  const displayValues = computed(() => {
    if (!context.value) return null

    const startDate = new Date(context.value.slotStartAt)
    const { timezone, durationMinutes, amountCents, pricePlanLabel } = context.value

    return {
      date: formatDateLongWithYear(startDate, timezone),
      time: formatTime(startDate, timezone),
      timeRange: formatTimeRange(startDate, durationMinutes, timezone),
      duration: `${durationMinutes} min`,
      price: formatPrice(amountCents),
      label: pricePlanLabel || 'Consultation',
      timezone
    }
  })

  /**
   * Load payment context from the API.
   */
  async function loadContext(): Promise<void> {
    if (!appointmentId.value) {
      pending.value = false
      return
    }

    pending.value = true
    errorMessage.value = null
    isAlreadyPaid.value = false

    try {
      context.value = await getAppointmentPaymentContext(appointmentId.value)
    } catch (err) {
      if (isPaymentAlreadyCompleted(err)) {
        isAlreadyPaid.value = true
      } else {
        errorMessage.value = mapPaymentContextErrorToMessage(err)
      }
      context.value = null
    } finally {
      pending.value = false
    }
  }

  /**
   * Build absolute return URLs for Stripe checkout.
   *
   * Uses window.location.origin to respect custom domains (RF7).
   *
   * @see Ticket RF7 - returnUrls respectent le domaine (white-label)
   */
  function buildReturnUrls(): CheckoutReturnUrls {
    return buildCheckoutReturnUrls(getCurrentOrigin())
  }

  /**
   * Initiate checkout for the assigned appointment.
   *
   * Creates a new Stripe session and redirects to checkout.
   */
  async function startCheckout(): Promise<void> {
    if (!appointmentId.value || !context.value) return

    actionPending.value = true
    actionErrorMessage.value = null

    try {
      const returnUrls = buildReturnUrls()

      // Validate return URLs before sending to backend
      if (!isValidReturnUrl(returnUrls.success) || !isValidReturnUrl(returnUrls.cancel)) {
        actionErrorMessage.value = 'Erreur de configuration. Veuillez rafraîchir la page.'
        actionPending.value = false
        return
      }

      const response = await createAssignedConsultationCheckout({
        appointmentId: appointmentId.value,
        returnUrls
      })

      // Store metadata for success page
      storeCheckoutMeta(response.stripe.sessionId, {
        appointmentId: appointmentId.value,
        pricePlanLabel: context.value.pricePlanLabel,
        durationMinutes: context.value.durationMinutes,
        slotStartAt: context.value.slotStartAt,
        timezone: context.value.timezone,
        amountCents: context.value.amountCents,
        currency: context.value.currency
      })

      // Redirect to Stripe checkout
      if (typeof window !== 'undefined') {
        window.location.assign(response.stripe.checkoutUrl)
      }
    } catch (err) {
      actionErrorMessage.value = mapCheckoutErrorToMessage(err)
      actionPending.value = false
    }
  }

  /**
   * Resume an existing pending payment by redirecting to Stripe.
   *
   * Used when a previous checkout was abandoned.
   */
  async function resumePendingPayment(): Promise<void> {
    if (!context.value?.stripeSessionId) return

    actionPending.value = true
    actionErrorMessage.value = null

    try {
      // For resuming, we need to create a new session
      // The old session may have expired
      await startCheckout()
    } catch (err) {
      actionErrorMessage.value = mapCheckoutErrorToMessage(err)
      actionPending.value = false
    }
  }

  return {
    // State
    pending,
    errorMessage,
    context,
    isAlreadyPaid,

    // Action state
    actionPending,
    actionErrorMessage,

    // Computed
    pageState,
    displayValues,

    // Actions
    loadContext,
    startCheckout,
    resumePendingPayment
  }
}
