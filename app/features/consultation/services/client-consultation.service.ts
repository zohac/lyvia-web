import type { PublicTenantResponse } from '../../onboarding/api/onboarding.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CreateConsultationCheckoutSessionRequest,
  CreateConsultationCheckoutSessionResponse,
  GetCheckoutStatusResponse,
  ListConsultationPricePlansResponse,
  ProviderAvailabilityResponse
} from '../api/consultation.contract'
import type { GetNextClientConsultationResponse } from '../api/next-consultation.contract'
import type {
  GetAppointmentPaymentContextResponse,
  CreateAssignedConsultationCheckoutRequest
} from '../api/payment-context.contract'

export async function resolveTenantByHost(): Promise<PublicTenantResponse> {
  return await apiFetch<PublicTenantResponse>('/public/tenant', {
    method: 'GET',
    withAuth: false
  })
}

export async function listConsultationPricePlans(providerId: string): Promise<ListConsultationPricePlansResponse> {
  return await apiFetch<ListConsultationPricePlansResponse>(`/providers/${providerId}/pricing/consultations`, {
    method: 'GET',
    withAuth: false
  })
}

export async function listConsultationSlots(input: { providerId: string, from: string, to: string, pricePlanId: string }): Promise<ProviderAvailabilityResponse> {
  return await apiFetch<ProviderAvailabilityResponse>(`/providers/${input.providerId}/availability/consultation`, {
    method: 'GET',
    withAuth: true,
    query: {
      from: input.from,
      to: input.to,
      pricePlanId: input.pricePlanId
    }
  })
}

export async function createConsultationCheckoutSession(body: CreateConsultationCheckoutSessionRequest): Promise<CreateConsultationCheckoutSessionResponse> {
  return await apiFetch<CreateConsultationCheckoutSessionResponse>('/payments/consultation-session', {
    method: 'POST',
    withAuth: true,
    body
  })
}

export async function getCheckoutStatus(sessionId: string): Promise<GetCheckoutStatusResponse> {
  return await apiFetch<GetCheckoutStatusResponse>('/payments/checkout-status', {
    method: 'GET',
    withAuth: true,
    query: {
      session_id: sessionId
    }
  })
}

/**
 * Fetch the next assigned consultation for the authenticated client.
 *
 * Used on the client dashboard to display the appropriate CTA based on
 * onboarding status and consultation payment state.
 *
 * @see Ticket RB7 - Backend/API : contexte dashboard cliente (RDV assigné)
 */
export async function getNextClientConsultation(): Promise<GetNextClientConsultationResponse> {
  return await apiFetch<GetNextClientConsultationResponse>('/client/consultations/next', {
    method: 'GET',
    withAuth: true
  })
}

/**
 * Fetch payment context for an assigned appointment.
 *
 * Returns all information needed to display the payment page and
 * initiate checkout for an assigned consultation.
 *
 * @param appointmentId - UUID of the appointment to fetch context for
 * @see Ticket RB3 - Backend/API : contexte paiement RDV assigné (client)
 */
export async function getAppointmentPaymentContext(
  appointmentId: string
): Promise<GetAppointmentPaymentContextResponse> {
  return await apiFetch<GetAppointmentPaymentContextResponse>(
    `/client/appointments/${appointmentId}/payment-context`,
    {
      method: 'GET',
      withAuth: true
    }
  )
}

/**
 * Create a checkout session for an assigned consultation.
 *
 * Uses appointmentId as the primary identifier. Backend derives
 * providerId, pricePlanId, and slotStartAt from the appointment.
 *
 * @param body - Checkout request with appointmentId and return URLs
 * @see Ticket RB4 - Backend/API : paiement consultation par RDV assigné
 * @see Ticket RB8 - Backend/API : checkout via appointmentId only
 */
export async function createAssignedConsultationCheckout(
  body: CreateAssignedConsultationCheckoutRequest
): Promise<CreateConsultationCheckoutSessionResponse> {
  return await apiFetch<CreateConsultationCheckoutSessionResponse>(
    '/payments/consultation-session',
    {
      method: 'POST',
      withAuth: true,
      body
    }
  )
}
