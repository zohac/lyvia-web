import { computed, onScopeDispose, ref, toRaw, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import type {
  ProviderAccountResponse,
  TestimonialItem
} from '~/features/account/api/provider-account.contract'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type {
  BenefitsJson,
  EducationalContentJson,
  FaqItem,
  HowItWorksStep,
  PillarsJson,
  ProblemStatementJson,
  PublicProviderProfile
} from '~/features/seo/api/public-provider-profile.contract'

/**
 * Story 0-28 — debounce trailing duration for free-text edits flowing into
 * the live preview. Toggles (`sectionsConfig`) and branding fields
 * (`brandName`, `logoUrl`) bypass the debounce and reflect instantly.
 */
export const PREVIEW_DEBOUNCE_MS = 250

/**
 * `reactive()` objects are typed as the underlying shape (Vue does not
 * expose a `Reactive<T>` wrapper type). We use plain object types here.
 */
type BioForm = {
  longBio: string
  city: string
  region: string
}

type BrandingForm = {
  brandName: string
}

export interface CoachPagePreviewDeps {
  /** Server-side account snapshot (source of truth, refreshed by useProviderAccount). */
  account: Ref<ProviderAccountResponse | null>
  /** Live form state for the bio section (longBio + city + region). */
  bioForm: BioForm
  /** Live form state for testimonials inline editor. */
  testimonialsForm: Ref<TestimonialItem[]>
  /** Live form state for branding (brandName instant; logoUrl is read directly from `account`). */
  brandingForm: BrandingForm
  /** Live sectionsConfig — instant reactivity (no debounce, AC-3). */
  sectionsConfig: Record<string, boolean>
  pillarsForm: Ref<PillarsJson | null>
  faqForm: Ref<FaqItem[]>
  benefitsForm: Ref<BenefitsJson | null>
  howItWorksForm: Ref<HowItWorksStep[]>
  educationalContentForm: Ref<EducationalContentJson | null>
  problemStatementForm: Ref<ProblemStatementJson | null>
  /**
   * Story 0-28 — code du template actuellement sélectionné par le provider
   * (signature / essentiel / futurs templates). Le draft route vers le bon
   * `<component :is>` via `useCoachPageTemplate(templateCode)`. Si null →
   * fallback `essentiel` (default registry). Reactive : un changement de
   * template dans l'éditeur se reflète instantanément dans la preview.
   */
  templateCode: Ref<string | null | undefined>
}

type DebouncedSnapshot = {
  longBio: string
  city: string
  region: string
  testimonials: TestimonialItem[]
  pillars: PillarsJson | null
  faq: FaqItem[]
  benefits: BenefitsJson | null
  howItWorks: HowItWorksStep[]
  educationalContent: EducationalContentJson | null
  problemStatement: ProblemStatementJson | null
}

function emptySnapshot(): DebouncedSnapshot {
  return {
    longBio: '',
    city: '',
    region: '',
    testimonials: [],
    pillars: null,
    faq: [],
    benefits: null,
    howItWorks: [],
    educationalContent: null,
    problemStatement: null
  }
}

function cloneRaw<T>(value: T): T {
  if (value === null || value === undefined) return value
  return structuredClone(toRaw(value))
}

/**
 * Story 0-28 — projects server account state + live form state into the
 * shape consumed by `CoachPage*` templates (`PublicProviderProfile` + a
 * minimal `PublicTenantResponse`). Free-text fields are debounced 250ms;
 * toggles and branding (brandName/logoUrl) flow through instantly.
 *
 * Pure mapping logic. No fetch, no global state, no DOM. Lifecycle-safe
 * (single trailing timeout, cleared on `onScopeDispose`).
 */
export function useCoachPagePreviewProfile(deps: CoachPagePreviewDeps): {
  draftCoachProfile: ComputedRef<PublicProviderProfile | null>
  draftTenant: ComputedRef<PublicTenantResponse | null>
} {
  const debouncedSnapshot = ref<DebouncedSnapshot>(emptySnapshot())
  let timeout: ReturnType<typeof setTimeout> | null = null

  function commitSnapshot(): void {
    debouncedSnapshot.value = {
      longBio: deps.bioForm.longBio,
      city: deps.bioForm.city,
      region: deps.bioForm.region,
      testimonials: cloneRaw(deps.testimonialsForm.value),
      pillars: cloneRaw(deps.pillarsForm.value),
      faq: cloneRaw(deps.faqForm.value),
      benefits: cloneRaw(deps.benefitsForm.value),
      howItWorks: cloneRaw(deps.howItWorksForm.value),
      educationalContent: cloneRaw(deps.educationalContentForm.value),
      problemStatement: cloneRaw(deps.problemStatementForm.value)
    }
  }

  watch(
    [
      () => deps.bioForm.longBio,
      () => deps.bioForm.city,
      () => deps.bioForm.region,
      () => deps.testimonialsForm.value,
      () => deps.pillarsForm.value,
      () => deps.faqForm.value,
      () => deps.benefitsForm.value,
      () => deps.howItWorksForm.value,
      () => deps.educationalContentForm.value,
      () => deps.problemStatementForm.value
    ],
    () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(commitSnapshot, PREVIEW_DEBOUNCE_MS)
    },
    { deep: true, immediate: true, flush: 'post' }
  )

  // Convention A39 (DS2-4) — clear pending timer on scope disposal to avoid
  // late commit on a torn-down preview.
  onScopeDispose(() => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  })

  const draftCoachProfile = computed<PublicProviderProfile | null>(() => {
    const acc = deps.account.value
    if (!acc) return null

    const snap = debouncedSnapshot.value

    return {
      slug: acc.slug,
      firstName: acc.firstname,
      lastName: acc.lastname,
      // displayName mirrors the server-side computation
      // (firstname + lastname). brandName overrides happen via tenant.brand.displayName.
      displayName: `${acc.firstname} ${acc.lastname}`.trim(),
      bio: acc.bio,
      specialties: acc.specialties ?? [],
      timezone: 'Europe/Paris',
      imageUrl: null,
      heroImageUrl: null,
      discoveryDurationMinutes: acc.defaultDiscoveryDurationMinutes,
      discoveryBufferAfterMinutes: acc.discoveryBufferAfterMinutes,
      isActive: true,
      // Free-text overlay (debounced)
      longBio: snap.longBio || acc.longBio,
      credentials: acc.credentials ?? [],
      city: snap.city || acc.city,
      region: snap.region || acc.region,
      socialLinks: acc.socialLinks ?? {},
      publicPhone: acc.publicPhone,
      urgencyText: acc.urgencyText,
      heroHeadline: acc.heroHeadline,
      testimonialsJson: snap.testimonials,
      secondaryPhotoUrl: null,
      logoUrl: acc.logoUrl,
      leadMagnetUrl: acc.leadMagnetUrl,
      leadMagnetTitle: acc.leadMagnetTitle,
      googleAdsId: acc.googleAdsId,
      googleAdsConversionLabel: acc.googleAdsConversionLabel,
      microsoftClarityId: acc.microsoftClarityId,
      // Live template choice — reflects the provider's selectedTemplateId.
      templateCode: deps.templateCode.value || 'essentiel',
      // Instant overlays (no debounce — AC-3)
      sectionsConfig: { ...deps.sectionsConfig },
      pillarsJson: snap.pillars,
      faqJson: snap.faq.length > 0 ? snap.faq : null,
      benefitsJson: snap.benefits,
      howItWorksJson: snap.howItWorks.length > 0 ? snap.howItWorks : null,
      educationalContentJson: snap.educationalContent,
      problemStatementJson: snap.problemStatement
    }
  })

  const draftTenant = computed<PublicTenantResponse | null>(() => {
    const acc = deps.account.value
    if (!acc) return null

    // Live brandName overlay (instant — AC-5). Falls back to server brandName,
    // then to the coach's full display name when no brand label is configured.
    const liveBrandName
      = deps.brandingForm.brandName?.trim()
        || acc.brandName?.trim()
        || `${acc.firstname} ${acc.lastname}`.trim()

    return {
      providerId: acc.slug,
      slug: acc.slug,
      timezone: 'Europe/Paris',
      isActive: true,
      brand: {
        mode: 'platform',
        displayName: liveBrandName,
        domain: null,
        brandColor: acc.brandColor
      }
    }
  })

  return {
    draftCoachProfile,
    draftTenant
  }
}
