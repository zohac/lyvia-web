// verified against OpenAPI spec (UpdateProviderAccountDto + ProviderAccountResponseDto)

import type {
  PillarsJson,
  FaqItem,
  BenefitsJson,
  HowItWorksStep,
  EducationalContentJson,
  ProblemStatementJson
} from '~/features/seo/api/public-provider-profile.contract'

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
  minBookingNoticeHours: number
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
  googleAdsId: string | null
  googleAdsConversionLabel: string | null
  microsoftClarityId: string | null
  // Coach Page Configuration (YC1.2 / YC3.1)
  coachPageTemplateId: string | null
  sectionsConfig: Record<string, boolean>
  brandColor: string | null
  pillarsJson: PillarsJson | null
  faqJson: FaqItem[] | null
  benefitsJson: BenefitsJson | null
  howItWorksJson: HowItWorksStep[] | null
  educationalContentJson: EducationalContentJson | null
  problemStatementJson: ProblemStatementJson | null
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
  minBookingNoticeHours?: number
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
  googleAdsId?: string | null
  googleAdsConversionLabel?: string | null
  microsoftClarityId?: string | null
  // Coach Page Configuration (YC3.1)
  coachPageTemplateId?: string | null
  sectionsConfig?: Record<string, boolean>
  brandColor?: string | null
  pillarsJson?: PillarsJson | null
  faqJson?: FaqItem[] | null
  benefitsJson?: BenefitsJson | null
  howItWorksJson?: HowItWorksStep[] | null
  educationalContentJson?: EducationalContentJson | null
  problemStatementJson?: ProblemStatementJson | null
}

// Re-export JSONB types for convenience
export type { PillarsJson, FaqItem, BenefitsJson, HowItWorksStep, EducationalContentJson, ProblemStatementJson }
