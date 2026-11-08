import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { useCoachPagePreviewProfile } from './useCoachPagePreviewProfile'
import type { CoachPagePreviewDeps } from './useCoachPagePreviewProfile'
import { useCoachPagePreviewState } from './useCoachPagePreviewState'
import { useCoachLink } from '../../composables/useCoachLink'
import type { ProgramResponse, PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { ALBA_TEMPLATE_CODE } from '../../features/plans/domain/template-lock'

/**
 * CPD.9 — mapping `ProgramResponse` → `PublicProgramListItem` (pur, testé seul).
 *
 * Les deux champs nullable du contrat public (`installmentCount`,
 * `monthlyPriceCents`) sont normalisés en `null` : une réponse API qui les omet
 * ne doit pas produire `undefined` dans l'objet rendu à l'aperçu.
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
    installmentCount: p.installmentCount ?? null,
    monthlyPriceCents: p.monthlyPriceCents ?? null,
    discoveryGate: p.discoveryGate,
    sessionDurationMinutes: p.sessionDurationMinutes
  }
}

export interface CoachPreviewDeps extends Partial<CoachPagePreviewDeps> {
  /** Liste des templates chargés (pour résoudre le code du template sélectionné). */
  templates?: Ref<{ id: string, code?: string | null }[]> | { value: { id: string, code?: string | null }[] }
  /** Id du template sélectionné. */
  selectedTemplateId?: Ref<string | null> | { value: string | null }
  /** Injecteur pour les plans de consultation (tests / SSR). */
  loadConsultationPlans?: () => Promise<ConsultationPricePlan[]>
  /** Injecteur pour les programmes (tests / SSR). */
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
  /** Charge (une fois) les plans de consultation et les programmes actifs. */
  loadPreviewData: () => Promise<void>
}

/**
 * CPD.9 — dépendances requises. Elles ne sont pas facultatives : un câblage
 * oublié produisait sinon un aperçu plausible mais faux, suite verte (la leçon
 * de `cpd-8`, où `useCoachSections` LÈVE sur dépendance manquante). Seules les
 * dépendances réellement optionnelles de `CoachPagePreviewDeps` restent
 * facultatives ici.
 */
const REQUIRED_DEPS = [
  'account',
  'bioForm',
  'testimonialsForm',
  'brandingForm',
  'sectionsConfig',
  'pillarsForm',
  'faqForm',
  'benefitsForm',
  'howItWorksForm',
  'educationalContentForm',
  'problemStatementForm'
] as const satisfies readonly (keyof CoachPagePreviewDeps)[]

function requiredDep<K extends typeof REQUIRED_DEPS[number]>(
  deps: CoachPreviewDeps,
  key: K
): NonNullable<CoachPagePreviewDeps[K]> {
  const value = deps[key]
  if (value === undefined || value === null) {
    throw new Error(`useCoachPreview: missing required dependency "${key}"`)
  }
  return value as NonNullable<CoachPagePreviewDeps[K]>
}

/**
 * Refuse de construire l'aperçu sur des dépendances manquantes : un câblage
 * oublié doit casser bruyamment, pas produire un aperçu vide plausible.
 */
function assertRequiredDeps(deps: CoachPreviewDeps): void {
  const missing = REQUIRED_DEPS.filter((key) => {
    const value = deps[key]
    return value === undefined || value === null
  })
  if (missing.length > 0) {
    throw new Error(`useCoachPreview: missing required dependencies: ${missing.join(', ')}`)
  }
}

/**
 * CPD.9 — Aperçu live de la page coach, extrait de `coach-page.vue`.
 *
 * Regroupe l'état de l'aperçu (device, ouverture mobile/desktop), les liens
 * publics (white-label via `useCoachLink`), les plans/programmes affichés dans
 * l'aperçu et le profil/tenant dérivés via `useCoachPagePreviewProfile` /
 * `useCoachPagePreviewState` (conservés en l'état).
 *
 * Le composable n'écrit rien : il ne fait que lire les plans et programmes
 * existants (`loadPreviewData`) et dériver des computed.
 */
export function createCoachPreview(deps: CoachPreviewDeps = {}): CoachPreview {
  assertRequiredDeps(deps)
  const accountRef = requiredDep(deps, 'account')

  const templatesRef = (deps.templates ?? ref([])) as { value: { id: string, code?: string | null }[] }
  const selectedTemplateIdRef = (deps.selectedTemplateId ?? ref(null)) as { value: string | null }

  /**
   * Code du template sélectionné. Source UNIQUE : soit la dépendance explicite
   * `templateCode` (appelant qui la détient déjà), soit la résolution
   * `selectedTemplateId` → `templates`. CPD.9 garde la seconde, sinon la page
   * et le composable dérivaient deux fois la même règle.
   */
  const previewTemplateCode = computed<string | null>(() => {
    if (deps.templateCode) return deps.templateCode.value ?? null
    const id = selectedTemplateIdRef.value
    if (!id) return null
    const match = templatesRef.value.find(t => t.id === id)
    return match?.code ?? null
  })

  const isHeroBackgroundTemplate = computed<boolean>(
    () => previewTemplateCode.value !== ALBA_TEMPLATE_CODE
  )

  const { draftCoachProfile, draftTenant } = useCoachPagePreviewProfile({
    account: accountRef,
    bioForm: requiredDep(deps, 'bioForm'),
    heroForm: deps.heroForm,
    paletteForm: deps.paletteForm,
    sectionTitlesForm: deps.sectionTitlesForm,
    testimonialsForm: requiredDep(deps, 'testimonialsForm'),
    brandingForm: requiredDep(deps, 'brandingForm'),
    sectionsConfig: requiredDep(deps, 'sectionsConfig'),
    pillarsForm: requiredDep(deps, 'pillarsForm'),
    faqForm: requiredDep(deps, 'faqForm'),
    benefitsForm: requiredDep(deps, 'benefitsForm'),
    howItWorksForm: requiredDep(deps, 'howItWorksForm'),
    educationalContentForm: requiredDep(deps, 'educationalContentForm'),
    problemStatementForm: requiredDep(deps, 'problemStatementForm'),
    fitForm: deps.fitForm,
    freeTextForm: deps.freeTextForm,
    templateCode: computed(() => previewTemplateCode.value),
    secondaryPhotoPreview: deps.secondaryPhotoPreview,
    heroPhotoPreview: deps.heroPhotoPreview,
    problemStatementPhotoPreview: deps.problemStatementPhotoPreview
  })

  const previewState = useCoachPagePreviewState()
  const { isOpen: previewOpenState, device: previewDevice, toggleOpen, setDevice: setPreviewDevice } = previewState
  const previewOpen = previewOpenState

  const mobileOpen = ref(false)

  function openMobile(): void {
    mobileOpen.value = true
  }
  function closeMobile(): void {
    mobileOpen.value = false
  }
  /**
   * Fermer/rouvrir l'aperçu desktop a une SÉMANTIQUE, pas une bascule : le nom
   * d'une fonction doit dire ce qu'elle fait (AC-2). `toggleOpen()` reste
   * l'unique écriture, mais conditionnée à l'état courant.
   */
  function reopenDesktop(): void {
    if (!previewOpen.value) toggleOpen()
  }
  function closeDesktop(): void {
    if (previewOpen.value) toggleOpen()
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

  const loadConsultationPlans = deps.loadConsultationPlans ?? (async () => [])
  const loadPrograms = deps.loadPrograms ?? (async () => [])

  /**
   * Charge plans et programmes EN PARALLÈLE (l'extraction avait sérialisé deux
   * lectures indépendantes). Appelable hors composant : c'est ce qui rend la
   * lecture observable par un test, `onMounted` ne s'exécutant qu'avec une
   * instance de composant.
   */
  async function loadPreviewData(): Promise<void> {
    const [plans, programs] = await Promise.all([
      loadConsultationPlans().catch(() => [] as ConsultationPricePlan[]),
      loadPrograms().catch(() => [] as ProgramResponse[])
    ])
    consultationPlans.value = plans
    publicPrograms.value = programs
      .filter(p => p.status === 'active')
      .map(toPublicProgram)
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      void loadPreviewData()
    })
  }

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
    previewOpen,
    loadPreviewData
  }
}

export function useCoachPreview(deps: CoachPreviewDeps): CoachPreview {
  return createCoachPreview(deps)
}
