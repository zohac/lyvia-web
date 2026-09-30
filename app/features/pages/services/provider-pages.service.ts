import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildProviderPagePreviewCall,
  buildPublishProviderPageCall,
  buildUnpublishProviderPageCall,
  buildUpdateProviderPageCall
} from '../api/provider-pages.request'
import type {
  CreateProviderPageRequest,
  ProviderPageListItem,
  ProviderPagePreviewResponse,
  ProviderPageResponse,
  UpdateProviderPageRequest
} from '../api/pages.contract'

/**
 * V2.2a/V2.2b — Transport for `/provider/pages`.
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

/**
 * V2.2b — Persists the draft content blocks with optimistic locking.
 * `payload.expectedVersion` must be the version returned by the last load/save.
 */
export async function updateProviderPage(
  id: string,
  payload: UpdateProviderPageRequest
): Promise<ProviderPageResponse> {
  const { path, options } = buildUpdateProviderPageCall(id, payload)
  return await apiFetch<ProviderPageResponse>(path, options)
}

/**
 * V2.2e — Private draft preview. `GET /provider/pages/:id/preview` is
 * `private, no-store` server-side and triggers zero analytics: this transport
 * is a plain authenticated read.
 */
export async function getProviderPagePreview(
  id: string
): Promise<ProviderPagePreviewResponse> {
  const { path, options } = buildProviderPagePreviewCall(id)
  return await apiFetch<ProviderPagePreviewResponse>(path, options)
}

/** V2.2e — Publishes (or republishes) the stored draft. */
export async function publishProviderPage(id: string): Promise<ProviderPageResponse> {
  const { path, options } = buildPublishProviderPageCall(id)
  return await apiFetch<ProviderPageResponse>(path, options)
}

/** V2.2e — Switches a published page back to draft. */
export async function unpublishProviderPage(id: string): Promise<ProviderPageResponse> {
  const { path, options } = buildUnpublishProviderPageCall(id)
  return await apiFetch<ProviderPageResponse>(path, options)
}
