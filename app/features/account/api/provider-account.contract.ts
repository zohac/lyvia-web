// verified against OpenAPI spec (UpdateProviderAccountDto + ProviderAccountResponseDto)

export interface CredentialItem {
  title: string
  institution?: string
  year?: number
  verified?: boolean
}

export interface SocialLinks {
  linkedin?: string
  facebook?: string
  instagram?: string
  website?: string
}

export interface TestimonialItem {
  quote: string
  firstName: string
  age?: number
  location?: string
  rating?: number
  result?: string
}

export type ProviderAccountResponse = {
  email: string
  firstname: string
  lastname: string
  bio: string | null
  specialties: string[]
  slug: string
  defaultDiscoveryDurationMinutes: number
  discoveryBufferAfterMinutes: number
  longBio: string | null
  credentials: CredentialItem[]
  city: string | null
  region: string | null
  socialLinks: SocialLinks
  publicPhone: string | null
  urgencyText: string | null
  heroHeadline: string | null
  testimonialsJson: TestimonialItem[]
  leadMagnetUrl: string | null
  leadMagnetTitle: string | null
  updatedAt?: string
}

export type UpdateProviderAccountRequest = {
  firstname?: string
  lastname?: string
  bio?: string | null
  specialties?: string[]
  slug?: string
  defaultDiscoveryDurationMinutes?: number
  discoveryBufferAfterMinutes?: number
  longBio?: string | null
  credentials?: CredentialItem[]
  city?: string | null
  region?: string | null
  socialLinks?: SocialLinks
  publicPhone?: string | null
  urgencyText?: string | null
  heroHeadline?: string | null
  testimonialsJson?: TestimonialItem[]
  leadMagnetUrl?: string | null
  leadMagnetTitle?: string | null
}
