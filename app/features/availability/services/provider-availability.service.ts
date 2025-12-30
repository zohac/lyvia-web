import { apiFetch } from '../../../services/api/apiFetch'
import type {
  AvailabilityRule,
  ListAvailabilityBlocksResponse,
  ListAvailabilityRulesResponse,
  AvailabilityBlockIdResponse,
  AvailabilityBlock,
  CreateAvailabilityRuleInput,
  CreateAvailabilityBlockInput,
  UpdateAvailabilityRuleInput,
  ProviderProfileIdentityResponse,
  ProviderAvailabilityResponse,
  AvailabilityAppointmentType
} from '../api/availability.contract'

export async function listAvailabilityRules(): Promise<ListAvailabilityRulesResponse> {
  return await apiFetch<ListAvailabilityRulesResponse>('/provider/availability/rules', { method: 'GET' })
}

export async function listAvailabilityBlocks(): Promise<ListAvailabilityBlocksResponse> {
  return await apiFetch<ListAvailabilityBlocksResponse>('/provider/availability/blocks', { method: 'GET' })
}

export async function createAvailabilityRule(input: CreateAvailabilityRuleInput): Promise<{ ruleId: string }> {
  return await apiFetch<{ ruleId: string }>('/provider/availability/rules', {
    method: 'POST',
    body: input
  })
}

export async function createAvailabilityBlock(input: CreateAvailabilityBlockInput): Promise<AvailabilityBlockIdResponse> {
  return await apiFetch<AvailabilityBlockIdResponse>('/provider/availability/blocks', {
    method: 'POST',
    body: input
  })
}

export async function deleteAvailabilityBlock(blockId: AvailabilityBlock['id']): Promise<AvailabilityBlockIdResponse> {
  return await apiFetch<AvailabilityBlockIdResponse>(`/provider/availability/blocks/${blockId}`, {
    method: 'DELETE'
  })
}

export async function updateAvailabilityRule(ruleId: AvailabilityRule['id'], input: UpdateAvailabilityRuleInput): Promise<{ ruleId: string }> {
  return await apiFetch<{ ruleId: string }>(`/provider/availability/rules/${ruleId}`, {
    method: 'PATCH',
    body: input
  })
}

export async function deleteAvailabilityRule(ruleId: AvailabilityRule['id']): Promise<{ ruleId: string }> {
  return await apiFetch<{ ruleId: string }>(`/provider/availability/rules/${ruleId}`, {
    method: 'DELETE'
  })
}

export async function getMyProviderProfileIdentity(): Promise<ProviderProfileIdentityResponse> {
  return await apiFetch<ProviderProfileIdentityResponse>('/provider/availability/profile', { method: 'GET' })
}

export async function listProviderAvailabilitySlots(input: {
  providerId: string
  type: AvailabilityAppointmentType
  from: string
  to: string
  limit?: number
}): Promise<ProviderAvailabilityResponse> {
  const query = new URLSearchParams({
    from: input.from,
    to: input.to
  })
  if (typeof input.limit === 'number') query.set('limit', String(input.limit))

  return await apiFetch<ProviderAvailabilityResponse>(`/providers/${input.providerId}/availability/${input.type}?${query.toString()}`, {
    method: 'GET',
    withAuth: true
  })
}
