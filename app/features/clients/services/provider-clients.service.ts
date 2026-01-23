import type { ListProviderClientsParams, ListProviderClientsResponse } from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

export async function listProviderClients(
  params: ListProviderClientsParams
): Promise<ListProviderClientsResponse> {
  return await apiFetch<ListProviderClientsResponse>('/provider/clients', {
    method: 'GET',
    query: params
  })
}

/**
 * US-7: Pause a client (any stage → paused)
 */
export async function pauseClient(
  clientProfileId: string,
  reason?: string
): Promise<void> {
  await apiFetch(`/provider/clients/${clientProfileId}/pause`, {
    method: 'POST',
    body: reason ? { pauseReason: reason } : undefined
  })
}

/**
 * US-7: Reactivate a client (paused → active)
 */
export async function reactivateClient(
  clientProfileId: string
): Promise<void> {
  await apiFetch(`/provider/clients/${clientProfileId}/reactivate`, {
    method: 'POST'
  })
}
