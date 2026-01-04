import { apiFetch } from '../../../services/api/apiFetch'
import type { ListConsultationPricePlansResponse } from '../../consultation/api/consultation.contract'
import type {
  ConsultationPricePlanIdResponse,
  CreateConsultationPricePlanRequest,
  UpdateConsultationPricePlanRequest
} from '../api/provider-consultation-pricing.contract'

export async function listMyConsultationPricePlans(): Promise<ListConsultationPricePlansResponse> {
  return await apiFetch<ListConsultationPricePlansResponse>('/provider/pricing/consultations', {
    method: 'GET',
    withAuth: true
  })
}

export async function createMyConsultationPricePlan(
  payload: CreateConsultationPricePlanRequest
): Promise<ConsultationPricePlanIdResponse> {
  return await apiFetch<ConsultationPricePlanIdResponse>('/provider/pricing/consultations', {
    method: 'POST',
    withAuth: true,
    body: payload
  })
}

export async function updateMyConsultationPricePlan(
  planId: string,
  payload: UpdateConsultationPricePlanRequest
): Promise<ConsultationPricePlanIdResponse> {
  return await apiFetch<ConsultationPricePlanIdResponse>(`/provider/pricing/consultations/${planId}`, {
    method: 'PATCH',
    withAuth: true,
    body: payload
  })
}
