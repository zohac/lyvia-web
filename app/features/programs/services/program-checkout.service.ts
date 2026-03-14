import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CreateProgramCheckoutRequest,
  CreateProgramCheckoutResponse
} from '../api/program-checkout.contract'

export async function createProgramCheckout(
  payload: CreateProgramCheckoutRequest
): Promise<CreateProgramCheckoutResponse> {
  return await apiFetch<CreateProgramCheckoutResponse>('/payments/program-checkout', {
    method: 'POST',
    withAuth: true,
    body: payload
  })
}
