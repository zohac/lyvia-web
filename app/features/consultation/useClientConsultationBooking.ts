import { ApiFetchError } from '../../services/api/api-error'
import type { PublicTenantResponse } from '../onboarding/api/onboarding.contract'
import { buildConsultationAvailabilityRange } from './domain/range'
import { buildCheckoutReturnUrls, getCurrentOrigin, isValidReturnUrl } from './domain/return-urls'
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
  noticeMessage: string | null
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
    noticeMessage: null,
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

  function buildPricePlanMismatchMessage(): string {
    return 'Le tarif sélectionné n’est plus disponible ou ne correspond pas à ce coach. Choisissez un autre tarif.'
  }

  function isPricePlanRelatedValidation(details: unknown): boolean {
    const fieldErrors = extractValidationFieldErrors(details)
    return Boolean(fieldErrors.pricePlanId || fieldErrors.providerId)
  }

  async function refreshPricingOnly(resolvedProviderId: string): Promise<void> {
    state.pricing = await listConsultationPricePlans(resolvedProviderId)
    state.activePlans = getActiveConsultationPricePlans(state.pricing.plans)

    if (state.activePlans.length === 0) {
      state.errorMessage = 'Aucun tarif de consultation n’est disponible pour le moment.'
      state.availability = null
      state.selectedPricePlanId = null
      state.selectedStartAt = null
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
  }

  async function refreshSlotsOnly(resolvedProviderId: string): Promise<void> {
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
  }

  async function recoverFromInvalidPricePlan(params: { resolvedProviderId: string, message: string }): Promise<void> {
    state.noticeMessage = params.message
    state.selectedPricePlanId = null
    state.selectedStartAt = null
    state.availability = null
    state.pendingPayment = null

    try {
      await refreshPricingOnly(params.resolvedProviderId)
      if (state.selectedPricePlanId) {
        try {
          await refreshSlotsOnly(params.resolvedProviderId)
        } catch {
          state.availability = null
        }
      }
    } catch {
      state.errorMessage = 'Impossible de recharger les tarifs. Réessayez dans quelques instants.'
    }
  }

  async function refreshAvailability(): Promise<void> {
    state.pending = true
    state.errorMessage = null
    state.noticeMessage = null

    try {
      await ensureTenant()
      const resolvedProviderId = providerId.value
      if (!resolvedProviderId) {
        state.errorMessage = 'Impossible de déterminer le coach. Ouvrez ce parcours depuis la page coach.'
        return
      }

      await refreshPricingOnly(resolvedProviderId)
      if (state.errorMessage) return

      if (state.activePlans.length > 1 && !state.selectedPricePlanId) {
        state.availability = null
        return
      }

      try {
        await refreshSlotsOnly(resolvedProviderId)
      } catch (err) {
        if (err instanceof ApiFetchError) {
          if (err.apiError.code === 'PRICE_PLAN_INACTIVE') {
            await recoverFromInvalidPricePlan({
              resolvedProviderId,
              message: mapConsultationErrorToMessage(err)
            })
            return
          }
          if (err.apiError.statusCode === 422 && err.apiError.code === 'VALIDATION_ERROR' && isPricePlanRelatedValidation(err.apiError.details)) {
            await recoverFromInvalidPricePlan({
              resolvedProviderId,
              message: buildPricePlanMismatchMessage()
            })
            return
          }
        }
        throw err
      }
    } catch (err) {
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
    state.noticeMessage = null
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
      // RF7: Use domain function to build return URLs respecting custom domains
      const returnUrls = buildCheckoutReturnUrls(getCurrentOrigin(), {
        success: successPath,
        cancel: cancelPath
      })

      // Validate return URLs before sending to backend
      if (!isValidReturnUrl(returnUrls.success) || !isValidReturnUrl(returnUrls.cancel)) {
        state.actionErrorMessage = 'Erreur de configuration. Veuillez rafraîchir la page.'
        return null
      }

      const response = await createConsultationCheckoutSession({
        providerId: resolvedProviderId,
        pricePlanId: state.selectedPricePlanId,
        slotStartAt: state.selectedStartAt,
        returnUrls
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
          state.actionErrorMessage = 'Ce tarif n’est plus disponible.'
          const resolvedProviderId = providerId.value
          if (resolvedProviderId) {
            await recoverFromInvalidPricePlan({
              resolvedProviderId,
              message: state.actionErrorMessage
            })
          } else {
            state.selectedPricePlanId = null
            clearSelection()
          }
          return null
        }
        if (err.apiError.statusCode === 422 && err.apiError.code === 'VALIDATION_ERROR') {
          state.actionFieldErrors = extractValidationFieldErrors(err.apiError.details)
          if (isPricePlanRelatedValidation(err.apiError.details)) {
            state.actionErrorMessage = buildPricePlanMismatchMessage()
            const resolvedProviderId = providerId.value
            if (resolvedProviderId) {
              await recoverFromInvalidPricePlan({
                resolvedProviderId,
                message: state.actionErrorMessage
              })
            } else {
              state.selectedPricePlanId = null
              clearSelection()
            }
            return null
          }

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
