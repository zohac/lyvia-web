import type { PublicTenantResponse } from '../../onboarding/api/onboarding.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CreateConsultationCheckoutSessionRequest,
  CreateConsultationCheckoutSessionResponse,
  GetCheckoutStatusResponse,
  ListConsultationPricePlansResponse,
  ProviderAvailabilityResponse
} from '../api/consultation.contract'

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
