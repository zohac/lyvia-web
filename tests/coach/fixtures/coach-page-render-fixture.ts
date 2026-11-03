import type { PublicTenantResponse } from '../../../app/features/onboarding/api/onboarding.contract'
import type { CredentialItem, PublicProviderProfile } from '../../../app/features/seo/api/public-provider-profile.contract'
import type { ConsultationPricePlan } from '../../../app/features/consultation/api/consultation.contract'
import type { PublicProgramListItem } from '../../../app/features/programs/api/programs.contract'

export function createTenant(overrides: Partial<PublicTenantResponse> = {}): PublicTenantResponse {
  return {
    providerId: 'provider-1',
    slug: 'sophie-jouan',
    timezone: 'Europe/Paris',
    isActive: true,
    isPublished: true,
    isTest: false,
    brand: {
      mode: 'platform',
      displayName: 'Sophie Jouan',
      domain: null,
      brandColor: null,
      brandAccentColor: null
    },
    ...overrides
  }
}

function baseProfile(overrides: Partial<PublicProviderProfile> = {}): PublicProviderProfile {
  return {
    slug: 'sophie-jouan',
    firstName: 'Sophie',
    lastName: 'Jouan',
    displayName: 'Sophie Jouan',
    bio: 'Bio de test.',
    specialties: [],
    timezone: 'Europe/Paris',
    imageUrl: null,
    heroImageUrl: null,
    discoveryDurationMinutes: 15,
    discoveryBufferAfterMinutes: 15,
    isActive: true,
    longBio: null,
    credentials: [],
    city: null,
    region: null,
    socialLinks: {},
    publicPhone: null,
    urgencyText: null,
    heroHeadline: null,
    testimonialsJson: [],
    secondaryPhotoUrl: null,
    logoUrl: null,
    leadMagnetUrl: null,
    leadMagnetTitle: null,
    googleAdsId: null,
    googleAdsConversionLabel: null,
    microsoftClarityId: null,
    templateCode: 'signature',
    sectionsConfig: {},
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    ...overrides,
    // Après le spread : une surcharge explicite à `undefined` retombe sur le
    // défaut au lieu d'effacer la valeur (une page non publiée passerait sinon
    // pour publiée sans que rien ne le signale).
    isPublished: overrides.isPublished ?? true,
    isTest: overrides.isTest ?? false
  }
}

export function createCoachProfile(overrides: Partial<PublicProviderProfile> = {}): PublicProviderProfile {
  return baseProfile(overrides)
}

export function createConsultationPlans(overrides: ConsultationPricePlan[] = []): ConsultationPricePlan[] {
  return overrides
}

export function createPrograms(overrides: PublicProgramListItem[] = []): PublicProgramListItem[] {
  return overrides
}

export const ONE_CREDENTIAL: CredentialItem[] = [
  { title: 'DU Naturopathie', institution: 'ISUPNAT' }
]

export const TWO_CREDENTIALS: CredentialItem[] = [
  { title: 'DU Naturopathie', institution: 'ISUPNAT' },
  { title: 'Certification Ménopulse', institution: 'Ménopulse' }
]
