import type { ProviderClientDetailResponse } from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

export async function getProviderClientDetail(clientProfileId: string): Promise<ProviderClientDetailResponse> {
  return await apiFetch<ProviderClientDetailResponse>(`/provider/clients/${clientProfileId}`, {
    method: 'GET'
  })
}
