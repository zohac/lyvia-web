/**
 * Composable for provider requests badge (US-6).
 *
 * Provides a reactive count of pending requests for navigation badge.
 * Fetches count on mount and can be manually refreshed.
 */

import { listProviderRequests } from './services/provider-requests.service'

export function useProviderRequestsBadge() {
  const pendingCount = ref(0)
  const loading = ref(false)

  /**
   * Fetch pending count
   */
  async function refresh() {
    loading.value = true
    try {
      const response = await listProviderRequests('pending')
      pendingCount.value = response.meta.pending
    } catch {
      // Silent fail - badge is not critical
    } finally {
      loading.value = false
    }
  }

  return {
    pendingCount,
    loading,
    refresh
  }
}
