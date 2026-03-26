// verified against OpenAPI spec (U1.1 — GET /public/provider/{slug}/profile)

export interface CredentialItem {
  title: string
  institution?: string
  year?: number
  verified?: boolean
}

export interface SocialLinks {
  linkedin?: string
  instagram?: string
  website?: string
}

export interface PublicProviderProfile {
  slug: string
  firstName: string
  lastName: string
  displayName: string
  bio: string | null
  specialties: string[]
  timezone: string
  imageUrl: string | null
  heroImageUrl: string | null
  discoveryDurationMinutes: number
  discoveryBufferAfterMinutes: number
  isActive: boolean
  longBio: string | null
  credentials: CredentialItem[]
  city: string | null
  region: string | null
  socialLinks: SocialLinks
  publicPhone: string | null
  urgencyText: string | null
  heroHeadline: string | null
  testimonialsJson: Array<{ quote: string, firstName: string, age?: number, location?: string, rating?: number, result?: string }>
  secondaryPhotoUrl: string | null
  leadMagnetUrl: string | null
  leadMagnetTitle: string | null
  googleAdsId: string | null // verified against OpenAPI spec
  googleAdsConversionLabel: string | null // verified against OpenAPI spec
}
