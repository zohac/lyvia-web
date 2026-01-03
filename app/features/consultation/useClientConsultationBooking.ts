import { ApiFetchError } from '../../services/api/api-error'
import type { PublicTenantResponse } from '../onboarding/api/onboarding.contract'
import { buildConsultationAvailabilityRange } from './domain/range'
import type {
  ConsultationPricePlan,
  CreateConsultationCheckoutSessionResponse,
  ListConsultationPricePlansResponse,
  ProviderAvailabilityResponse
} from './api/consultation.contract'
import { extractValidationFieldErrors, mapConsultationErrorToMessage } from './api/consultation-error'
import { getActiveConsultationPricePlans } from './domain/pricing'
import { createConsultationCheckoutSession, listConsultationPricePlans, listConsultationSlots, resolveTenantByHost } from './services/client-consultation.service'

export type ClientConsultationBookingState = {
  tenant: PublicTenantResponse | null
  pricing: ListConsultationPricePlansResponse | null
  activePlans: ConsultationPricePlan[]
  selectedPricePlanId: string | null
  availability: ProviderAvailabilityResponse | null
  selectedStartAt: string | null
  pending: boolean
  errorMessage: string | null
  actionPending: boolean
  actionErrorCode: string | null
  actionErrorMessage: string | null
  actionFieldErrors: Record<string, string>
  actionErrorDetails: unknown
  pendingPayment: CreateConsultationCheckoutSessionResponse | null
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)
}

export async function useClientConsultationBooking() {
  const route = useRoute()

  const state = reactive<ClientConsultationBookingState>({
    tenant: null,
    pricing: null,
    activePlans: [],
    selectedPricePlanId: null,
    availability: null,
    selectedStartAt: null,
    pending: true,
    errorMessage: null,
    actionPending: false,
    actionErrorCode: null,
    actionErrorMessage: null,
    actionFieldErrors: {},
    actionErrorDetails: null,
    pendingPayment: null
  })

  const providerIdFromQuery = computed(() => {
    const raw = route.query.providerId
    if (typeof raw !== 'string') return null
    const value = raw.trim()
    return isUuidLike(value) ? value : null
  })

  const providerId = computed(() => {
    if (state.tenant?.brand.mode === 'custom_domain') return state.tenant.providerId
    return providerIdFromQuery.value ?? state.tenant?.providerId ?? null
  })

  const selectedPricePlan = computed(() => {
    const id = state.selectedPricePlanId
    if (!id) return null
    return state.activePlans.find(plan => plan.id === id) ?? null
  })

  async function ensureTenant(): Promise<void> {
    if (state.tenant) return

    if (providerIdFromQuery.value) {
      try {
        state.tenant = await resolveTenantByHost()
      } catch {
        state.tenant = null
      }
      return
    }

    try {
      state.tenant = await resolveTenantByHost()
    } catch (err) {
      state.tenant = null
      state.errorMessage = mapConsultationErrorToMessage(err, 'Impossible de déterminer le coach sur ce domaine.')
      throw err
    }
  }

  async function refreshAvailability(): Promise<void> {
    state.pending = true
    state.errorMessage = null

    try {
      await ensureTenant()
      const resolvedProviderId = providerId.value
      if (!resolvedProviderId) {
        state.errorMessage = 'Impossible de déterminer le coach. Ouvrez ce parcours depuis la page coach.'
        return
      }

      state.pricing = await listConsultationPricePlans(resolvedProviderId)
      state.activePlans = getActiveConsultationPricePlans(state.pricing.plans)

      if (state.activePlans.length === 0) {
        state.errorMessage = 'Aucun tarif de consultation n’est disponible pour le moment.'
        state.availability = null
        state.selectedPricePlanId = null
        return
      }

      if (state.selectedPricePlanId && !state.activePlans.some(plan => plan.id === state.selectedPricePlanId)) {
        state.selectedPricePlanId = null
        state.selectedStartAt = null
        state.availability = null
      }

      if (state.activePlans.length === 1 && !state.selectedPricePlanId) {
        state.selectedPricePlanId = state.activePlans[0]!.id
      }

      if (state.activePlans.length > 1 && !state.selectedPricePlanId) {
        state.availability = null
        return
      }

      const planId = state.selectedPricePlanId
      if (!planId) {
        state.availability = null
        return
      }

      const range = buildConsultationAvailabilityRange(14)
      state.availability = await listConsultationSlots({
        providerId: resolvedProviderId,
        from: range.from,
        to: range.to,
        pricePlanId: planId
      })
    } catch (err) {
      if (err instanceof ApiFetchError && err.apiError.code === 'PRICE_PLAN_INACTIVE') {
        state.selectedPricePlanId = null
        state.selectedStartAt = null
        state.availability = null
      }
      state.errorMessage = mapConsultationErrorToMessage(err)
    } finally {
      state.pending = false
    }
  }

  function clearActionErrors() {
    state.actionErrorCode = null
    state.actionErrorMessage = null
    state.actionFieldErrors = {}
    state.actionErrorDetails = null
  }

  function clearSelection() {
    state.selectedStartAt = null
  }

  function selectPricePlan(pricePlanId: string | null) {
    state.selectedPricePlanId = pricePlanId
    clearSelection()
    state.pendingPayment = null
    void refreshAvailability()
  }

  async function startCheckout(input: { successPath: string, cancelPath: string }): Promise<CreateConsultationCheckoutSessionResponse | null> {
    if (state.actionPending) return null

    clearActionErrors()

    if (!state.selectedPricePlanId) {
      state.actionErrorMessage = 'Choisissez un tarif pour afficher les créneaux.'
      return null
    }

    if (!state.selectedStartAt) {
      state.actionErrorMessage = 'Sélectionnez un créneau pour continuer.'
      return null
    }

    const resolvedProviderId = providerId.value
    if (!resolvedProviderId) {
      state.actionErrorMessage = 'Coach introuvable.'
      return null
    }

    state.actionPending = true

    try {
      const { successPath, cancelPath } = input
      const origin = import.meta.client ? window.location.origin : ''
      const response = await createConsultationCheckoutSession({
        providerId: resolvedProviderId,
        pricePlanId: state.selectedPricePlanId,
        slotStartAt: state.selectedStartAt,
        returnUrls: {
          success: `${origin}${successPath}`,
          cancel: `${origin}${cancelPath}`
        }
      })
      state.pendingPayment = response
      return response
    } catch (err) {
      if (err instanceof ApiFetchError) {
        state.actionErrorCode = err.apiError.code
        state.actionErrorDetails = err.apiError.details
        if (err.apiError.code === 'SLOT_ALREADY_BOOKED') {
          state.actionErrorMessage = mapConsultationErrorToMessage(err)
          await refreshAvailability()
          clearSelection()
          return null
        }
        if (err.apiError.code === 'PRICE_PLAN_INACTIVE') {
          state.actionErrorMessage = mapConsultationErrorToMessage(err)
          state.selectedPricePlanId = null
          clearSelection()
          await refreshAvailability()
          return null
        }
        if (err.apiError.statusCode === 422 || err.apiError.code === 'VALIDATION_ERROR') {
          state.actionFieldErrors = extractValidationFieldErrors(err.apiError.details)
          state.actionErrorMessage = Object.keys(state.actionFieldErrors).length > 0 ? null : mapConsultationErrorToMessage(err)
          return null
        }
      }
      state.actionErrorMessage = mapConsultationErrorToMessage(err)
      return null
    } finally {
      state.actionPending = false
    }
  }

  await refreshAvailability()

  return {
    state,
    providerId,
    selectedPricePlan,
    selectPricePlan,
    refreshAvailability,
    clearActionErrors,
    startCheckout,
    clearSelection
  }
}
