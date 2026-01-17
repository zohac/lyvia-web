import type {
  ProviderClientDetailResponse,
  UpdateProviderClientProgramRequest,
  UpdateProviderClientProgramResponse
} from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

/**
 * Fetches the detail of a client profile for a provider.
 */
export async function getProviderClientDetail(clientProfileId: string): Promise<ProviderClientDetailResponse> {
  return await apiFetch<ProviderClientDetailResponse>(`/provider/clients/${clientProfileId}`, {
    method: 'GET'
  })
}

/**
 * Updates the program month for a client.
 * @param clientProfileId - The client profile ID.
 * @param body - The request body containing the new program month (1-6 or null).
 * @returns The update result with previous/current month, status, and optional warning.
 */
export async function updateProviderClientProgram(
  clientProfileId: string,
  body: UpdateProviderClientProgramRequest
): Promise<UpdateProviderClientProgramResponse> {
  return await apiFetch<UpdateProviderClientProgramResponse>(
    `/provider/clients/${clientProfileId}/program`,
    {
      method: 'PATCH',
      body
    }
  )
}
