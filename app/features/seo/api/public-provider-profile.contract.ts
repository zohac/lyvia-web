// verified against OpenAPI spec (T2.1 — GET /public/provider/{slug}/profile)
export interface PublicProviderProfile {
  slug: string
  firstName: string
  lastName: string
  displayName: string
  bio: string | null
  specialties: string[]
  timezone: string
  imageUrl: string | null
  discoveryDurationMinutes: number
  discoveryBufferAfterMinutes: number
  isActive: boolean
}
