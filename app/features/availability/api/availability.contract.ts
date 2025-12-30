export type AvailabilityAppointmentType = 'discovery' | 'consultation'

export type AvailabilityRule = {
  id: string
  weekday: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  appointmentType: AvailabilityAppointmentType
  isActive: boolean
}

export type AvailabilityBlockType = 'all' | AvailabilityAppointmentType

export type AvailabilityBlock = {
  id: string
  startAt: string
  endAt: string
  reason: string | null
  blockType: AvailabilityBlockType
}

export type ListAvailabilityRulesResponse = {
  rules: AvailabilityRule[]
}

export type ListAvailabilityBlocksResponse = {
  blocks: AvailabilityBlock[]
}

export type CreateAvailabilityRuleInput = Omit<AvailabilityRule, 'id'>

export type UpdateAvailabilityRuleInput = Partial<CreateAvailabilityRuleInput>

export type CreateAvailabilityBlockInput = {
  startAt: string
  endAt: string
  blockType: AvailabilityBlockType
  reason?: string | null
}

export type AvailabilityBlockIdResponse = {
  blockId: string
}

export type ProviderProfileIdentityResponse = {
  providerId: string
  timezone: string
}

export type AvailabilitySlot = {
  startAt: string
  endAt: string
}

export type ProviderAvailabilityMeta = {
  rulesCount: number
  blocksCount: number
  appointmentsCount: number
  candidates: number
  deduped: number
  excludedByBlocks: number
  excludedByAppointments: number
  overlapsDropped: number
}

export type ProviderAvailabilityResponse = {
  providerId: string
  type: AvailabilityAppointmentType
  durationMinutes: number
  timezone: string
  slots: AvailabilitySlot[]
  meta: ProviderAvailabilityMeta
}
