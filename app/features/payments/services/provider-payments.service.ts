import { apiFetch } from '../../../services/api/apiFetch'
import type { ListProviderPaymentsResponse } from '../api/provider-payments.contract'

export async function listProviderPayments(input: { limit?: number, cursor?: string | null } = {}): Promise<ListProviderPaymentsResponse> {
  return await apiFetch<ListProviderPaymentsResponse>('/provider/payments', {
    method: 'GET',
    withAuth: true,
    query: {
      limit: input.limit ?? 20,
      cursor: input.cursor ?? undefined
    }
  })
}
