import type {
  ProviderClientDetailResponse,
  ResendActivationResponse,
  ResendConsultationPaymentLinkResponse,
  UpdateProviderClientProgramRequest,
  UpdateProviderClientProgramResponse
} from '../api/clients.contract'
import { apiFetch } from '../../../services/api/apiFetch'

/**
 * Fetches the detail of a client profile for a provider.
 * Includes appointments to support conversion flow (need discovery completed ID).
 */
export async function getProviderClientDetail(clientProfileId: string): Promise<ProviderClientDetailResponse> {
  return await apiFetch<ProviderClientDetailResponse>(`/provider/clients/${clientProfileId}`, {
    method: 'GET',
    query: {
      includeAppointments: 'true',
      appointmentsLimit: 50
    }
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

/**
 * Resends the activation email to a non-activated client.
 * @param clientProfileId - The client profile ID.
 * @returns Whether the email was sent, or the account is already activated.
 */
export async function resendActivation(
  clientProfileId: string
): Promise<ResendActivationResponse> {
  return await apiFetch<ResendActivationResponse>(
    `/provider/clients/${clientProfileId}/resend-activation`,
    { method: 'POST' }
  )
}

/**
 * Resends the payment link email of an unpaid consultation (hotfix-20).
 * The link is evergreen (client-space URL): the email is re-delivered as-is.
 * @param appointmentId - The consultation appointment ID.
 * @returns Whether the payment link email was sent.
 */
export async function resendConsultationPaymentLink(
  appointmentId: string
): Promise<ResendConsultationPaymentLinkResponse> {
  return await apiFetch<ResendConsultationPaymentLinkResponse>(
    `/provider/appointments/${appointmentId}/payment-link/resend`,
    { method: 'POST' }
  )
}
