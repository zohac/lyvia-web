import type { ProviderClientDetailResponse } from './api/clients.contract'
import { mapProviderClientDetailErrorToMessage } from './api/clients-error'
import { getProviderClientDetail } from './services/provider-client-detail.service'

export async function useProviderClientDetail(clientProfileId: string) {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const detail = ref<ProviderClientDetailResponse | null>(null)

  async function refresh() {
    pending.value = true
    errorMessage.value = null

    try {
      detail.value = await getProviderClientDetail(clientProfileId)
    } catch (err) {
      errorMessage.value = mapProviderClientDetailErrorToMessage(err)
    } finally {
      pending.value = false
    }
  }

  await refresh()

  return {
    pending,
    errorMessage,
    detail,
    refresh
  }
}
