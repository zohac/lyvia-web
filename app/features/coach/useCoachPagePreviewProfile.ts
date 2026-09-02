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

type HeroForm = {
  heroHeadline: string
  heroDescription: string
  urgencyText: string
}

type PaletteForm = {
  brandColor: string
  brandAccentColor: string
}

type SectionTitlesForm = {
  bio?: string
  benefits?: string
  problemStatement?: string
  pillars?: string
  howItWorks?: string
  testimonials?: string
  pricing?: string
  faq?: string
}

type BrandingForm = {
  brandName: string
}

export interface CoachPagePreviewDeps {
  /** Server-side account snapshot (source of truth, refreshed by useProviderAccount). */
  account: Ref<ProviderAccountResponse | null>
  /** Live form state for the bio section (longBio + city + region). */
  bioForm: BioForm
  /** Live form state for the hero section (heroHeadline, heroDescription, urgencyText). */
  heroForm?: HeroForm
  /** Live form state for palette (brandColor, brandAccentColor). */
  paletteForm?: PaletteForm
  /** Live form state for section titles. */
  sectionTitlesForm?: SectionTitlesForm
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
  /**
   * Story 0-28 CR-3 — preview URL de la photo secondaire pendant l'upload
   * (object URL local d'abord, puis URL S3 après succès). Quand non null,
   * elle prend le dessus sur `account.secondaryPhotoUrl` pour donner un
   * feedback visuel instant à Sophie. Default null/undefined si non passé.
   */
  secondaryPhotoPreview?: Ref<string | null>
  /**
   * Story 0-38 — preview URL de la photo hero (fond) pendant l'upload
   * (object URL local d'abord, puis URL S3 après succès). Quand non null,
   * elle prend le dessus sur `account.heroImageUrl`.
   */
  heroPhotoPreview?: Ref<string | null>
}

/**
 * Story 0-28 CR-2 — état "hydraté" d'un champ texte. Avant le premier
 * commit du snapshot debounce, on a besoin de retomber sur la valeur
 * serveur (sinon flash de string vide pendant 250ms). Après le premier
 * commit, on respecte strictement la valeur saisie — y compris une
 * string vide volontaire (Sophie a effacé "Paris", la preview doit
 * vider la ville). Une distinction binaire `hydrated` couvre les deux
 * cas sans heuristique sur le contenu.
 */
type DebouncedSnapshot = {
  hydrated: boolean
  longBio: string
  city: string
  region: string
  heroHeadline: string
  heroDescription: string
  urgencyText: string
  sectionTitles: SectionTitlesForm
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
    hydrated: false,
    longBio: '',
    city: '',
    region: '',
    heroHeadline: '',
    heroDescription: '',
    urgencyText: '',
    sectionTitles: {},
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
 * toggles and branding (brandName/logoUrl/palette) flow through instantly.
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
      hydrated: true,
      longBio: deps.bioForm.longBio,
      city: deps.bioForm.city,
      region: deps.bioForm.region,
      heroHeadline: deps.heroForm?.heroHeadline ?? '',
      heroDescription: deps.heroForm?.heroDescription ?? '',
      urgencyText: deps.heroForm?.urgencyText ?? '',
      sectionTitles: cloneRaw(deps.sectionTitlesForm ?? {}),
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
      () => deps.heroForm?.heroHeadline,
      () => deps.heroForm?.heroDescription,
      () => deps.heroForm?.urgencyText,
      () => deps.sectionTitlesForm,
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

    // Story 0-28 CR-3 & Story 0-38 — les photos prennent la valeur locale (object
    // URL d'upload-en-cours, puis URL S3 après succès) si fournie, sinon
    // celle du serveur. Permet à Sophie de voir le résultat de son upload
    // en preview avant même le retour de l'API.
    const localSecondaryPhoto = deps.secondaryPhotoPreview?.value ?? null
    const localHeroPhoto = deps.heroPhotoPreview?.value ?? null

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
      // Story 0-28 CR-3 — photos serveur copiées dans le draft preview
      // pour que la preview reflète la vraie page publique (le hero
      // photo, la mini-photo, la photo "Qui suis-je").
      imageUrl: acc.imageUrl,
      heroImageUrl: localHeroPhoto ?? acc.heroImageUrl,
      discoveryDurationMinutes: acc.defaultDiscoveryDurationMinutes,
      discoveryBufferAfterMinutes: acc.discoveryBufferAfterMinutes,
      isActive: true,
      // Story 0-28 CR-2 — free-text overlay : avant hydratation on retombe
      // sur la valeur serveur (évite le flash empty pendant 250ms au
      // premier paint), après hydratation on respecte STRICTEMENT le
      // snapshot — Sophie peut donc vider un champ et la preview reflète
      // l'effacement (au lieu de réafficher l'ancienne valeur serveur).
      longBio: snap.hydrated ? snap.longBio : acc.longBio,
      credentials: acc.credentials ?? [],
      city: snap.hydrated ? snap.city : acc.city,
      region: snap.hydrated ? snap.region : acc.region,
      socialLinks: acc.socialLinks ?? {},
      publicPhone: acc.publicPhone,
      urgencyText: snap.hydrated ? (deps.heroForm ? snap.urgencyText : acc.urgencyText) : acc.urgencyText,
      heroHeadline: snap.hydrated ? (deps.heroForm ? snap.heroHeadline : acc.heroHeadline) : acc.heroHeadline,
      heroDescription: snap.hydrated ? (deps.heroForm ? snap.heroDescription : acc.heroDescription) : acc.heroDescription,
      sectionTitlesJson: snap.hydrated ? (deps.sectionTitlesForm ? snap.sectionTitles : acc.sectionTitlesJson) : acc.sectionTitlesJson,
      testimonialsJson: snap.testimonials,
      secondaryPhotoUrl: localSecondaryPhoto ?? acc.secondaryPhotoUrl,
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

    const liveBrandColor = deps.paletteForm?.brandColor?.trim() || acc.brandColor
    const liveBrandAccentColor = deps.paletteForm?.brandAccentColor?.trim() || acc.brandAccentColor

    return {
      providerId: acc.slug,
      slug: acc.slug,
      timezone: 'Europe/Paris',
      isActive: true,
      brand: {
        mode: 'platform',
        displayName: liveBrandName,
        domain: null,
        brandColor: liveBrandColor,
        brandAccentColor: liveBrandAccentColor
      }
    }
  })

  return {
    draftCoachProfile,
    draftTenant
  }
}
