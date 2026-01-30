import { mapFinanceErrorToMessage } from './api/finance-error'
import type { ProviderFinanceSummary } from './api/finance.contract'
import { buildProviderFinanceUiState, mapStripeRequirementsToSteps, mapAllStripeRequirements } from './domain/finance-state'
import { getProviderFinanceSummary, startProviderStripeConnectOnboarding } from './services/provider-finance.service'

export async function useProviderFinance() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const summary = ref<ProviderFinanceSummary | null>(null)

  const actionPending = ref(false)
  const actionErrorMessage = ref<string | null>(null)

  async function refresh() {
    pending.value = true
    errorMessage.value = null

    try {
      summary.value = await getProviderFinanceSummary()
    } catch (err) {
      errorMessage.value = mapFinanceErrorToMessage(err)
    } finally {
      pending.value = false
    }
  }

  await refresh()

  const uiState = computed(() => {
    if (!summary.value) return null
    return buildProviderFinanceUiState(summary.value)
  })

  const requirementSteps = computed(() => {
    const state = uiState.value
    if (!state) return []
    return mapStripeRequirementsToSteps(state.stripe.requirementsDue)
  })

  const requirementAlerts = computed(() => {
    const state = uiState.value
    if (!state) return []
    return mapAllStripeRequirements(state.stripe)
  })

  function clearActionError() {
    actionErrorMessage.value = null
  }

  async function startConnect() {
    if (actionPending.value) return

    actionPending.value = true
    actionErrorMessage.value = null

    try {
      const response = await startProviderStripeConnectOnboarding()
      if (import.meta.client && isValidStripeUrl(response.onboardingUrl)) {
        window.location.assign(response.onboardingUrl)
      }
    } catch (err) {
      actionErrorMessage.value = mapFinanceErrorToMessage(err)
    } finally {
      actionPending.value = false
    }
  }

  return {
    pending,
    errorMessage,
    summary,
    uiState,
    requirementSteps,
    requirementAlerts,
    refresh,
    startConnect,
    actionPending,
    actionErrorMessage,
    clearActionError
  }
}
