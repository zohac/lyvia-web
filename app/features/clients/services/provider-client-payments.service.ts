import type {
  ListProviderClientPaymentsParams,
  ListProviderClientPaymentsResponse
} from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

/**
 * Fetches paginated payments for a provider's client.
 * @param clientProfileId - The client profile ID.
 * @param params - Optional filters and pagination parameters.
 */
export async function getProviderClientPayments(
  clientProfileId: string,
  params?: ListProviderClientPaymentsParams
): Promise<ListProviderClientPaymentsResponse> {
  const query = new URLSearchParams()

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
  const url = `/provider/clients/${clientProfileId}/payments${queryString ? `?${queryString}` : ''}`

  return await apiFetch<ListProviderClientPaymentsResponse>(url, {
    method: 'GET'
  })
}
