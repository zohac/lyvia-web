import { apiFetch } from '../../../services/api/apiFetch'
import type { ProviderFinanceSummary, StripeConnectOnboardingResponse, StripeConnectStatus } from '../api/finance.contract'

export async function getProviderFinanceSummary(): Promise<ProviderFinanceSummary> {
  return await apiFetch<ProviderFinanceSummary>('/provider/finance/summary')
}

export async function getProviderStripeStatus(): Promise<StripeConnectStatus> {
  return await apiFetch<StripeConnectStatus>('/provider/stripe/status')
}

export async function startProviderStripeConnectOnboarding(): Promise<StripeConnectOnboardingResponse> {
  return await apiFetch<StripeConnectOnboardingResponse>('/provider/stripe/connect', {
    method: 'POST'
  })
}
