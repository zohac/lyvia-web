/**
 * Public tenant onboarding contracts (Feature A / Keova).
 *
 * Sources of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/public/presentation/public.controller.ts`
 *
 * Endpoints:
 * - `GET /public/tenant?slug=...`
 * - `GET /public/availability/discovery?slug=...&from=...&to=...`
 * - `POST /public/onboarding/discovery?slug=...`
 */

export type TenantBrand = {
  mode: 'platform' | 'custom_domain'
  displayName: string
  domain: string | null
}

export type PublicTenantResponse = {
  providerId: string
  slug: string
  timezone: string
  isActive: boolean
  brand: TenantBrand
}

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

export type BookDiscoveryForTenantRequest = {
  firstname: string
  lastname: string
  email: string
  phone: string
  slotStartAt: string
  consents: DiscoveryConsents
  idempotencyKey?: string
}

export type BookDiscoveryResponse = {
  appointmentId: string
  scheduledAt: string
}
