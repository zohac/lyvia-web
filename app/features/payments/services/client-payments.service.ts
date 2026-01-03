import { apiFetch } from '../../../services/api/apiFetch'
import type { ListClientPaymentsResponse } from '../api/client-payments.contract'

export async function listClientPayments(input: { limit?: number, cursor?: string | null } = {}): Promise<ListClientPaymentsResponse> {
  return await apiFetch<ListClientPaymentsResponse>('/client/payments', {
    method: 'GET',
    withAuth: true,
    query: {
      limit: input.limit ?? 20,
      cursor: input.cursor ?? undefined
    }
  })
}
