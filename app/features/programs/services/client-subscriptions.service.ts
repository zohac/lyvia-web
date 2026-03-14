import { apiFetch } from '../../../services/api/apiFetch'
import type { ProgramSubscriptionListResponse } from '../api/program-subscription.contract'

export async function listClientSubscriptions(
  clientProfileId: string
): Promise<ProgramSubscriptionListResponse> {
  return await apiFetch<ProgramSubscriptionListResponse>(
    `/provider/clients/${clientProfileId}/subscriptions`,
    {
      method: 'GET',
      withAuth: true
    }
  )
}
