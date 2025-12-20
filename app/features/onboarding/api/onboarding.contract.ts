/**
 * Onboarding / Discovery booking API contracts (Feature A).
 *
 * Sources of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/onboarding/presentation/onboarding.controller.ts`
 *
 * Endpoints:
 * - `GET /providers/:id/availability/discovery?from=...&to=...`
 * - `POST /onboarding/discovery`
 */

export type AvailabilitySlot = {
  startAt: string
  endAt: string
}

export type ProviderAvailabilityResponse = {
  providerId: string
  type: 'discovery'
  durationMinutes: number
  timezone: string
  slots: AvailabilitySlot[]
}

export type DiscoveryConsents = {
  legalAccepted: boolean
  emailMarketingOptIn?: boolean
  smsMarketingOptIn?: boolean
}

export type BookDiscoveryRequest = {
  providerId: string
  firstname: string
  lastname: string
  email: string
  phone: string
  slotStartAt: string
  consents: DiscoveryConsents
  idempotencyKey: string
}

export type BookDiscoveryResponse = {
  appointmentId: string
  scheduledAt: string
}
