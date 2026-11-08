import { computed, onMounted, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { useCoachPagePreviewProfile } from './useCoachPagePreviewProfile'
import type { CoachPagePreviewDeps } from './useCoachPagePreviewProfile'
import { useCoachPagePreviewState } from './useCoachPagePreviewState'
import { useCoachLink } from '../../composables/useCoachLink'
import type { ProgramResponse, PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import type { ProviderAccountResponse } from '~/features/account/api/provider-account.contract'
// Loaded lazily (dynamic import) so the module stays compilable by the
// node-based test runner (tsc) which cannot resolve Nuxt-only globals
// pulled in transitively by these services.
import { ALBA_TEMPLATE_CODE } from '../../features/plans/domain/template-lock'

/**
 * CPD.9 — Aperçu live de la page coach, extrait de `coach-page.vue`.
 *
 * Regroupe l'état de l'aperçu (device, ouverture mobile/desktop), les liens
 * publics (white-label via `useCoachLink`), les plans/programmes affichés dans
 * l'aperçu et le profil/tenant dérivés via `useCoachPagePreviewProfile` /
 * `useCoachPagePreviewState` (conservés en l'état).
 *
 * Le composable n'écrit rien : il ne fait que lire les plans et programmes
 * existants (onMounted) et dériver des computed.
 */
export function toPublicProgram(p: ProgramResponse): PublicProgramListItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    totalSessions: p.totalSessions,
    validityMonths: p.validityMonths,
    priceCents: p.priceCents,
    allowInstallments: p.allowInstallments,
    installmentCount: p.installmentCount,
    monthlyPriceCents: p.monthlyPriceCents,
    discoveryGate: p.discoveryGate,
    sessionDurationMinutes: p.sessionDurationMinutes
  }
}

export interface CoachPreviewDeps extends Partial<CoachPagePreviewDeps> {
  /** Liste des templates chargés (pour résoudre le code du template sélectionné). */
  templates?: Ref<{ id: string, code?: string | null }[]> | { value: { id: string, code?: string | null }[] }
  /** Id du template sélectionné. */
  selectedTemplateId?: Ref<string | null> | { value: string | null }
  /** Injecteur pour les plans de consultation (tests). */
  loadConsultationPlans?: () => Promise<ConsultationPricePlan[]>
  /** Injecteur pour les programmes (tests). */
  loadPrograms?: () => Promise<ProgramResponse[]>
}

export interface CoachPreview {
  device: ComputedRef<'desktop' | 'mobile'>
  mobileOpen: Ref<boolean>
  openMobile: () => void
  closeMobile: () => void
  reopenDesktop: () => void
  closeDesktop: () => void
  setDevice: (next: 'desktop' | 'mobile') => void
  publicLink: ComputedRef<{ site: string, booking: string } | null>
  previewLink: ComputedRef<string | null>
  draftProfile: ComputedRef<PublicProviderProfile | null>
  draftTenant: ComputedRef<PublicTenantResponse | null>
  previewOpen: ComputedRef<boolean> | Ref<boolean>
  consultationPlans: Ref<ConsultationPricePlan[]>
  publicPrograms: Ref<PublicProgramListItem[]>
  previewTemplateCode: ComputedRef<string | null>
  isHeroBackgroundTemplate: ComputedRef<boolean>
}

export function createCoachPreview(deps: CoachPreviewDeps = {}): CoachPreview {
  const accountRef = (deps.account ?? ref(null)) as Ref<ProviderAccountResponse | null>

  // Defaults for missing form deps (kept optional so the composable stays mountable).
  const bioForm = deps.bioForm ?? { longBio: '', city: '', region: '' }
  const testimonialsForm = (deps.testimonialsForm ?? ref([])) as Ref<unknown[]>
  const brandingForm = deps.brandingForm ?? { brandName: '' }
  const sectionsConfig = (deps.sectionsConfig ?? {}) as Record<string, boolean>
  const pillarsForm = (deps.pillarsForm ?? ref(null)) as Ref<unknown>
  const faqForm = (deps.faqForm ?? ref([])) as Ref<unknown[]>
  const benefitsForm = (deps.benefitsForm ?? ref(null)) as Ref<unknown>
  const howItWorksForm = (deps.howItWorksForm ?? ref([])) as Ref<unknown[]>
  const educationalContentForm = (deps.educationalContentForm ?? ref(null)) as Ref<unknown>
  const problemStatementForm = (deps.problemStatementForm ?? ref(null)) as Ref<unknown>
  const fitForm = (deps.fitForm ?? ref(null)) as Ref<unknown>
  const freeTextForm = (deps.freeTextForm ?? ref(null)) as Ref<unknown>
  const templateCodeRef = (deps.templateCode ?? ref(null)) as Ref<string | null | undefined>
  const heroForm = deps.heroForm
  const paletteForm = deps.paletteForm
  const sectionTitlesForm = deps.sectionTitlesForm

  const previewProfileDeps: CoachPagePreviewDeps = {
    account: accountRef as CoachPagePreviewDeps['account'],
    bioForm: bioForm as CoachPagePreviewDeps['bioForm'],
    heroForm,
    paletteForm,
    sectionTitlesForm,
    testimonialsForm: testimonialsForm as CoachPagePreviewDeps['testimonialsForm'],
    brandingForm: brandingForm as CoachPagePreviewDeps['brandingForm'],
    sectionsConfig,
    pillarsForm: pillarsForm as CoachPagePreviewDeps['pillarsForm'],
    faqForm: faqForm as CoachPagePreviewDeps['faqForm'],
    benefitsForm: benefitsForm as CoachPagePreviewDeps['benefitsForm'],
    howItWorksForm: howItWorksForm as CoachPagePreviewDeps['howItWorksForm'],
    educationalContentForm: educationalContentForm as CoachPagePreviewDeps['educationalContentForm'],
    problemStatementForm: problemStatementForm as CoachPagePreviewDeps['problemStatementForm'],
    fitForm: fitForm as CoachPagePreviewDeps['fitForm'],
    freeTextForm: freeTextForm as CoachPagePreviewDeps['freeTextForm'],
    templateCode: templateCodeRef as CoachPagePreviewDeps['templateCode'],
    secondaryPhotoPreview: deps.secondaryPhotoPreview,
    heroPhotoPreview: deps.heroPhotoPreview,
    problemStatementPhotoPreview: deps.problemStatementPhotoPreview
  }

  const { draftCoachProfile, draftTenant } = useCoachPagePreviewProfile(previewProfileDeps)

  const previewState = useCoachPagePreviewState()
  const { isOpen: previewOpenState, device: previewDevice, toggleOpen, setDevice: setPreviewDevice } = previewState
  const previewOpen = previewOpenState

  const mobileOpen = ref(false)

  const templatesRef = (deps.templates ?? ref([])) as { value: { id: string, code?: string | null }[] }
  const selectedTemplateIdRef = (deps.selectedTemplateId ?? ref(null)) as { value: string | null }

  const previewTemplateCode = computed<string | null>(() => {
    const id = selectedTemplateIdRef.value
    if (!id) return null
    const match = templatesRef.value.find(t => t.id === id)
    return match?.code ?? null
  })

  const isHeroBackgroundTemplate = computed<boolean>(
    () => previewTemplateCode.value !== ALBA_TEMPLATE_CODE
  )

  function openMobile(): void {
    mobileOpen.value = true
  }
  function closeMobile(): void {
    mobileOpen.value = false
  }
  function reopenDesktop(): void {
    toggleOpen()
  }
  function closeDesktop(): void {
    toggleOpen()
  }
  function setDevice(next: 'desktop' | 'mobile'): void {
    setPreviewDevice(next)
  }

  const publicLink = computed<{ site: string, booking: string } | null>(() => {
    const acc = accountRef.value
    if (!acc?.slug) return null
    return useCoachLink({ slug: acc.slug, domain: acc.customDomain })
  })

  const previewLink = computed<string | null>(() => {
    const acc = accountRef.value
    if (!acc?.slug) return null
    return `/coach/${acc.slug}?preview=true`
  })

  const consultationPlans = ref<ConsultationPricePlan[]>([])
  const publicPrograms = ref<PublicProgramListItem[]>([])

  const loadConsultationPlans = deps.loadConsultationPlans
    ?? (async () => [])
  const loadPrograms = deps.loadPrograms
    ?? (async () => [])

  onMounted(async () => {
    try {
      const plans = await loadConsultationPlans()
      consultationPlans.value = plans
    } catch {
      consultationPlans.value = []
    }
    try {
      const programs = await loadPrograms()
      publicPrograms.value = programs
        .filter(p => p.status === 'active')
        .map(toPublicProgram)
    } catch {
      publicPrograms.value = []
    }
  })

  return {
    device: computed(() => previewDevice.value) as ComputedRef<'desktop' | 'mobile'>,
    mobileOpen,
    openMobile,
    closeMobile,
    reopenDesktop,
    closeDesktop,
    setDevice,
    publicLink,
    previewLink,
    draftProfile: draftCoachProfile as ComputedRef<PublicProviderProfile | null>,
    draftTenant: draftTenant as ComputedRef<PublicTenantResponse | null>,
    consultationPlans,
    publicPrograms,
    previewTemplateCode,
    isHeroBackgroundTemplate,
    previewOpen
  }
}

export function useCoachPreview(deps?: CoachPreviewDeps): CoachPreview {
  return createCoachPreview(deps ?? {})
}
