import { readonly, ref, watch } from 'vue'
import type { AnalyticsPeriod, ProviderAnalyticsResponse } from './api/analytics.contract'
import { apiFetch } from '~/services/api/apiFetch'

export function useProviderAnalytics() {
  const data = ref<ProviderAnalyticsResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const period = ref<AnalyticsPeriod>('month')

  async function fetchAnalytics(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      data.value = await apiFetch<ProviderAnalyticsResponse>('/provider/analytics', {
        query: { period: period.value }
      })
    } catch {
      error.value = 'Impossible de charger les analytics'
    } finally {
      loading.value = false
    }
  }

  watch(period, () => void fetchAnalytics())

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    period,
    fetchAnalytics
  }
}
