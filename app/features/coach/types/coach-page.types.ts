/**
 * Typed props for coach page organisms (Pattern P-Y2).
 * Each organism receives exactly the data it needs — no `provider: any`.
 */

import type {
  BenefitsJson,
  EducationalContentJson,
  HowItWorksStep,
  PillarsJson,
  ProblemStatementJson
} from '~/features/seo/api/public-provider-profile.contract'

export interface Credential {
  title: string
  institution?: string
  year?: number
  verified?: boolean
}

export interface Testimonial {
  quote: string
  firstName: string
  age?: number
  location?: string
  rating?: number
  result?: string
}

export interface CoachHeroProps {
  displayName: string
  heroHeadline?: string | null
  credentials: Credential[]
  city?: string | null
  profilePhotoUrl?: string | null
  heroPhotoUrl?: string | null
  profilePhotoAlt?: string | null
  discoveryDurationMinutes: number
  urgencyText?: string | null
  ctaTo: string
}

export interface CoachPillar {
  title: string
  description: string
}

export interface CoachFaqItem {
  label: string
  content: string
}

// --- YC2.1 Props (organisms read data from API via props) ---

export interface CoachHowItWorksProps {
  discoveryDurationMinutes: number
  steps?: HowItWorksStep[] | null
}

export interface CoachTransformationBenefitsProps {
  benefits?: BenefitsJson | null
}

export interface CoachEducationalContentProps {
  content?: EducationalContentJson | null
}

export interface CoachProblemStatementProps {
  content?: ProblemStatementJson | null
}

export interface CoachPillarsProps {
  pillars?: PillarsJson | null
}

export interface CoachPricingProps {
  plans: import('~/features/consultation/api/consultation.contract').ConsultationPricePlan[]
  programs: import('~/features/programs/api/programs.contract').PublicProgramListItem[]
  discoveryDurationMinutes: number
  ctaTo?: string
  isAuthenticated?: boolean
  currentPath?: string
}

export interface CoachTestimonialsProps {
  testimonials: Testimonial[]
}
