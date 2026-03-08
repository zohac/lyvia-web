import type {
  CreateClientByProviderRequest,
  ListProviderClientsParams,
  ListProviderClientsResponse,
  ProviderClientResponse,
  UpdateClientByProviderRequest
} from '../api/clients.contract'
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

/**
 * Convert a lead (discovery completed) to active client.
 * @param appointmentId - The ID of the completed discovery appointment
 */
export async function convertLeadToActive(
  appointmentId: string
): Promise<void> {
  await apiFetch(`/provider/appointments/${appointmentId}/convert`, {
    method: 'POST'
  })
}

/**
 * Story 14-1: Create a new client as a provider.
 */
export async function createProviderClient(
  body: CreateClientByProviderRequest
): Promise<ProviderClientResponse> {
  return await apiFetch<ProviderClientResponse>('/provider/clients', {
    method: 'POST',
    body
  })
}

/**
 * Story 14-1: Update an existing client as a provider.
 */
export async function updateProviderClient(
  clientProfileId: string,
  body: UpdateClientByProviderRequest
): Promise<ProviderClientResponse> {
  return await apiFetch<ProviderClientResponse>(`/provider/clients/${clientProfileId}`, {
    method: 'PATCH',
    body
  })
}
