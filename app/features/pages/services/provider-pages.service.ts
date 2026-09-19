import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CreateProviderPageRequest,
  ProviderPageListItem,
  ProviderPageResponse
} from '../api/pages.contract'

/**
 * V2.2a — Transport for `/provider/pages`.
 *
 * Goes through `apiFetch` (Nitro proxy, `credentials: 'include'`, bearer token
 * when present) so the Host header is preserved for tenant resolution and the
 * HTML never calls an absolute API URL.
 */
export async function listProviderPages(): Promise<ProviderPageListItem[]> {
  return await apiFetch<ProviderPageListItem[]>('/provider/pages', {
    method: 'GET',
    withAuth: true
  })
}

export async function createProviderPage(
  payload: CreateProviderPageRequest
): Promise<ProviderPageResponse> {
  return await apiFetch<ProviderPageResponse>('/provider/pages', {
    method: 'POST',
    withAuth: true,
    body: payload
  })
}

export async function getProviderPage(id: string): Promise<ProviderPageResponse> {
  return await apiFetch<ProviderPageResponse>(`/provider/pages/${id}`, {
    method: 'GET',
    withAuth: true
  })
}
