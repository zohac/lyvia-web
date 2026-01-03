import type { ProviderPaymentListItem } from './api/provider-payments.contract'
import { mapClientPaymentsErrorToMessage } from './api/client-payments-error'
import { listProviderPayments } from './services/provider-payments.service'

export async function useProviderPayments() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const payments = ref<ProviderPaymentListItem[]>([])
  const nextCursor = ref<string | null>(null)

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  async function refresh() {
    pending.value = true
    errorMessage.value = null

    try {
      const response = await listProviderPayments({ limit: 20 })
      payments.value = response.payments
      nextCursor.value = response.page.nextCursor
    } catch (err) {
      errorMessage.value = mapClientPaymentsErrorToMessage(err, 'Impossible de charger les paiements.')
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (loadMorePending.value) return
    if (!nextCursor.value) return

    loadMorePending.value = true
    loadMoreErrorMessage.value = null

    try {
      const response = await listProviderPayments({ limit: 20, cursor: nextCursor.value })
      payments.value = [...payments.value, ...response.payments]
      nextCursor.value = response.page.nextCursor
    } catch (err) {
      loadMoreErrorMessage.value = mapClientPaymentsErrorToMessage(err, 'Impossible de charger plus de paiements.')
    } finally {
      loadMorePending.value = false
    }
  }

  await refresh()

  return {
    pending,
    errorMessage,
    payments,
    nextCursor,
    refresh,
    loadMore,
    loadMorePending,
    loadMoreErrorMessage
  }
}
