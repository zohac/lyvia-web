import { apiFetch } from '~/services/api/apiFetch'
import type {
  AdminWaitlistFilters,
  AdminWaitlistLead,
  ListAdminWaitlistResponse,
  WaitlistStatus
} from '../api/admin-waitlist.contract'

function buildQuery(filters: AdminWaitlistFilters): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (filters.status) query.status = filters.status
  if (filters.specialty) query.specialty = filters.specialty
  if (filters.search && filters.search.trim()) query.search = filters.search.trim()
  if (filters.dateFrom) query.dateFrom = filters.dateFrom
  if (filters.dateTo) query.dateTo = filters.dateTo
  if (filters.limit !== undefined) query.limit = filters.limit
  if (filters.cursor) query.cursor = filters.cursor
  return query
}

export async function listAdminWaitlist(
  filters: AdminWaitlistFilters
): Promise<ListAdminWaitlistResponse> {
  return apiFetch<ListAdminWaitlistResponse>('/admin/waitlist', {
    method: 'GET',
    query: buildQuery(filters)
  })
}

export async function updateAdminWaitlistStatus(
  id: string,
  status: WaitlistStatus
): Promise<AdminWaitlistLead> {
  return apiFetch<AdminWaitlistLead>(`/admin/waitlist/${id}/status`, {
    method: 'PATCH',
    body: { status }
  })
}
