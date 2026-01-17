import type {
  ListProviderClientAppointmentsParams,
  ListProviderClientAppointmentsResponse
} from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

/**
 * Fetches paginated appointments for a provider's client.
 * @param clientProfileId - The client profile ID.
 * @param params - Optional filters and pagination parameters.
 */
export async function getProviderClientAppointments(
  clientProfileId: string,
  params?: ListProviderClientAppointmentsParams
): Promise<ListProviderClientAppointmentsResponse> {
  const query = new URLSearchParams()

  if (params?.type) {
    query.set('type', params.type)
  }
  if (params?.status) {
    query.set('status', params.status)
  }
  if (params?.limit) {
    query.set('limit', String(params.limit))
  }
  if (params?.cursor) {
    query.set('cursor', params.cursor)
  }

  const queryString = query.toString()
  const url = `/provider/clients/${clientProfileId}/appointments${queryString ? `?${queryString}` : ''}`

  return await apiFetch<ListProviderClientAppointmentsResponse>(url, {
    method: 'GET'
  })
}
