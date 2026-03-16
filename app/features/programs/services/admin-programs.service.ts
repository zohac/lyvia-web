/**
 * X4.3: Admin programs and subscriptions API service.
 */
import { apiFetch } from '~/services/api/apiFetch'
import type {
  AdminProviderProgramsResponse,
  AdminProviderSubscriptionsResponse
} from '../api/admin-programs.contract'

export async function listAdminProviderPrograms(
  providerId: string
): Promise<AdminProviderProgramsResponse> {
  return apiFetch<AdminProviderProgramsResponse>(
    `/admin/providers/${providerId}/programs`,
    { method: 'GET', withAuth: true }
  )
}

export async function listAdminProviderSubscriptions(
  providerId: string
): Promise<AdminProviderSubscriptionsResponse> {
  return apiFetch<AdminProviderSubscriptionsResponse>(
    `/admin/providers/${providerId}/subscriptions`,
    { method: 'GET', withAuth: true }
  )
}
