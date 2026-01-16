import type { StripeConnectStatus } from '../finance/api/finance.contract'
import { getProviderStripeStatus } from '../finance/services/provider-finance.service'
import { computeBlockedState } from './stripe-blocked-state'

export type { ProviderStripeBlockedState } from './stripe-blocked-state'
export { computeBlockedState } from './stripe-blocked-state'

/**
 * Composable to track Stripe account blocked status across the provider dashboard.
 *
 * Fetches status on mount and provides reactive blocked state.
 */
export function useProviderStripeStatus() {
  const status = ref<StripeConnectStatus | null>(null)
  const pending = ref(true)
  const error = ref<Error | null>(null)

  const blockedState = computed(() => computeBlockedState(status.value))
  const isBlocked = computed(() => blockedState.value.isBlocked)
  const blockMessage = computed(() => blockedState.value.blockMessage)

  async function refresh() {
    pending.value = true
    error.value = null

    try {
      status.value = await getProviderStripeStatus()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch Stripe status')
    } finally {
      pending.value = false
    }
  }

  // Auto-fetch on first use
  if (import.meta.client) {
    onMounted(() => {
      void refresh()
    })
  }

  return {
    status,
    pending,
    error,
    isBlocked,
    blockMessage,
    refresh
  }
}
