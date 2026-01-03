import type { TimeSlot } from '../../slots/domain/slots'

export type ConsultationPricePlan = {
  id: string
  label: string
  sortOrder: number
  durationMinutes: number
  amountCents: number
  isActive: boolean
}

export type ListConsultationPricePlansResponse = {
  providerId: string
  currency: 'EUR'
  plans: ConsultationPricePlan[]
}

export type ProviderAvailabilityGates = {
  canBook: boolean
  reason: string | null
}

export type ProviderAvailabilityResponse = {
  providerId: string
  type: 'consultation'
  gates?: ProviderAvailabilityGates
  durationMinutes: number
  timezone: string
  slots: TimeSlot[]
  meta: {
    rulesCount: number
    blocksCount: number
    appointmentsCount: number
    candidates: number
    deduped: number
    excludedByBlocks: number
    excludedByAppointments: number
    overlapsDropped: number
  }
}

export type ConsultationCheckoutReturnUrls = {
  success: string
  cancel: string
}

export type CreateConsultationCheckoutSessionRequest = {
  providerId: string
  pricePlanId: string
  slotStartAt: string
  returnUrls: ConsultationCheckoutReturnUrls
}

export type CreateConsultationCheckoutSessionResponse = {
  payment: {
    id: string
    status: 'pending'
    amountCents: number
    currency: 'EUR'
  }
  stripe: {
    sessionId: string
    checkoutUrl: string
  }
}

export type CheckoutStatus = 'pending_confirmation' | 'confirmed' | 'failed'

export type GetCheckoutStatusResponse = {
  status: CheckoutStatus
  paymentId: string
  appointmentId: string | null
}
