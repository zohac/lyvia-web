<script setup lang="ts">
/**
 * Provider Coach Page Editor (YC3.1 + Story 0-26)
 *
 * Story 0-26 — Refonte UX :
 *   - Switches inline dans le header de chaque card éditeur (suppression de la
 *     section autonome "Sections visibles") avec label explicite
 *     "Visible sur ma page"
 *   - Auto-save debounced 500ms + rollback optimistic sur échec
 *   - Textareas pleine largeur (w-full)
 *   - Rapatriement bio + testimonials inline (suppression du lien "Modifiable
 *     dans Mon compte")
 *   - Migration de la section "Identité affichée dans vos emails" depuis
 *     /provider/account
 *
 * Round PO 2026-05-01 :
 *   - Ordre des cards éditeur aligné sur l'ordre de rendu de la page publique
 *     coach (hero → bio → problemStatement → benefits → pillars → howItWorks
 *     → pricing → educationalContent → testimonials → faq → disclaimer)
 *   - Always-on (hero, disclaimer) : pas de switch — indicateur "Toujours
 *     visible" compact
 *   - Switch dans header avec label "Visible sur ma page"
 *   - Bouton "Enregistrer" déplacé dans le footer de chaque card
 *   - Harmonisation libellé bouton : "Enregistrer" partout (plus de
 *     "Sauvegarder") + toasts succès "...enregistré(e)(s)" cohérents
 */
import {
  getCoachPageExternalEditorSection,
  getCoachPageTemplateSaveErrorToast,
  isCoachPageInlineEditorSection
} from '~/features/coach/domain/coach-page-editor'
import { useCoachPageEditor } from '~/features/coach/useCoachPageEditor'
import {
  snapshotSectionsConfig,
  applySectionsConfigSnapshot
} from '~/features/coach/section-config-rollback'
import type { TestimonialItem } from '~/features/account/api/provider-account.contract'
import {
  uploadAsset,
  formatUploadError,
  validateFileUpload,
  validateBrandLogoFile
} from '~/features/assets/use-asset-upload'
import { useCoachPagePreviewProfile } from '~/features/coach/useCoachPagePreviewProfile'
import { useCoachPagePreviewState } from '~/features/coach/useCoachPagePreviewState'
import CoachPagePreviewPanel from '~/components/organisms/CoachPagePreviewPanel.vue'
import FormControl from '~/components/molecules/FormControl.vue'
import SystemAlert from '~/components/atoms/SystemAlert.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Ma page coach'
})

const toast = useToast()

// Story 0-26 — un SEUL appel à useCoachPageEditor() qui consomme un unique store
// providerAccount via createCoachPageEditor. Auparavant on appelait useProviderAccount()
// une 2ème fois pour récupérer updateAccount, mais useProviderAccount n'est PAS un
// singleton (utilise `ref()` interne, pas `useState()`) → 2 instances indépendantes,
// le watch sur le 2ème store ne déclenchait jamais après fetch du 1er.
const editor = useCoachPageEditor()
const {
  account,
  loading,
  saving,
  error: accountError,
  updateAccount,
  fetchAccount,
  templates,
  templatesLoading,
  selectedTemplateId,
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
} = editor

onMounted(() => init())

const PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH = 500
const TESTIMONIALS_MAX = 10
// "Qui suis-je" édite `longBio` (5000 chars max — DTO `@MaxLength(5000)`),
// pas le champ `bio` (500 chars, tagline hero). Le rendu public CoachPageSignature
// / CoachPageEssentiel priorise `longBio` pour cette section.
const LONG_BIO_MAX_LENGTH = 5000
const BRAND_NAME_MAX_LENGTH = 100
// Story 0-27 — `logoUrl` n'est plus saisi en URL libre, il est uploadé via le widget
// (POST /provider/assets/upload type=brand_logo). La constante d'URL est supprimée.
const TOGGLE_AUTOSAVE_DEBOUNCE_MS = 500

// ── Section labels ──
const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (en-tête)',
  bio: 'Qui suis-je',
  benefits: 'Bénéfices',
  pillars: 'Piliers',
  howItWorks: 'Comment ça marche',
  educationalContent: 'Contenu éducatif',
  problemStatement: 'Énoncé du problème',
  faq: 'Questions fréquentes',
  testimonials: 'Témoignages',
  pricing: 'Tarifs',
  disclaimer: 'Disclaimer médical',
  branding: 'Identité affichée dans vos emails'
}

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section
}

// ── Display order — aligné sur l'ordre de rendu de la page publique coach (PO 2026-05-01) ──
// hero (always-on, top) → bio → problemStatement → benefits → pillars → howItWorks
// → pricing → educationalContent → testimonials → faq → disclaimer (always-on, bottom)
const DISPLAY_SECTION_ORDER = [
  'hero',
  'bio',
  'problemStatement',
  'benefits',
  'pillars',
  'howItWorks',
  'pricing',
  'educationalContent',
  'testimonials',
  'faq',
  'disclaimer'
] as const

function sortByDisplayOrder(sections: readonly string[]): string[] {
  const ordered: string[] = []
  for (const s of DISPLAY_SECTION_ORDER) {
    if (sections.includes(s)) ordered.push(s)
  }
  // Append any unknown sections at the end (defensive — future templates)
  for (const s of sections) {
    if (!ordered.includes(s)) ordered.push(s)
  }
  return ordered
}

const orderedAlwaysOnSections = computed(() =>
  sortByDisplayOrder(configurableSections.value.filter(isAlwaysOn))
)
const orderedEditableSections = computed(() =>
  sortByDisplayOrder(editableSections.value)
)

// ── "Qui suis-je" form state (rapatrié depuis /provider/account) ──
// Édite `provider_profiles.long_bio` (= 5000 chars), pas le `bio` court (500 chars).
// + city + region rapatriés depuis Mon compte (round terrain Sophie 2026-05-01) :
// la section "Qui suis-je" expose désormais l'identité géographique de la coach.
const bioForm = reactive({
  longBio: '',
  city: '',
  region: ''
})
const bioCharCount = computed(() => bioForm.longBio?.length ?? 0)

// ── Photo secondaire (round terrain 2026-05-01) — rapatriée depuis Mon compte ──
// Photo affichée dans la section "Qui suis-je" de la page publique coach.
// L'API `GET /provider/account` n'expose pas (encore) `secondaryPhotoUrl` → la preview
// reste vide au load, elle se remplit après upload réussi (comportement pré-existant
// hérité de Mon compte ; un futur ticket pourra ajouter le champ au contract).
const secondaryPhotoFile = ref<File | null>(null)
const secondaryPhotoPreview = ref<string | null>(null)
const secondaryPhotoUploading = ref(false)
const secondaryPhotoError = ref<string | null>(null)
const secondaryFileInputRef = ref<HTMLInputElement | null>(null)

// uploadAsset / formatUploadError / validateFileUpload extracted to
// ~/features/assets/use-asset-upload (Story 0-27 — DRY A25)

function triggerSecondaryFileInput() {
  secondaryFileInputRef.value?.click()
}

function onSecondaryFileSelected(event: Event) {
  secondaryPhotoError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const err = validateFileUpload(file, 2 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp'])
  if (err) {
    secondaryPhotoError.value = err
    return
  }

  secondaryPhotoFile.value = file
  secondaryPhotoPreview.value = URL.createObjectURL(file)
}

async function handleSecondaryPhotoUpload() {
  if (!secondaryPhotoFile.value) return
  secondaryPhotoUploading.value = true
  secondaryPhotoError.value = null

  try {
    const result = await uploadAsset('secondary_photo', secondaryPhotoFile.value)
    secondaryPhotoPreview.value = result.url
    secondaryPhotoFile.value = null
    toast.add({ title: 'Photo secondaire enregistrée', color: 'primary' })
  } catch (e: unknown) {
    secondaryPhotoError.value = formatUploadError(e)
    toast.add({ title: 'Erreur', description: secondaryPhotoError.value, color: 'error' })
  } finally {
    secondaryPhotoUploading.value = false
  }
}

// ── Testimonials form state (rapatrié, AC-5) ──
const testimonialsForm = ref<TestimonialItem[]>([])

// ── Email branding form state (migré depuis 0-20c, refondu par 0-27) ──
// `brandName` reste un champ texte libre. `logoUrl` n'est plus saisi en URL —
// il est uploadé via le widget (POST /provider/assets/upload type=brand_logo)
// et persisté côté backend dans `provider_profiles.logo_url`.
const brandingForm = reactive({
  brandName: ''
})
const brandingError = ref<string | null>(null)
const brandNameCharCount = computed(() => brandingForm.brandName?.length ?? 0)

// Logo upload widget state (Story 0-27 — Convention 6 magic bytes côté backend,
// validation client = taille + MIME type seulement, le backend rejette les SVG
// et les magic bytes spoofed via UploadAssetUseCase.validateMimeType).
const logoFile = ref<File | null>(null)
const logoLocalPreview = ref<string | null>(null)
const logoFileInputRef = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const logoUploadError = ref<string | null>(null)
const logoDeleting = ref(false)

// Source serveur (URL CDN persistée). Source unique de vérité = `account.value.logoUrl`.
const logoServerUrl = computed(() => account.value?.logoUrl ?? null)
// Preview composite : fichier local sélectionné en priorité, sinon URL serveur.
const logoPreviewSrc = computed(
  () => logoLocalPreview.value ?? logoServerUrl.value ?? ''
)
// Pour la status pill et l'info box "Keova par défaut".
const hasBrandLogo = computed(() => Boolean(logoServerUrl.value))

// Hydrate forms whenever the account store refreshes (initial load + post-save refetch)
// Le store `account` ici est le MÊME que celui consommé par useCoachPageEditor (singleton
// via createCoachPageEditor → un seul useProviderAccount). Le watch déclenche bien après
// le fetchAccount() de init(), peuplant tous les formulaires migrés.
watch(
  () => account.value,
  (acc) => {
    if (!acc) return
    bioForm.longBio = acc.longBio ?? ''
    bioForm.city = acc.city ?? ''
    bioForm.region = acc.region ?? ''
    testimonialsForm.value = acc.testimonialsJson?.length
      ? acc.testimonialsJson.map(t => ({ ...t }))
      : []
    brandingForm.brandName = acc.brandName ?? ''
    // logoUrl n'est plus une form value : il est piloté par le widget upload
    // et lu directement depuis `account.value.logoUrl` via `logoServerUrl`.
  },
  { immediate: true, deep: false }
)

// ── Live preview (Story 0-28) ──
// `useCoachPagePreviewProfile` projects the merged server+form state into
// the `PublicProviderProfile` + `PublicTenantResponse` shape consumed by
// CoachPage* templates. Free-text fields are debounced 250ms; toggles +
// brandName + logoUrl flow through instantly.
//
// `previewTemplateCode` resolves the currently selected template's code
// (`signature`, `essentiel`, future variants) by mapping `selectedTemplateId`
// (UUID) against the loaded `templates` list. Reactive — a click on a
// template card switches the preview to the matching `<component :is>`.
const previewTemplateCode = computed<string | null>(() => {
  const id = selectedTemplateId.value
  if (!id) return null
  const match = templates.value.find(t => t.id === id)
  return match?.code ?? null
})
//
// `account` is exposed as `readonly(account)` by createCoachPageEditor for
// safety (no external mutation), but the preview composable only reads
// `.value` — we cast through `unknown` to feed it the non-readonly Ref
// shape it declares.
type ProviderAccountRef = import('vue').Ref<
  import('~/features/account/api/provider-account.contract').ProviderAccountResponse | null
>
const { draftCoachProfile, draftTenant } = useCoachPagePreviewProfile({
  account: account as unknown as ProviderAccountRef,
  bioForm,
  testimonialsForm,
  brandingForm,
  sectionsConfig,
  pillarsForm: pillarsForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').PillarsJson | null
  >,
  faqForm: faqForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').FaqItem[]
  >,
  benefitsForm: benefitsForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').BenefitsJson | null
  >,
  howItWorksForm: howItWorksForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').HowItWorksStep[]
  >,
  educationalContentForm: educationalContentForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').EducationalContentJson | null
  >,
  problemStatementForm: problemStatementForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').ProblemStatementJson | null
  >,
  templateCode: previewTemplateCode
})

// `useCoachPagePreviewState` persists open + device choice in localStorage.
// SSR-safe (defaults at first paint, hydrated onMounted).
const previewState = useCoachPagePreviewState()
const { isOpen: previewOpen, device: previewDevice } = previewState

// Mobile slideover is independent from the persisted desktop `previewOpen`
// state — Sophie opens it explicitly via the FAB, never auto-opened on
// mount (would obscure the editor on a narrow viewport).
const previewMobileOpen = ref(false)

function openMobilePreview(): void {
  previewMobileOpen.value = true
}

function closeMobilePreview(): void {
  previewMobileOpen.value = false
}

function reopenDesktopPreview(): void {
  previewState.toggleOpen()
}

function closeDesktopPreview(): void {
  previewState.toggleOpen()
}

function setPreviewDevice(next: 'desktop' | 'mobile'): void {
  previewState.setDevice(next)
}

// ── Template selection (F4: explicit TEMPLATE_NOT_AVAILABLE handling) ──
async function onSelectTemplate(templateId: string) {
  if (saving.value || templateId === selectedTemplateId.value) return
  const result = await saveTemplate(templateId)
  if (result.ok) {
    toast.add({ title: 'Template mis à jour', color: 'primary' })
  } else {
    const message = getCoachPageTemplateSaveErrorToast(result.errorCode)
    toast.add({ title: message.title, description: message.description, color: 'error' })
  }
}

// ── Auto-save toggle (AC-2) ──
// Snapshot of the last server-confirmed sectionsConfig (for rollback).
// `account.value.sectionsConfig` est la source de vérité — capturée via le helper pur
// `snapshotSectionsConfig` (testable, cf. section-config-rollback.spec.ts).
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingPreviousSnapshot: Record<string, boolean> | null = null

function onToggleSection(section: string, value: boolean) {
  if (isAlwaysOn(section)) return
  // Snapshot once per debounce window — first toggle within the window captures the rollback state
  if (pendingPreviousSnapshot === null) {
    pendingPreviousSnapshot = snapshotSectionsConfig(account.value?.sectionsConfig)
  }
  // Optimistic apply
  sectionsConfig[section] = value
  scheduleSectionsConfigSave()
}

function scheduleSectionsConfigSave() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null
    void flushSectionsConfigSave()
  }, TOGGLE_AUTOSAVE_DEBOUNCE_MS)
}

async function flushSectionsConfigSave() {
  const previous = pendingPreviousSnapshot
  pendingPreviousSnapshot = null
  const ok = await saveSectionsConfig()
  if (ok) {
    toast.add({ title: 'Configuration enregistrée', color: 'primary' })
  } else {
    // Rollback to last server-confirmed state via pure helper.
    if (previous) {
      applySectionsConfigSnapshot(sectionsConfig, previous)
    }
    toast.add({ title: 'Impossible d\'enregistrer la configuration', color: 'error' })
  }
}

// ── "Qui suis-je" inline editor (AC-4) — longBio + city + region ──
async function onSaveBio() {
  const ok = await updateAccount({
    longBio: bioForm.longBio.trim() || null,
    city: bioForm.city.trim() || null,
    region: bioForm.region.trim() || null
  })
  toast.add({
    title: ok ? 'Qui suis-je enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── Testimonials inline editor (AC-5) ──
function addTestimonial() {
  if (testimonialsForm.value.length >= TESTIMONIALS_MAX) return
  testimonialsForm.value.push({ quote: '', firstName: '' })
}

function removeTestimonial(index: number) {
  testimonialsForm.value.splice(index, 1)
}

async function onSaveTestimonials() {
  const filtered = testimonialsForm.value.filter(t => t.quote.trim() && t.firstName.trim())
  const ok = await updateAccount({ testimonialsJson: filtered })
  toast.add({
    title: ok ? 'Témoignages enregistrés' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── Branding inline editor — migré depuis /provider/account, refondu par Story 0-27 ──
// Le formulaire ne sauvegarde plus que `brandName` (le `logoUrl` est upload-driven).
async function handleBrandingSubmit() {
  brandingError.value = null
  const ok = await updateAccount({
    brandName: brandingForm.brandName.trim() || null
  })
  if (ok) {
    toast.add({ title: 'Informations enregistrées', color: 'primary' })
  } else {
    toast.add({
      title: 'Erreur',
      description: accountError.value ?? 'Une erreur est survenue',
      color: 'error'
    })
  }
}

// ── Brand logo upload (Story 0-27 AC-5) ──
function triggerLogoFileInput() {
  logoFileInputRef.value?.click()
}

function onLogoFileSelected(event: Event) {
  logoUploadError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const err = validateBrandLogoFile(file)
  if (err) {
    logoUploadError.value = err
    target.value = ''
    return
  }

  logoFile.value = file
  // Revoke previous local preview URL to avoid memory leak
  if (logoLocalPreview.value && logoLocalPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoLocalPreview.value)
  }
  logoLocalPreview.value = URL.createObjectURL(file)
}

async function handleLogoUpload() {
  if (!logoFile.value) return
  logoUploading.value = true
  logoUploadError.value = null
  try {
    await uploadAsset('brand_logo', logoFile.value)
    // Backend a persisté provider_profiles.logo_url — on rafraîchit le store account
    // pour exposer la nouvelle URL CDN à `logoServerUrl` + au reste de la page.
    await fetchAccount()
    // Cleanup local preview (URL CDN officielle prend le relais via account.value.logoUrl)
    if (logoLocalPreview.value && logoLocalPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(logoLocalPreview.value)
    }
    logoLocalPreview.value = null
    logoFile.value = null
    if (logoFileInputRef.value) logoFileInputRef.value.value = ''
    toast.add({ title: 'Logo téléversé', color: 'primary' })
  } catch (e: unknown) {
    logoUploadError.value = formatUploadError(e, 'brand_logo')
    toast.add({
      title: 'Erreur',
      description: logoUploadError.value,
      color: 'error'
    })
  } finally {
    logoUploading.value = false
  }
}

async function handleLogoDelete() {
  logoDeleting.value = true
  logoUploadError.value = null
  const ok = await updateAccount({ logoUrl: null })
  logoDeleting.value = false
  if (ok) {
    toast.add({ title: 'Logo supprimé', color: 'primary' })
  } else {
    toast.add({
      title: 'Erreur',
      description: accountError.value ?? 'Une erreur est survenue',
      color: 'error'
    })
  }
}

function cancelLogoSelection() {
  if (logoLocalPreview.value && logoLocalPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoLocalPreview.value)
  }
  logoLocalPreview.value = null
  logoFile.value = null
  logoUploadError.value = null
  if (logoFileInputRef.value) logoFileInputRef.value.value = ''
}

// ── Pillars ──
function addPillar() {
  if (!pillarsForm.value) {
    pillarsForm.value = { items: [] }
  }
  pillarsForm.value.items.push({ title: '', description: '' })
}

function removePillar(index: number) {
  pillarsForm.value?.items.splice(index, 1)
}

async function onSavePillars() {
  const ok = await savePillars()
  toast.add({ title: ok ? 'Piliers enregistrés' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

// ── FAQ ──
function addFaq() {
  faqForm.value.push({ label: '', content: '' })
}

function removeFaq(index: number) {
  faqForm.value.splice(index, 1)
}

async function onSaveFaq() {
  const ok = await saveFaq()
  toast.add({ title: ok ? 'FAQ enregistrée' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

async function onSaveBenefits() {
  const ok = await saveBenefits()
  toast.add({ title: ok ? 'Bénéfices enregistrés' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

// ── How it works ──
function addStep() {
  howItWorksForm.value.push({ number: String(howItWorksForm.value.length + 1), title: '', description: '' })
}

function removeStep(index: number) {
  howItWorksForm.value.splice(index, 1)
  // Renumber
  howItWorksForm.value.forEach((s, i) => {
    s.number = String(i + 1)
  })
}

async function onSaveHowItWorks() {
  const ok = await saveHowItWorks()
  toast.add({ title: ok ? 'Étapes enregistrées' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

async function onSaveEducationalContent() {
  const ok = await saveEducationalContent()
  toast.add({ title: ok ? 'Contenu éducatif enregistré' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

async function onSaveProblemStatement() {
  const ok = await saveProblemStatement()
  toast.add({ title: ok ? 'Énoncé enregistré' : 'Erreur d\'enregistrement', color: ok ? 'primary' : 'error' })
}

// ── Section has editable form? ──
function hasEditor(section: string): boolean {
  return isCoachPageInlineEditorSection(section)
}

function externalSection(section: string) {
  return getCoachPageExternalEditorSection(section)
}
</script>

<template>
  <div>
    <!-- Hidden file input — placé au niveau page (pas dans le v-for des éditeurs)
      pour que la template ref `secondaryFileInputRef` soit un seul HTMLInputElement
      et non un array, sinon `.click()` est silencieusement ignoré par Vue 3. -->
    <input
      ref="secondaryFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onSecondaryFileSelected"
    >

    <AtomsDsPageHeader>
      Ma page coach
      <template #subtitle>
        Choisissez un template et personnalisez le contenu de votre page publique.
      </template>
    </AtomsDsPageHeader>

    <!-- Loading -->
    <div
      v-if="loading || templatesLoading"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-48" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-40"
        />
      </div>
    </div>

    <!-- ── Story 0-28 — Layout split desktop éditeur ↔ aperçu ──
      Le grid s'active uniquement quand `previewOpen === true` ET le viewport
      est ≥ xl (1280px). En dessous ou panel fermé, le main content occupe
      toute la largeur. La colonne preview est sticky et dispose de son
      propre overflow interne pour le scroll indépendant de l'éditeur.
    -->
    <div
      v-else
      :class="previewOpen ? 'xl:grid xl:grid-cols-2 xl:gap-8' : ''"
      data-testid="coach-page-editor-grid"
    >
      <div
        :class="previewOpen ? 'xl:min-w-0' : ''"
        data-testid="coach-page-editor-column"
      >
        <!-- ═══════ 1. TEMPLATE SELECTOR ═══════ -->
        <section class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-[color:var(--color-text-primary)]">
            Template
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="tmpl in templates"
              :key="tmpl.id"
              type="button"
              class="relative rounded-xl border-2 p-5 text-left transition-all"
              :class="[
                tmpl.id === selectedTemplateId
                  ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-card)] shadow-md'
                  : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] hover:border-[color:var(--color-brand-accent)]'
              ]"
              :disabled="saving"
              @click="onSelectTemplate(tmpl.id)"
            >
              <div
                v-if="tmpl.id === selectedTemplateId"
                class="absolute right-3 top-3"
              >
                <UIcon
                  name="i-lucide-check-circle"
                  class="size-5 text-[color:var(--color-brand-primary)]"
                />
              </div>
              <NuxtImg
                v-if="tmpl.previewImageUrl"
                :src="tmpl.previewImageUrl"
                :alt="`Aperçu du template ${tmpl.name}`"
                class="mb-3 aspect-[16/9] w-full rounded-lg object-cover"
                width="320"
                height="180"
                loading="lazy"
              />
              <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                {{ tmpl.name }}
              </h3>
              <p
                v-if="tmpl.description"
                class="mt-1 text-sm text-[color:var(--color-brand-secondary)]"
              >
                {{ tmpl.description }}
              </p>
              <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {{ tmpl.sectionsAvailable.length }} sections disponibles
              </p>
            </button>
          </div>
        </section>

        <!-- ═══════ 2. IDENTITÉ DE MARQUE — Config globale (header public + emails) ═══════
        Story 0-26 round terrain 2026-05-01 — Pilote `brandName` + `logoUrl` utilisés
        dans le header de la page publique coach ET dans le subject/header/footer de
        tous les emails. Pas de switch (toujours active, fallback Keova si vide).
        Placée en position 2 (après Template) car c'est de la config foundationnelle,
        pas une section de la page publique.
      -->
        <section
          id="section-branding"
          class="mb-10 overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
        >
          <!-- Header avec gradient + icon badge + status pill -->
          <div class="border-b border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-highlight)] to-[color:var(--color-surface-card)] px-6 py-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-brand-primary)]/10">
                  <UIcon
                    name="i-lucide-sparkles"
                    class="size-5 text-[color:var(--color-brand-primary)]"
                  />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    Identité de marque
                  </h2>
                  <p class="mt-0.5 text-sm text-[color:var(--color-brand-secondary)]">
                    Logo et nom affichés dans le header de votre page publique et dans tous les emails envoyés à vos clientes.
                  </p>
                </div>
              </div>
              <span
                class="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                :class="(brandingForm.brandName?.trim() || hasBrandLogo)
                  ? 'bg-[color:var(--color-brand-primary)]/10 text-[color:var(--color-brand-primary)]'
                  : 'bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-muted)]'"
              >
                {{ (brandingForm.brandName?.trim() || hasBrandLogo) ? 'Personnalisée' : 'Keova par défaut' }}
              </span>
            </div>
          </div>

          <!-- Live preview tiles : header public + email -->
          <div class="grid grid-cols-1 gap-3 border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4 sm:grid-cols-2">
            <div class="rounded-[var(--radius-md)] bg-[color:var(--color-surface-card)] p-4 shadow-sm ring-1 ring-[color:var(--color-border-subtle)]">
              <p class="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                <UIcon
                  name="i-lucide-globe"
                  class="size-3"
                />
                Header de votre page publique
              </p>
              <div class="flex h-10 items-center gap-3 rounded-md bg-[color:var(--color-surface-page)] px-3">
                <img
                  v-if="logoPreviewSrc"
                  :src="logoPreviewSrc"
                  alt="Logo header"
                  class="h-6 w-auto max-w-[100px] object-contain"
                >
                <UIcon
                  v-else
                  name="i-lucide-image"
                  class="size-5 text-[color:var(--color-brand-muted)]"
                />
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {{ brandingForm.brandName?.trim() || 'Keova' }}
                </span>
              </div>
            </div>

            <div class="rounded-[var(--radius-md)] bg-[color:var(--color-surface-card)] p-4 shadow-sm ring-1 ring-[color:var(--color-border-subtle)]">
              <p class="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                <UIcon
                  name="i-lucide-mail"
                  class="size-3"
                />
                En-tête email
              </p>
              <div class="flex h-10 items-center justify-center rounded-md bg-[color:var(--color-surface-highlight)] px-3">
                <img
                  v-if="logoPreviewSrc"
                  :src="logoPreviewSrc"
                  alt="Logo email"
                  class="max-h-7 w-auto max-w-[180px] object-contain"
                >
                <span
                  v-else
                  class="text-sm font-semibold text-[color:var(--color-text-primary)]"
                >
                  {{ brandingForm.brandName?.trim() || 'Keova' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Formulaire en grid 2 colonnes -->
          <div class="px-6 py-5">
            <SystemAlert
              v-if="brandingError"
              class="mb-4"
              variant="error"
              :description="brandingError"
            />
            <SystemAlert
              v-else-if="!brandingForm.brandName?.trim() && !hasBrandLogo"
              class="mb-4"
              variant="info"
              description="Renseignez votre nom de marque et téléversez votre logo pour personnaliser votre identité. Sinon, le nom et le logo Keova sont utilisés par défaut."
            />

            <div class="grid gap-4 sm:grid-cols-2">
              <FormControl
                id="brandName"
                label="Nom de marque"
                hint="Affiché dans le header de votre page publique et le pied de page de vos emails."
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="brandingForm.brandName"
                    v-bind="inputAttrs"
                    class="w-full"
                    placeholder="Ex: Sophie Jouan — Coach"
                    :maxlength="BRAND_NAME_MAX_LENGTH"
                  />
                </template>
                <template #label-aside>
                  <span
                    class="text-xs"
                    :class="brandNameCharCount > BRAND_NAME_MAX_LENGTH - 10 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
                  >
                    {{ brandNameCharCount }}/{{ BRAND_NAME_MAX_LENGTH }}
                  </span>
                </template>
              </FormControl>

              <!-- ── Logo upload widget (Story 0-27) ──
              Pattern aligné sur secondary_photo (account.vue) — input file
              caché + bouton + preview + actions Remplacer/Supprimer.
            -->
              <div class="space-y-2">
                <label
                  for="brand-logo-upload"
                  class="block text-sm font-medium text-[color:var(--color-text-primary)]"
                >Logo</label>
                <p class="text-xs text-[color:var(--color-brand-secondary)]">
                  PNG transparent recommandé, max 1 Mo. Redimensionné automatiquement à 480×160 (ratio préservé).
                </p>

                <input
                  id="brand-logo-upload"
                  ref="logoFileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  data-testid="brand-logo-file-input"
                  @change="onLogoFileSelected"
                >

                <!-- État : preview locale (fichier sélectionné, pas encore uploadé) -->
                <div
                  v-if="logoFile && logoLocalPreview"
                  class="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-3"
                >
                  <div class="flex items-center gap-3">
                    <img
                      :src="logoLocalPreview"
                      alt="Aperçu logo"
                      class="h-10 w-auto max-w-[120px] object-contain"
                      data-testid="brand-logo-local-preview"
                    >
                    <span class="text-xs text-[color:var(--color-brand-muted)]">
                      {{ logoFile.name }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      :loading="logoUploading"
                      :disabled="logoUploading"
                      color="primary"
                      variant="solid"
                      size="sm"
                      icon="i-lucide-cloud-upload"
                      @click="handleLogoUpload"
                    >
                      {{ logoUploading ? 'Téléversement…' : 'Téléverser' }}
                    </UButton>
                    <UButton
                      variant="ghost"
                      size="sm"
                      :disabled="logoUploading"
                      @click="cancelLogoSelection"
                    >
                      Annuler
                    </UButton>
                  </div>
                </div>

                <!-- État : logo persisté en DB (pas de fichier en attente) -->
                <div
                  v-else-if="hasBrandLogo"
                  class="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-3"
                >
                  <img
                    :src="logoServerUrl ?? ''"
                    alt="Logo actuel"
                    class="h-10 w-auto max-w-[120px] object-contain"
                    data-testid="brand-logo-current-preview"
                  >
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      variant="outline"
                      size="sm"
                      icon="i-lucide-upload"
                      type="button"
                      @click="triggerLogoFileInput"
                    >
                      Remplacer
                    </UButton>
                    <UButton
                      variant="ghost"
                      size="sm"
                      color="error"
                      icon="i-lucide-trash-2"
                      :loading="logoDeleting"
                      :disabled="logoDeleting"
                      @click="handleLogoDelete"
                    >
                      Supprimer
                    </UButton>
                  </div>
                </div>

                <!-- État : aucun logo (call-to-upload) -->
                <UButton
                  v-else
                  variant="outline"
                  size="sm"
                  icon="i-lucide-upload"
                  type="button"
                  data-testid="brand-logo-upload-cta"
                  @click="triggerLogoFileInput"
                >
                  Téléverser un logo
                </UButton>

                <p
                  v-if="logoUploadError"
                  class="text-sm text-[color:var(--color-error)]"
                  data-testid="brand-logo-error"
                >
                  {{ logoUploadError }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Save (Nom de marque uniquement — le logo est upload-driven) -->
          <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              :loading="saving"
              :disabled="saving"
              @click="handleBrandingSubmit"
            >
              Enregistrer
            </UButton>
          </div>
        </section>

        <!-- ═══════ 3. SECTIONS DE LA PAGE PUBLIQUE ═══════
        Ordre aligné sur le rendu de la page publique coach (PO 2026-05-01) :
        hero → bio → problemStatement → benefits → pillars → howItWorks
        → pricing → educationalContent → testimonials → faq → disclaimer
      -->

        <!-- Always-on header (hero) — pas de switch, juste un indicateur "Toujours visible" -->
        <template
          v-for="section in orderedAlwaysOnSections"
          :key="`always-on-${section}`"
        >
          <div
            v-if="(DISPLAY_SECTION_ORDER as readonly string[]).indexOf(section) <= DISPLAY_SECTION_ORDER.indexOf('hero')"
            class="mb-6 flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-6 py-4"
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-lock"
                class="size-4 text-[color:var(--color-text-muted)]"
              />
              <h2 class="text-base font-semibold text-[color:var(--color-text-primary)]">
                {{ sectionLabel(section) }}
              </h2>
            </div>
            <span class="text-xs text-[color:var(--color-text-muted)]">
              Toujours visible
            </span>
          </div>
        </template>

        <!-- ═══════ 3. SECTION EDITORS — ordre aligné sur la page publique ═══════ -->
        <template
          v-for="section in orderedEditableSections"
          :key="section"
        >
          <!-- External sections (only `pricing` after story 0-26) -->
          <div
            v-if="externalSection(section)"
            class="mb-10 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
          >
            <div
              class="flex items-center justify-between px-6 py-4"
              :class="isSectionOn(section) ? 'border-b border-[color:var(--color-border-subtle)]' : ''"
            >
              <div>
                <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                  {{ sectionLabel(section) }}
                </h2>
                <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                  {{ externalSection(section)?.label }}
                </p>
              </div>
              <label class="flex items-center gap-3">
                <span class="text-sm text-[color:var(--color-brand-secondary)]">Visible sur ma page</span>
                <USwitch
                  :model-value="isSectionOn(section)"
                  :aria-label="`${sectionLabel(section)} — visible sur ma page`"
                  @update:model-value="(v: boolean) => onToggleSection(section, v)"
                />
              </label>
            </div>
            <div
              v-if="isSectionOn(section)"
              class="flex justify-end px-6 py-4"
            >
              <UButton
                :to="externalSection(section)?.to"
                color="neutral"
                variant="outline"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              >
                Modifier
              </UButton>
            </div>
          </div>

          <section
            v-if="hasEditor(section)"
            :id="section === 'pillars' ? 'section-pillars' : `section-${section}`"
            class="mb-10 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
          >
            <!-- ── HEADER (titre + switch labelisé) — commun à tous les éditeurs ──
            border-b uniquement quand le contenu est visible (sinon trait orphelin sous une carte collapsée). -->
            <div
              class="flex items-center justify-between px-6 py-4"
              :class="isSectionOn(section) ? 'border-b border-[color:var(--color-border-subtle)]' : ''"
            >
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                {{ sectionLabel(section) }}
              </h2>
              <label class="flex items-center gap-3">
                <span class="text-sm text-[color:var(--color-brand-secondary)]">Visible sur ma page</span>
                <USwitch
                  :model-value="isSectionOn(section)"
                  :aria-label="`${sectionLabel(section)} — visible sur ma page`"
                  @update:model-value="(v: boolean) => onToggleSection(section, v)"
                />
              </label>
            </div>

            <!-- ── CONTENU (collapsed si off) + FOOTER (bouton Enregistrer) ── -->
            <template v-if="isSectionOn(section)">
              <!-- ── BIO (Qui suis-je) — inline editor (Story 0-26 AC-4) ── -->
              <template v-if="section === 'bio'">
                <div class="space-y-4 px-6 py-5">
                  <!-- Photo secondaire — rapatriée depuis Mon compte (round terrain 2026-05-01).
                  Photo affichée à côté du texte dans la section "Qui suis-je" de la page publique. -->
                  <div>
                    <p class="mb-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                      Photo (affichée dans la section "Qui suis-je" de votre page publique)
                    </p>
                    <p class="mb-3 text-xs text-[color:var(--color-brand-secondary)]">
                      JPEG, PNG ou WebP, max 2 Mo.
                    </p>
                    <div class="flex items-center gap-6">
                      <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
                        <img
                          v-if="secondaryPhotoPreview"
                          :src="secondaryPhotoPreview"
                          alt="Photo Qui suis-je"
                          class="h-full w-full object-cover"
                        >
                        <UIcon
                          v-else
                          name="i-lucide-image"
                          class="h-10 w-10 text-[color:var(--color-brand-muted)]"
                        />
                      </div>
                      <div class="flex flex-col items-start gap-2">
                        <UButton
                          variant="outline"
                          icon="i-lucide-upload"
                          label="Modifier la photo"
                          size="sm"
                          type="button"
                          @click="triggerSecondaryFileInput"
                        />
                        <UButton
                          v-if="secondaryPhotoFile"
                          :loading="secondaryPhotoUploading"
                          :disabled="secondaryPhotoUploading"
                          label="Enregistrer la photo"
                          size="sm"
                          @click="handleSecondaryPhotoUpload"
                        />
                        <p
                          v-if="secondaryPhotoError"
                          class="text-sm text-[color:var(--color-error)]"
                        >
                          {{ secondaryPhotoError }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormControl
                    id="longBio"
                    label="Bio détaillée"
                    hint="Présentez-vous en détail à vos clientes. Plusieurs paragraphes acceptés."
                  >
                    <template #default="{ inputAttrs }">
                      <UTextarea
                        v-model="bioForm.longBio"
                        v-bind="inputAttrs"
                        class="w-full"
                        placeholder="Mon parcours, mes méthodes, ma philosophie..."
                        :maxlength="LONG_BIO_MAX_LENGTH"
                        :rows="8"
                        size="sm"
                      />
                    </template>
                    <template #label-aside>
                      <span
                        class="text-xs"
                        :class="bioCharCount > LONG_BIO_MAX_LENGTH - 200 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
                      >
                        {{ bioCharCount }}/{{ LONG_BIO_MAX_LENGTH }}
                      </span>
                    </template>
                  </FormControl>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <FormControl
                      id="city"
                      label="Ville"
                    >
                      <template #default="{ inputAttrs }">
                        <UInput
                          v-model="bioForm.city"
                          v-bind="inputAttrs"
                          class="w-full"
                          placeholder="Paris"
                          :maxlength="100"
                        />
                      </template>
                    </FormControl>

                    <FormControl
                      id="region"
                      label="Région"
                    >
                      <template #default="{ inputAttrs }">
                        <UInput
                          v-model="bioForm.region"
                          v-bind="inputAttrs"
                          class="w-full"
                          placeholder="Île-de-France"
                          :maxlength="100"
                        />
                      </template>
                    </FormControl>
                  </div>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveBio"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── PROBLEM STATEMENT ── -->
              <template v-if="section === 'problemStatement'">
                <div class="px-6 py-5">
                  <div class="space-y-3">
                    <UTextarea
                      :model-value="problemStatementForm?.blockquote ?? ''"
                      class="w-full"
                      placeholder="Citation principale (max 2000 caractères)"
                      :maxlength="2000"
                      :rows="4"
                      size="sm"
                      @update:model-value="setProblemStatementBlockquote"
                    />
                  </div>

                  <h3 class="mb-3 mt-6 text-sm font-semibold text-[color:var(--color-text-primary)]">
                    Paragraphes explicatifs (optionnel)
                  </h3>
                  <div class="space-y-4">
                    <div
                      v-for="(_, idx) in (problemStatementForm?.paragraphs ?? [])"
                      :key="idx"
                      class="relative"
                    >
                      <button
                        type="button"
                        class="absolute -right-1 -top-1 z-10 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                        @click="removeProblemParagraph(idx)"
                      >
                        <UIcon
                          name="i-lucide-x"
                          class="size-4"
                        />
                      </button>
                      <UTextarea
                        v-model="problemStatementForm!.paragraphs[idx]"
                        class="w-full"
                        :placeholder="`Paragraphe ${idx + 1} (max ${PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH} caractères)`"
                        :maxlength="PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH"
                        :rows="4"
                        size="sm"
                      />
                    </div>
                  </div>
                  <UButton
                    class="mt-4"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="(problemStatementForm?.paragraphs?.length ?? 0) >= 10"
                    @click="addProblemParagraph"
                  >
                    Ajouter un paragraphe
                  </UButton>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveProblemStatement"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── BENEFITS ── -->
              <template v-if="section === 'benefits'">
                <div class="px-6 py-5">
                  <div class="mb-4 space-y-3">
                    <UInput
                      :model-value="benefitsForm?.visionIntro ?? ''"
                      placeholder="Introduction vision (optionnel)"
                      size="sm"
                      @update:model-value="setBenefitsVisionIntro"
                    />
                    <UTextarea
                      :model-value="benefitsForm?.visionText ?? ''"
                      class="w-full"
                      placeholder="Texte vision (optionnel)"
                      :rows="3"
                      size="sm"
                      @update:model-value="setBenefitsVisionText"
                    />
                  </div>
                  <div class="space-y-4">
                    <div
                      v-for="(item, idx) in (benefitsForm?.items ?? [])"
                      :key="idx"
                      class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                    >
                      <button
                        type="button"
                        class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                        @click="removeBenefit(idx)"
                      >
                        <UIcon
                          name="i-lucide-x"
                          class="size-4"
                        />
                      </button>
                      <div class="space-y-3">
                        <UInput
                          v-model="item.title"
                          placeholder="Titre du bénéfice"
                          size="sm"
                        />
                        <UTextarea
                          v-model="item.description"
                          class="w-full"
                          placeholder="Description (max 300 caractères)"
                          :maxlength="300"
                          :rows="3"
                          size="sm"
                        />
                        <UInput
                          :model-value="item.icon ?? ''"
                          placeholder="Icône (ex: i-lucide-heart) — par défaut : sparkles"
                          size="sm"
                          @update:model-value="(v: string) => { item.icon = v || undefined }"
                        />
                      </div>
                    </div>
                  </div>
                  <UButton
                    class="mt-4"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="(benefitsForm?.items?.length ?? 0) >= 10"
                    @click="addBenefit"
                  >
                    Ajouter un bénéfice
                  </UButton>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveBenefits"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── PILLARS ── -->
              <template v-if="section === 'pillars'">
                <div class="px-6 py-5">
                  <div class="space-y-4">
                    <div
                      v-for="(pillar, idx) in (pillarsForm?.items ?? [])"
                      :key="idx"
                      class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                    >
                      <button
                        type="button"
                        class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                        @click="removePillar(idx)"
                      >
                        <UIcon
                          name="i-lucide-x"
                          class="size-4"
                        />
                      </button>
                      <div class="space-y-3">
                        <UInput
                          v-model="pillar.title"
                          placeholder="Titre du pilier"
                          size="sm"
                        />
                        <UTextarea
                          v-model="pillar.description"
                          class="w-full"
                          placeholder="Description (max 500 caractères)"
                          :maxlength="500"
                          :rows="3"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  <UButton
                    class="mt-4"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="(pillarsForm?.items?.length ?? 0) >= 10"
                    @click="addPillar"
                  >
                    Ajouter un pilier
                  </UButton>

                  <!-- F1: Emotional Support sub-section (Signature template only) -->
                  <div
                    v-if="hasEmotionalSupportSection"
                    class="mt-6 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                  >
                    <h3 class="mb-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
                      Soutien émotionnel (optionnel)
                    </h3>
                    <div class="space-y-3">
                      <UInput
                        :model-value="pillarsForm?.emotionalSupport?.title ?? ''"
                        placeholder="Titre (ex: Un espace d'écoute bienveillant)"
                        size="sm"
                        @update:model-value="(v: string) => {
                          if (!pillarsForm) {
                            pillarsForm = { items: [] }
                          }
                          if (!pillarsForm.emotionalSupport) {
                            pillarsForm.emotionalSupport = { title: '', description: '' }
                          }
                          pillarsForm.emotionalSupport.title = v
                        }"
                      />
                      <UTextarea
                        :model-value="pillarsForm?.emotionalSupport?.description ?? ''"
                        class="w-full"
                        placeholder="Description (max 1000 caractères)"
                        :maxlength="1000"
                        :rows="3"
                        size="sm"
                        @update:model-value="(v: string) => {
                          if (!pillarsForm) {
                            pillarsForm = { items: [] }
                          }
                          if (!pillarsForm.emotionalSupport) {
                            pillarsForm.emotionalSupport = { title: '', description: '' }
                          }
                          pillarsForm.emotionalSupport.description = v
                        }"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSavePillars"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── HOW IT WORKS ── -->
              <template v-if="section === 'howItWorks'">
                <div class="px-6 py-5">
                  <div class="space-y-4">
                    <div
                      v-for="(step, idx) in howItWorksForm"
                      :key="idx"
                      class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                    >
                      <button
                        type="button"
                        class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                        @click="removeStep(idx)"
                      >
                        <UIcon
                          name="i-lucide-x"
                          class="size-4"
                        />
                      </button>
                      <div class="mb-2 text-xs font-bold text-[color:var(--color-brand-primary)]">
                        Étape {{ step.number }}
                      </div>
                      <div class="space-y-3">
                        <UInput
                          v-model="step.title"
                          placeholder="Titre de l'étape"
                          size="sm"
                        />
                        <UTextarea
                          v-model="step.description"
                          class="w-full"
                          placeholder="Description (max 500 caractères)"
                          :maxlength="500"
                          :rows="3"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  <UButton
                    class="mt-4"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="howItWorksForm.length >= 6"
                    @click="addStep"
                  >
                    Ajouter une étape
                  </UButton>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveHowItWorks"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── EDUCATIONAL CONTENT ── -->
              <template v-if="section === 'educationalContent'">
                <div class="px-6 py-5">
                  <div class="space-y-4">
                    <div
                      v-for="(_, idx) in (educationalContentForm?.paragraphs ?? [])"
                      :key="idx"
                      class="relative"
                    >
                      <button
                        type="button"
                        class="absolute -right-1 -top-1 z-10 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                        @click="removeEducationalParagraph(idx)"
                      >
                        <UIcon
                          name="i-lucide-x"
                          class="size-4"
                        />
                      </button>
                      <UTextarea
                        v-model="educationalContentForm!.paragraphs[idx]"
                        class="w-full"
                        :placeholder="`Paragraphe ${idx + 1} (max 2000 caractères)`"
                        :maxlength="2000"
                        :rows="4"
                        size="sm"
                      />
                    </div>
                  </div>
                  <UButton
                    class="mt-4"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="(educationalContentForm?.paragraphs?.length ?? 0) >= 10"
                    @click="addEducationalParagraph"
                  >
                    Ajouter un paragraphe
                  </UButton>

                  <!-- Insight box -->
                  <div class="mt-6 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4">
                    <h3 class="mb-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
                      Encadré insight (optionnel)
                    </h3>
                    <div class="space-y-3">
                      <UInput
                        :model-value="educationalContentForm?.insightBox?.title ?? ''"
                        placeholder="Titre de l'encadré"
                        size="sm"
                        @update:model-value="setEducationalInsightTitle"
                      />
                      <UTextarea
                        :model-value="educationalContentForm?.insightBox?.content ?? ''"
                        class="w-full"
                        placeholder="Contenu de l'encadré"
                        :rows="3"
                        size="sm"
                        @update:model-value="setEducationalInsightContent"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveEducationalContent"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── TESTIMONIALS — inline editor (Story 0-26 AC-5) ── -->
              <template v-if="section === 'testimonials'">
                <div class="px-6 py-5 space-y-4">
                  <p class="text-sm text-[color:var(--color-brand-secondary)]">
                    Les retours de vos clientes (max {{ TESTIMONIALS_MAX }}).
                  </p>
                  <div
                    v-for="(t, idx) in testimonialsForm"
                    :key="idx"
                    class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                  >
                    <button
                      type="button"
                      class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                      aria-label="Supprimer ce témoignage"
                      @click="removeTestimonial(idx)"
                    >
                      <UIcon
                        name="i-lucide-x"
                        class="size-4"
                      />
                    </button>
                    <div class="mb-2 text-xs font-bold text-[color:var(--color-brand-primary)]">
                      Témoignage {{ idx + 1 }}
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <div class="sm:col-span-2">
                        <UTextarea
                          v-model="t.quote"
                          class="w-full"
                          placeholder="Citation du témoignage *"
                          :minlength="10"
                          :maxlength="500"
                          :rows="3"
                          size="sm"
                        />
                      </div>
                      <UInput
                        v-model="t.firstName"
                        placeholder="Prénom *"
                        :minlength="2"
                        :maxlength="50"
                        size="sm"
                      />
                      <UInput
                        v-model.number="t.age"
                        type="number"
                        placeholder="Âge"
                        :min="18"
                        :max="120"
                        size="sm"
                      />
                      <UInput
                        v-model="t.location"
                        placeholder="Localisation"
                        :maxlength="100"
                        size="sm"
                      />
                      <USelectMenu
                        v-model="t.rating"
                        :items="[1, 2, 3, 4, 5]"
                        placeholder="Note (1-5)"
                        size="sm"
                      />
                      <UInput
                        v-model="t.result"
                        placeholder="Résultat après X mois..."
                        :maxlength="200"
                        size="sm"
                        class="sm:col-span-2"
                      />
                    </div>
                  </div>
                  <div
                    v-if="testimonialsForm.length === 0"
                    class="py-4 text-center text-sm text-[color:var(--color-brand-muted)]"
                  >
                    Aucun témoignage ajouté.
                  </div>
                  <UButton
                    v-if="testimonialsForm.length < TESTIMONIALS_MAX"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    @click="addTestimonial"
                  >
                    Ajouter un témoignage
                  </UButton>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveTestimonials"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>

              <!-- ── FAQ ── -->
              <template v-if="section === 'faq'">
                <div class="px-6 py-5 space-y-4">
                  <div
                    v-for="(item, idx) in faqForm"
                    :key="idx"
                    class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
                  >
                    <button
                      type="button"
                      class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-status-error)]"
                      @click="removeFaq(idx)"
                    >
                      <UIcon
                        name="i-lucide-x"
                        class="size-4"
                      />
                    </button>
                    <div class="space-y-3">
                      <UInput
                        v-model="item.label"
                        placeholder="Question"
                        size="sm"
                      />
                      <UTextarea
                        v-model="item.content"
                        class="w-full"
                        placeholder="Réponse (max 2000 caractères)"
                        :maxlength="2000"
                        :rows="4"
                        size="sm"
                      />
                    </div>
                  </div>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="faqForm.length >= 20"
                    @click="addFaq"
                  >
                    Ajouter une question
                  </UButton>
                </div>
                <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="saving"
                    @click="onSaveFaq"
                  >
                    Enregistrer
                  </UButton>
                </div>
              </template>
            </template>
          </section>
        </template>

        <!-- Always-on footer (disclaimer) — placé après tous les éditeurs (PO order) -->
        <template
          v-for="section in orderedAlwaysOnSections"
          :key="`always-on-bottom-${section}`"
        >
          <div
            v-if="(DISPLAY_SECTION_ORDER as readonly string[]).indexOf(section) >= DISPLAY_SECTION_ORDER.indexOf('disclaimer')"
            class="mb-6 flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-6 py-4"
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-lock"
                class="size-4 text-[color:var(--color-text-muted)]"
              />
              <h2 class="text-base font-semibold text-[color:var(--color-text-primary)]">
                {{ sectionLabel(section) }}
              </h2>
            </div>
            <span class="text-xs text-[color:var(--color-text-muted)]">
              Toujours visible
            </span>
          </div>
        </template>
      </div>

      <!-- Sticky aperçu desktop (≥ 1280px) — Story 0-28 -->
      <aside
        v-if="previewOpen"
        class="sticky top-0 hidden h-screen min-h-0 max-h-screen self-start overflow-hidden xl:flex xl:flex-col"
        data-testid="coach-page-preview-aside"
        aria-label="Aperçu en direct de la page publique"
      >
        <CoachPagePreviewPanel
          :coach-profile="draftCoachProfile"
          :tenant="draftTenant"
          :device="previewDevice"
          :show-close="true"
          @update:device="setPreviewDevice"
          @close="closeDesktopPreview"
        />
      </aside>
    </div>

    <!-- FAB rouvrir l'aperçu (desktop seulement quand fermé) -->
    <UButton
      v-if="!loading && !previewOpen"
      class="fixed bottom-6 right-6 z-40 hidden shadow-elevated xl:inline-flex"
      color="primary"
      size="lg"
      icon="i-lucide-eye"
      data-testid="coach-page-preview-reopen-desktop"
      @click="reopenDesktopPreview"
    >
      Aperçu
    </UButton>

    <!-- FAB ouverture aperçu (mobile / tablet — toujours visible sous xl) -->
    <UButton
      v-if="!loading"
      class="fixed bottom-6 right-6 z-40 shadow-elevated xl:hidden"
      color="primary"
      size="lg"
      icon="i-lucide-eye"
      data-testid="coach-page-preview-fab-mobile"
      aria-label="Ouvrir l'aperçu de la page publique"
      @click="openMobilePreview"
    >
      Aperçu
    </UButton>

    <!-- Slideover mobile / tablet (Story 0-28) — plein écran -->
    <USlideover
      v-model:open="previewMobileOpen"
      side="right"
      :ui="{ content: 'w-full sm:max-w-2xl' }"
    >
      <template #content>
        <CoachPagePreviewPanel
          :coach-profile="draftCoachProfile"
          :tenant="draftTenant"
          :device="previewDevice"
          :show-close="true"
          @update:device="setPreviewDevice"
          @close="closeMobilePreview"
        />
      </template>
    </USlideover>
  </div>
</template>
