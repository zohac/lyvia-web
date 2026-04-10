import { ref, reactive, computed, readonly } from 'vue'
import { useProviderAccount } from '../account/useProviderAccount'
import {
  getCoachPageEditableSections,
  getCoachPageConfigurableSections,
  isCoachPageAlwaysOnSection,
  supportsEmotionalSupportSection
} from './domain/coach-page-editor'
import { listCoachPageTemplates } from './services/coach-page-templates.service'
import type { CoachPageTemplate } from './api/coach-page-template.contract'
import type {
  PillarsJson,
  FaqItem,
  BenefitsJson,
  HowItWorksStep,
  EducationalContentJson,
  ProblemStatementJson
} from '../account/api/provider-account.contract'

export function useCoachPageEditor() {
  const { account, loading, saving, error, fetchAccount, updateAccount, updateAccountDetailed } = useProviderAccount()

  const templates = ref<CoachPageTemplate[]>([])
  const templatesLoading = ref(false)

  // ── Section toggle form state ──
  const sectionsConfig = reactive<Record<string, boolean>>({})

  // ── Content form states ──
  const pillarsForm = ref<PillarsJson | null>(null)
  const faqForm = ref<FaqItem[]>([])
  const benefitsForm = ref<BenefitsJson | null>(null)
  const howItWorksForm = ref<HowItWorksStep[]>([])
  const educationalContentForm = ref<EducationalContentJson | null>(null)
  const problemStatementForm = ref<ProblemStatementJson | null>(null)

  // ── Derived ──
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

  // ── Init ──
  async function init() {
    templatesLoading.value = true
    try {
      const [, templatesList] = await Promise.all([
        fetchAccount(),
        listCoachPageTemplates()
      ])
      templates.value = templatesList
    } catch {
      // errors handled by useProviderAccount
    } finally {
      templatesLoading.value = false
    }

    syncFromAccount()
  }

  function syncFromAccount() {
    const acc = account.value
    if (!acc) return

    selectedTemplateId.value = acc.coachPageTemplateId

    // Sync sections config — reset then merge from account
    const existingKeys = Object.keys(sectionsConfig)
    for (const k of existingKeys) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete sectionsConfig[k]
    }
    if (acc.sectionsConfig) {
      Object.assign(sectionsConfig, acc.sectionsConfig)
    }

    // Sync content forms — structuredClone produces mutable copies at runtime;
    // cast needed because TS infers DeepReadonly from readonly(account)
    pillarsForm.value = acc.pillarsJson ? structuredClone(acc.pillarsJson) as PillarsJson : null
    faqForm.value = acc.faqJson ? structuredClone(acc.faqJson) as FaqItem[] : []
    benefitsForm.value = acc.benefitsJson ? structuredClone(acc.benefitsJson) as BenefitsJson : null
    howItWorksForm.value = acc.howItWorksJson ? structuredClone(acc.howItWorksJson) as HowItWorksStep[] : []
    educationalContentForm.value = acc.educationalContentJson ? structuredClone(acc.educationalContentJson) as EducationalContentJson : null
    problemStatementForm.value = acc.problemStatementJson ? structuredClone(acc.problemStatementJson) as ProblemStatementJson : null
  }

  async function saveTemplate(templateId: string): Promise<{ ok: boolean, errorCode?: string }> {
    const result = await updateAccountDetailed({ coachPageTemplateId: templateId })

    if (result.ok) {
      syncFromAccount()
      return { ok: true }
    }

    return { ok: false, errorCode: result.errorCode }
  }

  // ── Sauvegarde toggles ──
  async function saveSectionsConfig(): Promise<boolean> {
    return updateAccount({ sectionsConfig: { ...sectionsConfig } })
  }

  // ── Sauvegarde sections individuelles ──
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
    // State
    account: readonly(account),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    templates: readonly(templates),
    templatesLoading: readonly(templatesLoading),
    selectedTemplateId: readonly(selectedTemplateId),
    selectedTemplate,
    availableSections,
    configurableSections,
    editableSections,
    hasEmotionalSupportSection,
    sectionsConfig,

    // Content forms
    pillarsForm,
    faqForm,
    benefitsForm,
    howItWorksForm,
    educationalContentForm,
    problemStatementForm,

    // Methods
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
    saveProblemStatement
  }
}
