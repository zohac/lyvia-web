import type { ConsultationPricePlan } from '../consultation/api/consultation.contract'
import { ApiFetchError } from '../../services/api/api-error'
import {
  extractProviderConsultationPricingFieldErrors,
  mapProviderConsultationPricingErrorToMessage,
  type ProviderConsultationPricingFieldErrors
} from './api/provider-consultation-pricing-error'
import type { CreateConsultationPricePlanRequest, UpdateConsultationPricePlanRequest } from './api/provider-consultation-pricing.contract'
import {
  createMyConsultationPricePlan,
  listMyConsultationPricePlans,
  updateMyConsultationPricePlan
} from './services/provider-consultation-pricing.service'

export async function useProviderConsultationPricing() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const plans = ref<ConsultationPricePlan[]>([])

  const createPending = ref(false)
  const createErrorMessage = ref<string | null>(null)
  const createFieldErrors = ref<ProviderConsultationPricingFieldErrors>({})

  const updatePendingPlanIds = reactive(new Set<string>())
  const updateErrorMessage = ref<string | null>(null)
  const updateFieldErrors = ref<Record<string, ProviderConsultationPricingFieldErrors>>({})

  async function refresh() {
    pending.value = true
    errorMessage.value = null

    try {
      const response = await listMyConsultationPricePlans()
      plans.value = response.plans
    } catch (err) {
      errorMessage.value = mapProviderConsultationPricingErrorToMessage(err)
    } finally {
      pending.value = false
    }
  }

  function clearCreateError() {
    createErrorMessage.value = null
    createFieldErrors.value = {}
  }

  function isPlanUpdating(planId: string): boolean {
    return updatePendingPlanIds.has(planId)
  }

  function clearUpdateError() {
    updateErrorMessage.value = null
    updateFieldErrors.value = {}
  }

  function setPlanUpdateFieldErrors(planId: string, errors: ProviderConsultationPricingFieldErrors) {
    updateFieldErrors.value = {
      ...updateFieldErrors.value,
      [planId]: errors
    }
  }

  async function createPlan(payload: CreateConsultationPricePlanRequest): Promise<string | null> {
    if (createPending.value) return null

    createPending.value = true
    clearCreateError()

    try {
      const response = await createMyConsultationPricePlan(payload)
      await refresh()
      return response.planId
    } catch (err) {
      createErrorMessage.value = mapProviderConsultationPricingErrorToMessage(err, 'Impossible de créer le tarif.')
      if (err instanceof ApiFetchError && err.apiError.statusCode === 422) {
        createFieldErrors.value = extractProviderConsultationPricingFieldErrors(err.apiError.details)
      }
      return null
    } finally {
      createPending.value = false
    }
  }

  async function patchPlan(planId: string, payload: UpdateConsultationPricePlanRequest): Promise<boolean> {
    if (updatePendingPlanIds.has(planId)) return false

    updatePendingPlanIds.add(planId)
    updateErrorMessage.value = null
    setPlanUpdateFieldErrors(planId, {})

    try {
      await updateMyConsultationPricePlan(planId, payload)
      return true
    } catch (err) {
      updateErrorMessage.value = mapProviderConsultationPricingErrorToMessage(err, 'Impossible de mettre à jour le tarif.')
      if (err instanceof ApiFetchError && err.apiError.statusCode === 422) {
        setPlanUpdateFieldErrors(planId, extractProviderConsultationPricingFieldErrors(err.apiError.details))
      }
      return false
    } finally {
      updatePendingPlanIds.delete(planId)
    }
  }

  async function togglePlanActive(planId: string, nextActive: boolean): Promise<boolean> {
    clearUpdateError()
    const ok = await patchPlan(planId, { isActive: nextActive })
    if (!ok) return false
    await refresh()
    return true
  }

  async function swapPlanSortOrder(planId: string, neighborPlanId: string): Promise<boolean> {
    clearUpdateError()

    const current = plans.value.find(plan => plan.id === planId)
    const neighbor = plans.value.find(plan => plan.id === neighborPlanId)
    if (!current || !neighbor) {
      updateErrorMessage.value = 'Tarif introuvable.'
      return false
    }

    const currentOrder = current.sortOrder
    const neighborOrder = neighbor.sortOrder
    const tempOrder = Math.max(currentOrder, neighborOrder) + 1000

    const step1 = await patchPlan(planId, { sortOrder: tempOrder })
    if (!step1) return false

    const step2 = await patchPlan(neighborPlanId, { sortOrder: currentOrder })
    if (!step2) {
      await patchPlan(planId, { sortOrder: currentOrder })
      return false
    }

    const step3 = await patchPlan(planId, { sortOrder: neighborOrder })
    if (!step3) {
      await patchPlan(neighborPlanId, { sortOrder: neighborOrder })
      await patchPlan(planId, { sortOrder: currentOrder })
      return false
    }

    await refresh()
    return true
  }

  await refresh()

  return {
    pending,
    errorMessage,
    plans,
    refresh,
    createPending,
    createErrorMessage,
    createFieldErrors,
    clearCreateError,
    createPlan,
    updatePendingPlanIds,
    updateErrorMessage,
    updateFieldErrors,
    isPlanUpdating,
    clearUpdateError,
    patchPlan,
    togglePlanActive,
    swapPlanSortOrder
  }
}
