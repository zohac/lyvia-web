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
