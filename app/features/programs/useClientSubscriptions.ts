/**
 * X3.3 AC-7: Composable for loading client program subscriptions (provider view).
 *
 * Calls GET /provider/clients/:id/subscriptions.
 * Accepts reactive clientProfileId — re-fetches on change.
 */
import type { MaybeRefOrGetter } from 'vue'

import type { ProgramSubscriptionItem } from './api/program-subscription.contract'
import { listClientSubscriptions } from './services/client-subscriptions.service'

export function useClientSubscriptions(clientProfileId: MaybeRefOrGetter<string>) {
  const subscriptions = ref<ProgramSubscriptionItem[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const activeSubscriptions = computed(() =>
    subscriptions.value.filter(s => s.status === 'active' || s.status === 'frozen')
  )

  const hasActiveSubscriptions = computed(() => activeSubscriptions.value.length > 0)

  async function load() {
    const id = toValue(clientProfileId)
    if (!id) return

    loading.value = true
    error.value = null

    try {
      const response = await listClientSubscriptions(id)
      subscriptions.value = response.subscriptions
    } catch {
      error.value = 'Impossible de charger les souscriptions.'
      subscriptions.value = []
    } finally {
      loading.value = false
    }
  }

  // Re-fetch when clientProfileId changes
  watch(() => toValue(clientProfileId), () => load())

  return {
    subscriptions,
    activeSubscriptions,
    hasActiveSubscriptions,
    loading,
    error,
    load
  }
}
