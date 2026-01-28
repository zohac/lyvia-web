/**
 * Service for provider appointment requests API calls (US-6).
 */

import { apiFetch } from '../../../services/api/apiFetch'
import type {
  ProviderRequestStatusFilter,
  ListProviderRequestsResponse,
  AcceptRequestBody,
  AcceptCancellationResponse,
  AcceptRescheduleResponse,
  RejectRequestBody,
  RejectRequestResponse
} from '../api/provider-requests.contract'

/**
 * List provider requests with optional status filter
 */
export async function listProviderRequests(
  status: ProviderRequestStatusFilter = 'pending'
): Promise<ListProviderRequestsResponse> {
  return apiFetch<ListProviderRequestsResponse>(
    `/provider/appointments/requests?status=${status}`
  )
}

/**
 * Accept a cancellation request
 */
export async function acceptCancellationRequest(
  requestId: string,
  providerNote?: string | null
): Promise<AcceptCancellationResponse> {
  const body: AcceptRequestBody = { providerNote }
  return apiFetch<AcceptCancellationResponse>(
    `/provider/appointments/requests/${requestId}/accept`,
    { method: 'POST', body }
  )
}

/**
 * Accept a reschedule request with new date
 */
export async function acceptRescheduleRequest(
  requestId: string,
  newScheduledAt: string,
  providerNote?: string | null
): Promise<AcceptRescheduleResponse> {
  const body: AcceptRequestBody = { providerNote, newScheduledAt }
  return apiFetch<AcceptRescheduleResponse>(
    `/provider/appointments/requests/${requestId}/accept`,
    { method: 'POST', body }
  )
}

/**
 * Reject a request
 */
export async function rejectRequest(
  requestId: string,
  providerNote?: string | null
): Promise<RejectRequestResponse> {
  const body: RejectRequestBody = { providerNote }
  return apiFetch<RejectRequestResponse>(
    `/provider/appointments/requests/${requestId}/reject`,
    { method: 'POST', body }
  )
}
