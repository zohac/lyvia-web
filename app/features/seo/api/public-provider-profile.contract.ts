// verified against OpenAPI spec (YC1.2 — GET /public/provider/{slug}/profile)

export interface CredentialItem {
  title: string
  institution?: string
  year?: number
  verified?: boolean
}

export interface SocialLinks {
  linkedin?: string
  instagram?: string
  facebook?: string
  website?: string
}

// ── Coach Page JSONB types (mirrors API coach-page.types.ts) ──

export interface PillarItem {
  icon?: string
  title: string
  description: string
}

export interface EmotionalSupport {
  icon?: string
  title: string
  description: string
}

export interface PillarsJson {
  items: PillarItem[]
  emotionalSupport?: EmotionalSupport
}

export interface FaqItem {
  label: string
  content: string
}

export interface BenefitItem {
  icon?: string
  title: string
  description: string
}

export interface BenefitsJson {
  visionIntro?: string
  visionText?: string
  items: BenefitItem[]
}

export interface HowItWorksStep {
  number: string
  title: string
  description: string
}

export interface InsightBox {
  title: string
  content: string
}

export interface EducationalContentJson {
  paragraphs: string[]
  insightBox?: InsightBox
}

export interface ProblemStatementJson {
  blockquote: string
  paragraphs: string[]
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
  /** Provider brand logo URL (480x160 PNG). Null when provider uses default Keova branding. Story 0-27. */
  logoUrl: string | null
  leadMagnetUrl: string | null
  leadMagnetTitle: string | null
  googleAdsId: string | null
  googleAdsConversionLabel: string | null
  microsoftClarityId: string | null
  // Coach Page Configuration (YC1.2)
  templateCode: string
  sectionsConfig: Record<string, boolean>
  pillarsJson: PillarsJson | null
  faqJson: FaqItem[] | null
  benefitsJson: BenefitsJson | null
  howItWorksJson: HowItWorksStep[] | null
  educationalContentJson: EducationalContentJson | null
  problemStatementJson: ProblemStatementJson | null
}
