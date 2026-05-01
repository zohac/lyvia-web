import { ref, reactive, computed, readonly, toRaw } from 'vue'
import type { DeepReadonly, Ref } from 'vue'
import {
  getCoachPageEditableSections,
  getCoachPageConfigurableSections,
  isCoachPageAlwaysOnSection,
  supportsEmotionalSupportSection
} from './domain/coach-page-editor'
import type { CoachPageTemplate } from './api/coach-page-template.contract'
import type {
  ProviderAccountResponse,
  UpdateProviderAccountRequest,
  PillarsJson,
  FaqItem,
  BenefitsJson,
  HowItWorksStep,
  EducationalContentJson,
  ProblemStatementJson
} from '../account/api/provider-account.contract'

export interface ProviderAccountStore {
  account: Readonly<Ref<DeepReadonly<ProviderAccountResponse> | null>>
  loading: Readonly<Ref<boolean>>
  saving: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  fetchAccount: () => Promise<void>
  updateAccount: (patch: UpdateProviderAccountRequest) => Promise<boolean>
  updateAccountDetailed: (patch: UpdateProviderAccountRequest) => Promise<
    { ok: true, data: ProviderAccountResponse } | { ok: false, errorCode?: string }
  >
}

export interface CreateCoachPageEditorDependencies {
  providerAccount: ProviderAccountStore
  listTemplates: () => Promise<CoachPageTemplate[]>
}

export function createCoachPageEditor(deps: CreateCoachPageEditorDependencies) {
  const { providerAccount, listTemplates } = deps
  const { account, loading, saving, error, fetchAccount, updateAccountDetailed } = providerAccount
  // Story 0-26 — `updateAccount` exposé directement aux pages éditeur pour les sections
  // rapatriées (bio/longBio, testimonials, branding) qui n'ont pas de save helper dédié.
  // Garantit qu'un seul store providerAccount est utilisé (sinon 2 instances refresh
  // indépendantes => formulaire vide après fetch).
  const { updateAccount } = providerAccount

  const templates = ref<CoachPageTemplate[]>([])
  const templatesLoading = ref(false)

  const sectionsConfig = reactive<Record<string, boolean>>({})

  const pillarsForm = ref<PillarsJson | null>(null)
  const faqForm = ref<FaqItem[]>([])
  const benefitsForm = ref<BenefitsJson | null>(null)
  const howItWorksForm = ref<HowItWorksStep[]>([])
  const educationalContentForm = ref<EducationalContentJson | null>(null)
  const problemStatementForm = ref<ProblemStatementJson | null>(null)

  const selectedTemplateId = ref<string | null>(null)

  const selectedTemplate = computed(() =>
    templates.value.find(t => t.id === selectedTemplateId.value) ?? null
  )

  const availableSections = computed(() =>
    selectedTemplate.value?.sectionsAvailable ?? []
  )

  const configurableSections = computed(() =>
    getCoachPageConfigurableSections(availableSections.value)
  )

  const editableSections = computed(() =>
    getCoachPageEditableSections(availableSections.value)
  )

  const hasEmotionalSupportSection = computed(() =>
    supportsEmotionalSupportSection(availableSections.value)
  )

  function isAlwaysOn(section: string): boolean {
    return isCoachPageAlwaysOnSection(section)
  }

  function isSectionOn(section: string): boolean {
    if (isAlwaysOn(section)) return true
    return sectionsConfig[section] !== false
  }

  function ensureBenefitsForm(): BenefitsJson {
    if (!benefitsForm.value) {
      benefitsForm.value = { items: [] }
    }
    return benefitsForm.value
  }

  function setBenefitsVisionIntro(value: string) {
    ensureBenefitsForm().visionIntro = value || undefined
  }

  function setBenefitsVisionText(value: string) {
    ensureBenefitsForm().visionText = value || undefined
  }

  function addBenefit() {
    ensureBenefitsForm().items.push({ title: '', description: '' })
  }

  function removeBenefit(index: number) {
    benefitsForm.value?.items.splice(index, 1)
  }

  function ensureEducationalContentForm(): EducationalContentJson {
    if (!educationalContentForm.value) {
      educationalContentForm.value = { paragraphs: [] }
    }
    return educationalContentForm.value
  }

  function addEducationalParagraph() {
    ensureEducationalContentForm().paragraphs.push('')
  }

  function removeEducationalParagraph(index: number) {
    educationalContentForm.value?.paragraphs.splice(index, 1)
  }

  function setEducationalInsightTitle(value: string) {
    const form = ensureEducationalContentForm()
    if (!form.insightBox) {
      form.insightBox = { title: '', content: '' }
    }
    form.insightBox.title = value
  }

  function setEducationalInsightContent(value: string) {
    const form = ensureEducationalContentForm()
    if (!form.insightBox) {
      form.insightBox = { title: '', content: '' }
    }
    form.insightBox.content = value
  }

  function ensureProblemStatementForm(): ProblemStatementJson {
    if (!problemStatementForm.value) {
      problemStatementForm.value = { blockquote: '', paragraphs: [] }
    }
    return problemStatementForm.value
  }

  function setProblemStatementBlockquote(value: string) {
    ensureProblemStatementForm().blockquote = value
  }

  function addProblemParagraph() {
    ensureProblemStatementForm().paragraphs.push('')
  }

  function removeProblemParagraph(index: number) {
    problemStatementForm.value?.paragraphs.splice(index, 1)
  }

  async function init() {
    templatesLoading.value = true
    try {
      const [, templatesList] = await Promise.all([
        fetchAccount(),
        listTemplates()
      ])
      templates.value = templatesList
    } catch {
      // errors handled by the injected provider account store
    } finally {
      templatesLoading.value = false
    }

    syncFromAccount()
  }

  function cloneMutable<T>(value: T): T {
    return structuredClone(toRaw(value))
  }

  function syncFromAccount() {
    const acc = account.value
    if (!acc) return

    selectedTemplateId.value = acc.coachPageTemplateId

    const existingKeys = Object.keys(sectionsConfig)
    for (const key of existingKeys) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete sectionsConfig[key]
    }
    if (acc.sectionsConfig) {
      Object.assign(sectionsConfig, acc.sectionsConfig)
    }

    pillarsForm.value = acc.pillarsJson ? cloneMutable(acc.pillarsJson) as PillarsJson : null
    faqForm.value = acc.faqJson ? cloneMutable(acc.faqJson) as FaqItem[] : []
    benefitsForm.value = acc.benefitsJson ? cloneMutable(acc.benefitsJson) as BenefitsJson : null
    howItWorksForm.value = acc.howItWorksJson ? cloneMutable(acc.howItWorksJson) as HowItWorksStep[] : []
    educationalContentForm.value = acc.educationalContentJson ? cloneMutable(acc.educationalContentJson) as EducationalContentJson : null
    problemStatementForm.value = acc.problemStatementJson ? cloneMutable(acc.problemStatementJson) as ProblemStatementJson : null
  }

  async function saveTemplate(templateId: string): Promise<{ ok: boolean, errorCode?: string }> {
    const result = await updateAccountDetailed({ coachPageTemplateId: templateId })

    if (result.ok) {
      syncFromAccount()
      return { ok: true }
    }

    return { ok: false, errorCode: result.errorCode }
  }

  async function saveSectionsConfig(): Promise<boolean> {
    return updateAccount({ sectionsConfig: { ...sectionsConfig } })
  }

  async function savePillars(): Promise<boolean> {
    return updateAccount({ pillarsJson: pillarsForm.value })
  }

  async function saveFaq(): Promise<boolean> {
    return updateAccount({ faqJson: faqForm.value.length > 0 ? faqForm.value : null })
  }

  async function saveBenefits(): Promise<boolean> {
    return updateAccount({ benefitsJson: benefitsForm.value })
  }

  async function saveHowItWorks(): Promise<boolean> {
    return updateAccount({ howItWorksJson: howItWorksForm.value.length > 0 ? howItWorksForm.value : null })
  }

  async function saveEducationalContent(): Promise<boolean> {
    return updateAccount({ educationalContentJson: educationalContentForm.value })
  }

  async function saveProblemStatement(): Promise<boolean> {
    return updateAccount({ problemStatementJson: problemStatementForm.value })
  }

  return {
    account: readonly(account),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    updateAccount, // Story 0-26 — exposé pour bio/testimonials/branding inline
    templates: readonly(templates),
    templatesLoading: readonly(templatesLoading),
    selectedTemplateId: readonly(selectedTemplateId),
    selectedTemplate,
    availableSections,
    configurableSections,
    editableSections,
    hasEmotionalSupportSection,
    sectionsConfig,
    pillarsForm,
    faqForm,
    benefitsForm,
    howItWorksForm,
    educationalContentForm,
    problemStatementForm,
    init,
    isAlwaysOn,
    isSectionOn,
    saveTemplate,
    saveSectionsConfig,
    savePillars,
    saveFaq,
    saveBenefits,
    saveHowItWorks,
    saveEducationalContent,
    saveProblemStatement,
    setBenefitsVisionIntro,
    setBenefitsVisionText,
    addBenefit,
    removeBenefit,
    addEducationalParagraph,
    removeEducationalParagraph,
    setEducationalInsightTitle,
    setEducationalInsightContent,
    setProblemStatementBlockquote,
    addProblemParagraph,
    removeProblemParagraph
  }
}
