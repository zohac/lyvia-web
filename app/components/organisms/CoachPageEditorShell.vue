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
 *   - LAB.4 — rapatriement de l'éditeur « Diplômes & certifications » dans
 *     cette page (section inline `certifications`, voir
 *     `components/organisms/ProviderCredentialsEditor.vue`)
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
  getCoachPageTemplateSaveErrorToast,
  isCoachPageInlineEditorSection,
  type COACH_PAGE_INLINE_EDITOR_SECTIONS
} from '~/features/coach/domain/coach-page-editor'
// CPD.3 — contrat partagé des trois éditeurs de listes (bénéfices, piliers,
// déroulé) : le `switch` exhaustif remplace trois `else if` qui avalaient une
// faute de frappe sur `field`.
import {
  applyListItemPatch,
  type ListItemPatch
} from '~/features/coach/domain/list-item-patch'
// CPD.4 — plafond des témoignages partagé avec la carte (une copie locale par
// côté faisait deux sources de vérité, la constante de la carte n'étant épinglée
// par aucun test ; revue CPD.4).
import { TESTIMONIALS_MAX } from '~/features/coach/domain/social-editor-limits'
import {
  applyFaqPatchAt,
  applyTestimonialPatchAt,
  type FaqPatch,
  type TestimonialPatch
} from '~/features/coach/domain/social-item-patch'
// TF.1 — table de libellés partagée avec `CoachPageExternalSectionCard.vue`
// (une copie locale en aurait fait deux sources de vérité ; revue TF.1). La
// justification LAB-R15 est documentée dans le module.
import { sectionLabel } from '~/features/coach/domain/coach-page-section-labels'
import { useCoachSections, DISPLAY_SECTION_ORDER } from '~/features/coach/useCoachSections'
// Hotfix 25 — l'aide du champ « Accroche » est dérivée du template, et son
// repli Signature vient de la valeur réellement rendue par le hero. CPD.7 — le
// calcul reste ici (la carte reçoit le texte, pas le code du template).
import { buildHeroHeadlineHint } from '~/features/coach/domain/hero-headline-hint'
import { useCoachPageEditor } from '~/features/coach/useCoachPageEditor'
import type { TestimonialItem, CredentialItem } from '~/features/account/api/provider-account.contract'
import { formatUploadError } from '~/features/assets/use-asset-upload'
import { useCoachPreview } from '~/features/coach/useCoachPreview'
import { useCoachPublish } from '~/features/coach/useCoachPublish'
import { listMyConsultationPricePlans } from '~/features/pricing/services/provider-consultation-pricing.service'
import { listMyPrograms } from '~/features/programs/services/provider-programs.service'

import CoachPagePreviewPanel from '~/components/organisms/CoachPagePreviewPanel.vue'
import CoachPageHeader from '~/components/organisms/CoachPageHeader.vue'
import CoachPageTemplateSelector from '~/components/organisms/CoachPageTemplateSelector.vue'
import CoachPublishChecklistModal from '~/components/molecules/CoachPublishChecklistModal.vue'
import ConfirmActionModal from '~/components/molecules/ConfirmActionModal.vue'
// LAB-R14 — import EXPLICITE : un `<CoachPageTemplateRequiredNotice>` non importé
// serait une balise inconnue, rendue à zéro, sans qu'aucun gate ne s'en aperçoive
// (AGENTS.md § 11.6, la classe de défaut de lab-3).
import CoachPageTemplateRequiredNotice from '~/components/molecules/CoachPageTemplateRequiredNotice.vue'
import CoachPageExternalSectionCard from '~/components/organisms/CoachPageExternalSectionCard.vue'
import CoachPageCertificationsCard from '~/components/organisms/CoachPageCertificationsCard.vue'
import CoachPageBioEditor from '~/components/organisms/CoachPageBioEditor.vue'
import CoachPageProblemStatementEditor from '~/components/organisms/CoachPageProblemStatementEditor.vue'
import CoachPageHeroEditor from '~/components/organisms/CoachPageHeroEditor.vue'
import CoachPageBenefitsEditor from '~/components/organisms/CoachPageBenefitsEditor.vue'
import CoachPagePillarsEditor from '~/components/organisms/CoachPagePillarsEditor.vue'
import CoachPageHowItWorksEditor from '~/components/organisms/CoachPageHowItWorksEditor.vue'
import CoachPageTestimonialsEditor from '~/components/organisms/CoachPageTestimonialsEditor.vue'
import CoachPageFaqEditor from '~/components/organisms/CoachPageFaqEditor.vue'
import CoachPageFitEditor from '~/components/organisms/CoachPageFitEditor.vue'
import CoachPageEducationalContentEditor from '~/components/organisms/CoachPageEducationalContentEditor.vue'
import CoachPageFreeTextEditor from '~/components/organisms/CoachPageFreeTextEditor.vue'
import CoachPageBrandingCard from '~/components/organisms/CoachPageBrandingCard.vue'
import CoachPagePaletteEditor from '~/components/organisms/CoachPagePaletteEditor.vue'
import CoachPageSectionCard from '~/components/organisms/CoachPageSectionCard.vue'

// Story 18.3b — imports EXPLICITES : `app/features/**` n'est pas auto-importé,
// et `FeatureGate` suit le pattern maison `FormControl`.
import FeatureGate from '~/components/molecules/FeatureGate.vue'
import { useFeatureGate } from '~/features/plans/useFeatureGate'
import { FEATURE_COACH_PAGE_PREMIUM_TEMPLATES } from '~/features/plans/domain/feature-codes'
import {
  isTemplateLocked,
  resolvePremiumTemplatesAccess
} from '~/features/plans/domain/template-lock'

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
  hasEmotionalSupportSection,
  sectionsConfig,
  pillarsForm,
  faqForm,
  benefitsForm,
  howItWorksForm,
  educationalContentForm,
  problemStatementForm,
  fitForm,
  freeTextForm,
  init,
  saveTemplate,
  setBenefitsVisionIntro,
  setBenefitsVisionText,
  addBenefit,
  removeBenefit,
  addEducationalParagraph,
  setEducationalParagraph,
  removeEducationalParagraph,
  setEducationalInsight,
  setProblemStatementBlockquote,
  addProblemParagraph,
  removeProblemParagraph,
  setFreeTextTitle,
  setFreeTextParagraph,
  addFreeTextParagraph,
  removeFreeTextParagraph,
  setFitField,
  addFitItem,
  removeFitItem,
  applyFitItem,
  saveFreeText
} = editor

// CPD.8 — état des sections (ordre, titres, prédicats, bascule optimiste
// debouncée) extrait dans un composable testable.
const sections = useCoachSections({ editor, toast })
const {
  orderedEditableSections,
  orderedAlwaysOnSections,
  sectionTitles: sectionTitlesForm,
  hasEditor,
  isSectionOn,
  isSectionLocked,
  sectionLockReason,
  isSectionBodyOpen,
  externalSection,
  externalSectionTo,
  onToggleSection,
  flushPendingToggle
} = sections

onMounted(() => init())

onBeforeUnmount(() => {
  flushPendingToggle()
})

// YB.1.1 — plafonds alignés sur `FreeTextJsonDto` côté API
// (10 paragraphes × 2 000 caractères, titre ≤ 200). Les constantes vivent
// désormais dans `CoachPageFreeTextEditor.vue` (extraction CPD.5).
// "Qui suis-je" édite `longBio` (5000 chars max — DTO `@MaxLength(5000)`),
// pas le champ `bio` (500 chars, tagline hero). Le rendu public CoachPageSignature
// / CoachPageEssentiel priorise `longBio` pour cette section.
// Story 0-27 — `logoUrl` n'est plus saisi en URL libre, il est uploadé via le widget
// (POST /provider/assets/upload type=brand_logo). La constante d'URL est supprimée.
// CPD.8 — la bascule debouncée (constante 500 ms, snapshot, toasts) vit dans
// `useCoachSections` : rien de tout cela ne reste dans cette page.

// ── Section labels ──
// TF.1 — la table a été déplacée dans `features/coach/domain` (import ci-dessus) :
// la carte externe extraite et cette page doivent afficher le MÊME libellé.

// DISPLAY_SECTION_ORDER / sortByDisplayOrder / ordered* vivent désormais dans
// useCoachSections (CPD.8). L'alias local reste disponible pour le template
// (v-if sur `disclaimer`).

// ── "Qui suis-je" form state (rapatrié depuis /provider/account) ──
// Édite `provider_profiles.long_bio` (= 5000 chars), pas le `bio` court (500 chars).
// + city + region rapatriés depuis Mon compte (round terrain Sophie 2026-05-01) :
// la section "Qui suis-je" expose désormais l'identité géographique de la coach.
const bioForm = reactive({
  longBio: '',
  city: '',
  region: ''
})

// ── Photo secondaire (round terrain 2026-05-01) ──
// Photo affichée dans la section "Qui suis-je" de la page publique coach.
// CPD.2 — l'upload et l'aperçu local vivent dans `CoachPageBioEditor` ; cette
// ref ne sert plus qu'au panneau d'aperçu live, alimentée par `photo-selected`
// (sélection) et `photo-uploaded` (URL définitive).
const secondaryPhotoPreview = ref<string | null>(null)

// ── Testimonials form state (rapatrié, AC-5) ──
const testimonialsForm = ref<TestimonialItem[]>([])

// ── Credentials form state (LAB.4 — rapatrié depuis /provider/account) ──
// Édite `provider_profiles.credentials` via le même store (updateAccount).
const credentialsForm = ref<CredentialItem[]>([])

// ── Hero section form state (Story 0-37 AC-1, AC-2, Story 0-38) ──
const heroForm = reactive({
  heroHeadline: '',
  heroDescription: '',
  urgencyText: ''
})

// ── Photo Hero / Fond (Story 0-38) ──
// CPD.7 — l'upload et l'aperçu local vivent dans `CoachPageHeroEditor` ; cette
// ref ne sert plus qu'au panneau d'aperçu live, alimentée par `photo-selected`
// (sélection), `photo-uploaded` (URL définitive) et `photo-cleared` (annulation).
const heroPhotoPreview = ref<string | null>(null)
const heroPhotoUploading = ref(false)
const heroPhotoError = ref<string | null>(null)

function onHeroPhotoSelected(previewUrl: string) {
  heroPhotoPreview.value = previewUrl
  heroPhotoError.value = null
}

function onHeroPhotoCleared() {
  heroPhotoPreview.value = null
  heroPhotoError.value = null
}

function onHeroPhotoError(message: string) {
  heroPhotoError.value = message
  toast.add({ title: 'Erreur', description: message, color: 'error' })
}

async function onHeroPhotoUploadedFromCard(url: string) {
  heroPhotoPreview.value = url
  heroPhotoError.value = null
  await fetchAccount()
  toast.add({ title: 'Photo d\'en-tête enregistrée', color: 'primary' })
}

async function handleHeroPhotoDisable() {
  heroPhotoUploading.value = true
  heroPhotoError.value = null

  try {
    const ok = await updateAccount({ heroImageUrl: null, heroImageDisabled: true })
    if (ok) {
      heroPhotoPreview.value = null
      await fetchAccount()
      toast.add({ title: 'Image d\'en-tête retirée', color: 'primary' })
    } else {
      toast.add({ title: 'Erreur lors du retrait de l\'image', color: 'error' })
    }
  } catch (e: unknown) {
    heroPhotoError.value = formatUploadError(e)
    toast.add({ title: 'Erreur', description: heroPhotoError.value, color: 'error' })
  } finally {
    heroPhotoUploading.value = false
  }
}

async function handleHeroPhotoEnableDefault() {
  heroPhotoUploading.value = true
  heroPhotoError.value = null

  try {
    const ok = await updateAccount({ heroImageUrl: null, heroImageDisabled: false })
    if (ok) {
      heroPhotoPreview.value = null
      await fetchAccount()
      toast.add({ title: 'Image par défaut rétablie', color: 'primary' })
    } else {
      toast.add({ title: 'Erreur lors du rétablissement de l\'image', color: 'error' })
    }
  } catch (e: unknown) {
    heroPhotoError.value = formatUploadError(e)
    toast.add({ title: 'Erreur', description: heroPhotoError.value, color: 'error' })
  } finally {
    heroPhotoUploading.value = false
  }
}

// ── Photo d'arrière-plan Énoncé du problème ──
// CPD.2 — upload et suppression vivent dans `CoachPageProblemStatementEditor`.
// `photoBusy` / `photoError` sont passés à la carte ; `photoPreview` alimente le
// panneau d'aperçu live.
const problemStatementPhotoPreview = ref<string | null>(null)
const problemStatementPhotoUploading = ref(false)
const problemStatementPhotoError = ref<string | null>(null)

/**
 * CPD.2 — l'aperçu local n'est une URL durable que s'il vient du serveur
 * (`https:`). Un object URL `blob:` est révoqué au démontage de la carte : le
 * repasser à une carte remontée afficherait une image cassée. On ne transmet
 * donc que l'URL persistée, et la carte gère son propre aperçu de sélection.
 */
function persistedPhotoUrl(preview: string | null, serverUrl: string | null | undefined): string | null {
  return preview && !preview.startsWith('blob:') ? preview : serverUrl ?? null
}

const secondaryPhotoForEditor = computed(() =>
  persistedPhotoUrl(secondaryPhotoPreview.value, account.value?.secondaryPhotoUrl)
)
const problemStatementPhotoForEditor = computed(() =>
  persistedPhotoUrl(problemStatementPhotoPreview.value, account.value?.problemStatementPhotoUrl)
)

// ── Palette form state (Story 0-37 AC-5, AC-6) ──
const paletteForm = reactive({
  brandColor: '#5B4B6E',
  brandAccentColor: '#D4956A'
})

// sectionTitlesForm est désormais fourni par useCoachSections (CPD.8) sous le nom sectionTitles.

// ── Email branding form state (migré depuis 0-20c, refondu par 0-27) ──
// `brandName` reste un champ texte libre. `logoUrl` n'est plus saisi en URL —
// il est uploadé via le widget (POST /provider/assets/upload type=brand_logo)
// et persisté côté backend dans `provider_profiles.logo_url`.
const brandingForm = reactive({
  brandName: ''
})

const logoDeleting = ref(false)
const uploadedLogoUrl = ref<string | null>(null)

// Source serveur (URL CDN persistée). Source unique de vérité = `account.value.logoUrl`,
// avec priorité à l'URL renvoyée par l'upload tant que le rafraîchissement n'a pas abouti
// (sinon un échec réseau ferait disparaître un logo pourtant bien persisté).
const logoServerUrl = computed(() => uploadedLogoUrl.value ?? account.value?.logoUrl ?? null)
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
    heroForm.heroHeadline = acc.heroHeadline ?? ''
    heroForm.heroDescription = acc.heroDescription ?? ''
    heroForm.urgencyText = acc.urgencyText ?? ''
    paletteForm.brandColor = acc.brandColor ?? '#5B4B6E'
    paletteForm.brandAccentColor = acc.brandAccentColor ?? '#D4956A'
    if (acc.sectionTitlesJson) {
      Object.assign(sectionTitlesForm, acc.sectionTitlesJson)
    }
    testimonialsForm.value = acc.testimonialsJson?.length
      ? acc.testimonialsJson.map(t => ({ ...t }))
      : []
    credentialsForm.value = acc.credentials?.length
      ? acc.credentials.map(c => ({ ...c }))
      : []
    brandingForm.brandName = acc.brandName ?? ''
    // logoUrl n'est plus une form value : il est piloté par le widget upload
    // et lu directement depuis `account.value.logoUrl` via `logoServerUrl`.
  },
  { immediate: true, deep: false }
)

// ── Live preview (Story 0-28, extrait CPD.9) ──
// `previewTemplateCode` et `isHeroBackgroundTemplate` sont dérivés par le
// composable depuis `templates` + `selectedTemplateId` : la page les
// DESTRUCTURE (revue CPD.9 — deux dérivations de la même règle Alba/visuel,
// dont une seule exercée, laissaient une divergence silencieuse possible).
const preview = useCoachPreview({
  account: account as unknown as import('vue').Ref<
    import('~/features/account/api/provider-account.contract').ProviderAccountResponse | null
  >,
  bioForm,
  heroForm,
  paletteForm,
  sectionTitlesForm,
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
  fitForm: fitForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').FitJson | null
  >,
  freeTextForm: freeTextForm as unknown as import('vue').Ref<
    import('~/features/seo/api/public-provider-profile.contract').FreeTextJson | null
  >,
  secondaryPhotoPreview,
  heroPhotoPreview,
  problemStatementPhotoPreview,
  templates: templates as unknown as import('vue').Ref<{ id: string, code?: string | null }[]>,
  selectedTemplateId,
  loadConsultationPlans: async () => {
    const r = await listMyConsultationPricePlans()
    return r.plans
  },
  loadPrograms: async () => {
    const r = await listMyPrograms()
    return r.programs
  }
})
const {
  device: previewDevice,
  mobileOpen: previewMobileOpen,
  openMobile: openMobilePreview,
  closeMobile: closeMobilePreview,
  reopenDesktop: reopenDesktopPreview,
  closeDesktop: closeDesktopPreview,
  setDevice: setPreviewDevice,
  publicLink: publicCoachPageLink,
  previewLink: previewCoachPageLink,
  draftProfile: draftCoachProfile,
  draftTenant: draftTenant,
  consultationPlans: previewConsultationPlans,
  publicPrograms: previewPublicPrograms,
  previewTemplateCode,
  isHeroBackgroundTemplate,
  previewOpen: previewOpenState
} = preview
const previewOpen = previewOpenState

// heroHeadlineHint reste calculé ici (CPD.7).
const heroHeadlineHint = computed<string>(() =>
  buildHeroHeadlineHint(previewTemplateCode.value)
)

// ── Publication (CPD.9) ──
const publish = useCoachPublish({
  account: account as unknown as import('vue').Ref<
    import('~/features/account/api/provider-account.contract').ProviderAccountResponse | null
  >,
  editor,
  toast: toast as unknown as { add: (options: unknown) => void },
  navigateTo
})
const {
  checklistModalOpen,
  confirmUnpublishModalOpen,
  publishing,
  publishError,
  openPublish: handleOpenPublish,
  executePublish,
  unpublish: handleUnpublish,
  navigateTo: handleNavigateToSection
} = publish

// ── Feature gating (Story 18.3b) ──
// `useFeatureGate` porte son PROPRE `GET /provider/account`, session-cached et
// dédupliqué : c'est le seul fetch supplémentaire autorisé sur cette page. Le
// store éditeur (`useCoachPageEditor`, story 0-26) est un singleton distinct
// qu'on ne double surtout pas.
//
// L'amorçage explicite ici sert le sélecteur de template (qui n'est PAS
// enveloppé dans un `<FeatureGate>`) ; le `<FeatureGate>` de la section
// branding déclenche de son côté le même chargement, et la déduplication 18.2
// garantit une seule requête.
const gate = useFeatureGate()
void gate.ensureLoaded()

/**
 * Accès aux templates premium.
 *
 * Pendant `status === 'unknown'`, présumé ouvert : aucune carte ne clignote en
 * verrouillé pendant la résolution du plan (AC #2). Politique et justification
 * dans `resolvePremiumTemplatesAccess`.
 */
const hasPremiumTemplates = computed(() =>
  resolvePremiumTemplatesAccess(
    gate.status.value,
    gate.hasFeature(FEATURE_COACH_PAGE_PREMIUM_TEMPLATES)
  )
)

/**
 * Cartes du sélecteur, décorées de leur état de verrouillage.
 *
 * Checklist DRY intra-story : le booléen est calculé UNE seule fois par carte
 * puis consommé par `:disabled`, la pastille et les classes — jamais recalculé
 * dans le template.
 */
const templateCards = computed(() =>
  templates.value.map(tmpl => ({
    ...tmpl,
    locked: isTemplateLocked(tmpl, hasPremiumTemplates.value)
  }))
)

// ── Template selection (F4: explicit TEMPLATE_NOT_AVAILABLE handling) ──
async function onSelectTemplate(templateId: string) {
  if (saving.value || templateId === selectedTemplateId.value) return
  // Story 18.3b — garde de défense : la carte est déjà `disabled`, mais un clic
  // ne doit JAMAIS partir en API pour un template verrouillé (clavier, DevTools,
  // course avec la résolution du plan).
  //
  // 🚨 CR 18.3b — la garde lit `templateCards` (verrou DÉJÀ calculé) et non
  // `templates` + un second `isTemplateLocked` : une seule source de vérité pour
  // le verrou, et surtout un échec FERMÉ. La version précédente s'écrivait
  // `if (target && isTemplateLocked(...)) return` : un id absent de la liste
  // (appel programmatique, liste rafraîchie entre le rendu et le clic) donnait
  // `target === undefined`, sautait la garde et partait en API — exactement le
  // chemin DevTools que ce commentaire prétend couvrir.
  const card = templateCards.value.find(c => c.id === templateId)
  if (!card || card.locked) return
  const result = await saveTemplate(templateId)
  if (result.ok) {
    toast.add({ title: 'Template mis à jour', color: 'primary' })
  } else {
    const message = getCoachPageTemplateSaveErrorToast(result.errorCode)
    // `null` → le toast global 18.2 a déjà parlé (403 FEATURE_NOT_AVAILABLE) :
    // en ajouter un second, générique, brouillerait le message.
    if (message) {
      toast.add({ title: message.title, description: message.description, color: 'error' })
    }
  }
}

// Auto-save toggle (AC-2) vit désormais dans useCoachSections (CPD.8).

// ── Hero inline editor (Story 0-37 AC-1, AC-2) ──
async function onSaveHero() {
  const ok = await updateAccount({
    heroHeadline: heroForm.heroHeadline.trim() || null,
    heroDescription: heroForm.heroDescription.trim() || null,
    urgencyText: heroForm.urgencyText.trim() || null
  })
  toast.add({
    title: ok ? 'Hero enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── Palette inline editor (Story 0-37 AC-5, AC-6) ──
async function onSavePalette() {
  const ok = await updateAccount({
    brandColor: paletteForm.brandColor.trim() || null,
    brandAccentColor: paletteForm.brandAccentColor.trim() || null
  })
  toast.add({
    title: ok ? 'Palette enregistrée' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── "Qui suis-je" inline editor (AC-4) — longBio + city + region + titles ──
async function onSaveBio() {
  const ok = await updateAccount({
    longBio: bioForm.longBio.trim() || null,
    city: bioForm.city.trim() || null,
    region: bioForm.region.trim() || null,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Qui suis-je enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// CPD.2 — la carte porte l'upload ; l'URL est persistée côté serveur par
// `uploadAsset`. La page ne relaie que l'aperçu et le toast, et surtout elle ne
// rappelle PAS `fetchAccount()` : le `watch` sur `account.value` réinitialise
// `bioForm` / `sectionTitlesForm` et effacerait une saisie non enregistrée.
async function onSecondaryPhotoUploaded(url: string) {
  secondaryPhotoPreview.value = url
  toast.add({ title: 'Photo secondaire enregistrée', color: 'primary' })
}

function onSecondaryPhotoSelected(previewUrl: string) {
  secondaryPhotoPreview.value = previewUrl
}

function onSecondaryPhotoError(message: string) {
  toast.add({ title: 'Erreur', description: message, color: 'error' })
}

function onProblemParagraphUpdate(payload: { index: number, value: string }) {
  if (problemStatementForm.value?.paragraphs) {
    problemStatementForm.value.paragraphs[payload.index] = payload.value
  }
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
  const ok = await updateAccount({
    testimonialsJson: filtered,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Témoignages enregistrés' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── Credentials inline editor (LAB.4) ──
/**
 * Le formulaire d'origine (`/provider/account`) était un `<form @submit.prevent>`
 * avec `required` sur le titre : le navigateur bloquait la soumission. Le bouton
 * d'enregistrement vit désormais dans la carte de `coach-page`, donc hors de tout
 * formulaire — `required` ne bloque plus rien. On rétablit la garantie ici, et on
 * remonte enfin le motif d'échec du store (un 422 sur l'année, par exemple, ne
 * doit pas se réduire à « Erreur d'enregistrement »).
 */
async function onSaveCredentials() {
  if (credentialsForm.value.some(c => !c.title?.trim())) {
    toast.add({ title: 'Le titre du diplôme est requis', color: 'error' })
    return
  }
  const filtered = credentialsForm.value.filter(c => c.title.trim())
  const ok = await updateAccount({ credentials: filtered })
  toast.add({
    title: ok ? 'Diplômes & certifications enregistrés' : 'Erreur d\'enregistrement',
    ...(ok ? {} : { description: accountError.value ?? 'Une erreur est survenue' }),
    color: ok ? 'primary' : 'error'
  })
}

async function onSaveProblemStatementSection() {
  const ok = await updateAccount({
    problemStatementJson: problemStatementForm.value,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Énoncé du problème enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// CPD.2 — la carte porte l'upload/suppression ; l'URL est persistée par
// `uploadAsset` et la suppression par le PATCH `problemStatementPhotoUrl: null`.
async function onProblemStatementPhotoUploaded(url: string) {
  // Pas de `fetchAccount()` : le `watch` sur `account.value` réinitialise les
  // formulaires et effacerait une saisie non enregistrée. La carte reçoit
  // `problemStatementPhotoPreview`, qui survit au repli de la section.
  problemStatementPhotoPreview.value = url
  toast.add({ title: 'Photo d\'arrière-plan enregistrée', color: 'primary' })
}

function onProblemStatementPhotoSelected(previewUrl: string) {
  problemStatementPhotoPreview.value = previewUrl
}

async function onProblemStatementPhotoRemoved() {
  problemStatementPhotoUploading.value = true
  problemStatementPhotoError.value = null
  const ok = await updateAccount({ problemStatementPhotoUrl: null })
  if (ok) {
    problemStatementPhotoPreview.value = null
    toast.add({ title: 'Photo d\'arrière-plan supprimée', color: 'primary' })
  } else {
    // `updateAccount` ne lève pas : le motif est dans `accountError`.
    problemStatementPhotoError.value = accountError.value ?? 'Erreur lors de la suppression de la photo'
    toast.add({ title: 'Erreur lors de la suppression de la photo', color: 'error' })
  }
  problemStatementPhotoUploading.value = false
}

function onProblemStatementPhotoError(message: string) {
  problemStatementPhotoError.value = message
  toast.add({ title: 'Erreur', description: message, color: 'error' })
}

async function onSaveBenefitsSection() {
  const ok = await updateAccount({
    benefitsJson: benefitsForm.value,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Bénéfices enregistrés' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

async function onSavePillarsSection() {
  const ok = await updateAccount({
    pillarsJson: pillarsForm.value,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Piliers enregistrés' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

async function onSaveHowItWorksSection() {
  const ok = await updateAccount({
    howItWorksJson: howItWorksForm.value.length > 0 ? howItWorksForm.value : null,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Comment ça marche enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

async function onSaveFitSection() {
  const ok = await updateAccount({
    fitJson: fitForm.value,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Section Pour qui enregistrée' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// YB.1.1 — `saveFreeText` enregistre `null` quand titre et paragraphes sont
// tous deux vides : c'est ce que la page publique attend pour disparaître.
async function onSaveFreeTextSection() {
  const ok = await saveFreeText()
  toast.add({
    title: ok ? 'Bloc de texte libre enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

async function onSaveEducationalContentSection() {
  const ok = await updateAccount({
    educationalContentJson: educationalContentForm.value,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Contenu éducatif enregistré' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

async function onSaveFaqSection() {
  const ok = await updateAccount({
    faqJson: faqForm.value.length > 0 ? faqForm.value : null,
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Questions fréquentes enregistrées' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// CPD.1 — dispatcheur nommé : associe chaque section éditable à son handler
// existant, sans en changer un seul (garde de câblage).
//
// `certifications` est exclue : elle porte son propre pied
// (`CoachPageCertificationsCard`), donc la carte est montée avec
// `show-footer="false"` et n'émet jamais `save`.
type SavableInlineSection = Exclude<
  (typeof COACH_PAGE_INLINE_EDITOR_SECTIONS)[number],
  'certifications'
>

// Le `Record` est typé par l'union des sections éditables, pas par `string` :
// une section ajoutée au registre sans entrée ici ne compile plus, au lieu de
// rendre un bouton « Enregistrer » qui n'enregistre rien en silence (revue
// cpd-1 : renommer une clé laissait 59/59 tests verts).
const SECTION_SAVE_HANDLERS: Record<SavableInlineSection, () => void | Promise<void>> = {
  bio: onSaveBio,
  problemStatement: onSaveProblemStatementSection,
  benefits: onSaveBenefitsSection,
  freeText: onSaveFreeTextSection,
  pillars: onSavePillarsSection,
  howItWorks: onSaveHowItWorksSection,
  fit: onSaveFitSection,
  educationalContent: onSaveEducationalContentSection,
  testimonials: onSaveTestimonials,
  faq: onSaveFaqSection
}

function isSavableInlineSection(section: string): section is SavableInlineSection {
  return section !== 'certifications' && isCoachPageInlineEditorSection(section)
}

function onSaveSection(section: string): void {
  if (!isSavableInlineSection(section)) return
  void SECTION_SAVE_HANDLERS[section]()
}

async function onSavePricingSectionTitles() {
  const ok = await updateAccount({
    sectionTitlesJson: { ...sectionTitlesForm }
  })
  toast.add({
    title: ok ? 'Titres de la section tarifs enregistrés' : 'Erreur d\'enregistrement',
    color: ok ? 'primary' : 'error'
  })
}

// ── Branding inline editor — migré depuis /provider/account, refondu par Story 0-27 ──
// Le formulaire ne sauvegarde plus que `brandName` (le `logoUrl` est upload-driven).
async function handleBrandingSubmit() {
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

// CPD.6 — relais des émissions de la carte d'identité de marque. La mécanique
// d'upload vit dans la carte ; la page ne fait que rafraîchir le store et
// persister la suppression. L'URL émise prend la main immédiatement : sans elle,
// le widget retomberait sur l'état vide pendant l'aller-retour réseau, et un
// échec de `fetchAccount` (qui avale son erreur) laisserait un logo persisté
// invisible.
async function onLogoUploaded(payload: { url: string, assetId: string }) {
  uploadedLogoUrl.value = payload.url
  await fetchAccount()
  if (!accountError.value) uploadedLogoUrl.value = null
  toast.add({ title: 'Logo téléversé', color: 'primary' })
}

async function onLogoRemoved() {
  uploadedLogoUrl.value = null
  logoDeleting.value = true
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

// ── CPD.3 — relais des émissions des éditeurs de listes ──
// Les trois cartes émettent le même contrat (`ListItemPatch`) et la même règle
// l'applique : le `switch` exhaustif de `applyListItemPatch` rend une faute de
// frappe sur `field` impossible à compiler (elle était silencieuse avant).
function onBenefitItemUpdate(patch: ListItemPatch) {
  if (!benefitsForm.value) benefitsForm.value = { items: [] }
  const items = benefitsForm.value.items ?? (benefitsForm.value.items = [])
  const item = items[patch.index]
  if (!item) return
  applyListItemPatch(item, patch)
}

function onPillarItemUpdate(patch: ListItemPatch) {
  if (!pillarsForm.value) pillarsForm.value = { items: [] }
  const items = pillarsForm.value.items ?? (pillarsForm.value.items = [])
  const item = items[patch.index]
  if (!item) return
  applyListItemPatch(item, patch)
}

function onHowItWorksItemUpdate(patch: ListItemPatch) {
  const item = howItWorksForm.value[patch.index]
  if (!item) return
  applyListItemPatch(item, patch)
}

function setPillarsEmotionalSupportTitle(value: string) {
  if (!pillarsForm.value) pillarsForm.value = { items: [] }
  if (!pillarsForm.value.emotionalSupport) pillarsForm.value.emotionalSupport = { title: '', description: '' }
  pillarsForm.value.emotionalSupport.title = value
}

function setPillarsEmotionalSupportDescription(value: string) {
  if (!pillarsForm.value) pillarsForm.value = { items: [] }
  if (!pillarsForm.value.emotionalSupport) pillarsForm.value.emotionalSupport = { title: '', description: '' }
  pillarsForm.value.emotionalSupport.description = value
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

// ── FAQ ──
function addFaq() {
  faqForm.value.push({ label: '', content: '' })
}

function removeFaq(index: number) {
  faqForm.value.splice(index, 1)
}

// ── CPD.4 — relais des émissions des éditeurs sociaux ──
// Le contrat typé (`TestimonialPatch` / `FaqPatch`) et l'application du patch
// vivent dans `social-item-patch.ts` : le cast `Record<string, unknown>` de la
// première version laissait une faute de frappe sur `field` compiler et
// disparaître en silence (revue CPD.4).
function onTestimonialItemUpdate(patch: TestimonialPatch) {
  applyTestimonialPatchAt(testimonialsForm.value, patch)
}

function onFaqItemUpdate(patch: FaqPatch) {
  applyFaqPatchAt(faqForm.value, patch)
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

// hasEditor / isSectionLocked / ... vivent désormais dans useCoachSections (CPD.8).
</script>

<template>
  <div>
    <CoachPageHeader
      :account="account"
      :publishing="publishing"
      :preview-link="previewCoachPageLink"
      :public-link="publicCoachPageLink"
      @preview="() => {}"
      @publish="handleOpenPublish"
      @unpublish="confirmUnpublishModalOpen = true"
    />

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
        <CoachPageTemplateSelector
          :templates="templateCards"
          :selected-template-id="selectedTemplateId"
          :saving="saving"
          :has-premium-templates="hasPremiumTemplates"
          @select="onSelectTemplate"
        />

        <!-- ═══════ 2. IDENTITÉ DE MARQUE — Config globale (header public + emails) ═══════
        Story 0-26 round terrain 2026-05-01 — Pilote `brandName` + `logoUrl` utilisés
        dans le header de la page publique coach ET dans le subject/header/footer de
        tous les emails. Pas de switch (toujours active, fallback Keova si vide).
        Placée en position 2 (après Template) car c'est de la config foundationnelle,
        pas une section de la page publique.

        Story 18.3b — section 100 % premium (`white_label_branding`) : elle est
        intégralement REMPLACÉE par le panneau de verrouillage 18.2 pour un plan
        Essentiel. Rien n'est flouté ni masqué : les inputs `brandName` et le
        widget d'upload ne sont tout simplement pas montés, donc aucun contenu
        focusable ne subsiste derrière le lock.

        L'ancre `#section-branding` est portée par le WRAPPER, rendu dans les
        DEUX états — prévention « ancre vers un élément inexistant » (Convention
        ancres conditionnelles, retro Feature Y). Le `mb-10` a suivi sur le
        wrapper pour que l'espacement soit identique verrouillé ou non.

        ⚠️ Ne PAS réécrire l'attribut ci-dessus en toutes lettres dans ce
        commentaire : plusieurs tests structurels cherchent la chaîne dans le
        source, et un second exemplaire en commentaire les rendrait vacants
        (constaté par mutation pendant la 18.3b).

        ⚠️ Même règle pour la balise ouvrante du gate (`FeatureGate` + son
        attribut `feature`) : ne l'écrire nulle part en commentaire. Les suites
        `coach-page-branding` et `coach-page-toggles-inline` la cherchent aussi.
      -->
        <div
          id="section-branding"
          class="mb-10"
        >
          <section
            class="overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
          >
            <!--
              Header avec gradient + icon badge + status pill.

              🚨 Story 18.3b (CR, décision Simon) — le bandeau de titre vit HORS
              du `<FeatureGate>`, comme l'ancre : verrouillée, la section reste
              NOMMÉE (« Identité de marque ») et garde son repère `<section>`.
              Auparavant le `<h2>` était à l'intérieur du gate, et une provider
              Essentiel ne voyait qu'une carte d'upsell anonyme coincée entre
              « Template » et les sections publiques. Seul le CORPS est remplacé.
            -->
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

            <FeatureGate feature="white_label_branding">
              <CoachPageBrandingCard
                :brand-name="brandingForm.brandName"
                :logo-server-url="logoServerUrl"
                :saving="saving"
                :logo-deleting="logoDeleting"
                @update:brand-name="brandingForm.brandName = $event"
                @save="handleBrandingSubmit"
                @logo-uploaded="onLogoUploaded"
                @logo-removed="onLogoRemoved"
              />
            </FeatureGate>
          </section>
        </div>

        <!-- ═══════ 2.5 PALETTE DE COULEURS (Story 0-37 AC-5, AC-6) ═══════ -->
        <section
          id="section-palette"
          class="mb-10 overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
        >
          <div class="border-b border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-highlight)] to-[color:var(--color-surface-card)] px-6 py-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-brand-primary)]/10">
                  <UIcon
                    name="i-lucide-palette"
                    class="size-5 text-[color:var(--color-brand-primary)]"
                  />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    Couleurs de marque
                  </h2>
                  <p class="mt-0.5 text-sm text-[color:var(--color-brand-secondary)]">
                    Personnalisez les deux couleurs de votre page publique et de votre calendrier.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CoachPagePaletteEditor
            :brand-color="paletteForm.brandColor"
            :brand-accent-color="paletteForm.brandAccentColor"
            :saving="saving"
            @update:brand-color="paletteForm.brandColor = $event"
            @update:brand-accent-color="paletteForm.brandAccentColor = $event"
            @save="onSavePalette"
          />
        </section>

        <!-- ═══════ 3. SECTIONS DE LA PAGE PUBLIQUE ═══════
        Ordre aligné sur le rendu de la page publique coach (PO 2026-05-01) :
        hero → bio → problemStatement → benefits → pillars → howItWorks
        → pricing → educationalContent → testimonials → faq → disclaimer
      -->

        <!-- Hero section editor (Story 0-37 AC-1, AC-2) -->
        <section
          id="section-hero"
          class="mb-10 overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
        >
          <div class="flex items-center justify-between border-b border-[color:var(--color-border-subtle)] px-6 py-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-sparkles"
                class="size-5 text-[color:var(--color-brand-primary)]"
              />
              <div>
                <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                  Hero (en-tête principal)
                </h2>
                <p class="text-xs text-[color:var(--color-brand-secondary)]">
                  Le premier message visible par vos visiteuses en haut de votre page.
                </p>
              </div>
            </div>
            <span class="text-xs text-[color:var(--color-text-muted)]">
              Toujours visible
            </span>
          </div>

          <CoachPageHeroEditor
            :headline="heroForm.heroHeadline"
            :description="heroForm.heroDescription"
            :urgency="heroForm.urgencyText"
            :hero-is-background="isHeroBackgroundTemplate"
            :template-code="previewTemplateCode"
            :headline-hint="heroHeadlineHint"
            :photo-url="account?.heroImageUrl ?? null"
            :profile-photo-url="account?.imageUrl ?? null"
            :photo-busy="heroPhotoUploading"
            :photo-error="heroPhotoError"
            :photo-disabled="account?.heroImageDisabled ?? false"
            :saving="saving"
            @update:headline="heroForm.heroHeadline = $event"
            @update:description="heroForm.heroDescription = $event"
            @update:urgency="heroForm.urgencyText = $event"
            @photo-selected="onHeroPhotoSelected"
            @photo-cleared="onHeroPhotoCleared"
            @photo-uploaded="onHeroPhotoUploadedFromCard"
            @photo-error="onHeroPhotoError"
            @photo-disable="handleHeroPhotoDisable"
            @photo-enable-default="handleHeroPhotoEnableDefault"
            @save="onSaveHero"
          />
        </section>

        <!-- ═══════ 3. SECTION EDITORS — ordre aligné sur la page publique ═══════ -->
        <!--
          LAB-R14 (rétro epic-lab, F14) — la trappe : sans template sélectionné,
          `availableSections` vaut `[]` (createCoachPageEditor :73), donc
          `orderedEditableSections` est vide et l'éditeur se rendait **vide, sans
          explication**. Une praticienne sans `coach_page_template_id` ne voyait
          aucune section et n'avait aucun moyen de comprendre pourquoi.
          L'avis nomme la cause et le geste ; il ne fabrique pas de sections.
        -->
        <CoachPageTemplateRequiredNotice v-if="!selectedTemplateId" />
        <template
          v-for="section in orderedEditableSections"
          :key="section"
        >
          <!-- External sections (`pricing` since story 0-26 — `certifications` a
            rejoint l'éditeur inline en LAB.4) -->
          <!-- TF.1 — carte externe extraite (composant montable). -->
          <CoachPageExternalSectionCard
            v-if="externalSection(section)"
            v-model:pricing-eyebrow="sectionTitlesForm.pricingEyebrow"
            v-model:pricing-title="sectionTitlesForm.pricingTitle"
            :section="section"
            :label="externalSection(section)?.label ?? ''"
            :action-label="externalSection(section)?.actionLabel ?? ''"
            :to="externalSectionTo(section)"
            :is-on="isSectionOn(section)"
            :saving="saving"
            @toggle="onToggleSection"
            @save-pricing-titles="onSavePricingSectionTitles"
          />

          <CoachPageSectionCard
            v-if="hasEditor(section)"
            :section="section"
            :label="sectionLabel(section)"
            :is-on="isSectionOn(section)"
            :locked="isSectionLocked(section)"
            :lock-reason="sectionLockReason(section)"
            :body-open="isSectionBodyOpen(section)"
            :saving="saving"
            :show-footer="section !== 'certifications'"
            @toggle="onToggleSection"
            @save="onSaveSection(section)"
          >
            <!-- ── BIO (Qui suis-je) — CPD.2 ── -->
            <CoachPageBioEditor
              v-if="section === 'bio'"
              :bio-form="bioForm"
              :bio-eyebrow="sectionTitlesForm.bioEyebrow"
              :bio-title="sectionTitlesForm.bioTitle"
              :secondary-photo-url="secondaryPhotoForEditor"
              @update:long-bio="bioForm.longBio = $event"
              @update:city="bioForm.city = $event"
              @update:region="bioForm.region = $event"
              @update:bio-eyebrow="sectionTitlesForm.bioEyebrow = $event"
              @update:bio-title="sectionTitlesForm.bioTitle = $event"
              @photo-selected="onSecondaryPhotoSelected"
              @photo-uploaded="onSecondaryPhotoUploaded"
              @photo-error="onSecondaryPhotoError"
            />

            <!-- ── CREDENTIALS (Diplômes & certifications) — LAB.4 ── -->
            <CoachPageCertificationsCard
              v-if="section === 'certifications'"
              :credentials="credentialsForm"
              :saving="saving"
              @update:credentials="credentialsForm = $event"
              @save="onSaveCredentials"
            />
            <!-- ── PROBLEM STATEMENT — CPD.2 ── -->
            <CoachPageProblemStatementEditor
              v-if="section === 'problemStatement'"
              :problem-statement-form="problemStatementForm"
              :problem-statement-eyebrow="sectionTitlesForm.problemStatementEyebrow"
              :problem-statement-title="sectionTitlesForm.problemStatementTitle"
              :photo-url="problemStatementPhotoForEditor"
              :photo-busy="problemStatementPhotoUploading"
              :photo-error="problemStatementPhotoError"
              @update:problem-statement-eyebrow="sectionTitlesForm.problemStatementEyebrow = $event"
              @update:problem-statement-title="sectionTitlesForm.problemStatementTitle = $event"
              @update:blockquote="setProblemStatementBlockquote($event)"
              @update:paragraph="onProblemParagraphUpdate($event)"
              @add-paragraph="addProblemParagraph"
              @remove-paragraph="removeProblemParagraph($event)"
              @photo-selected="onProblemStatementPhotoSelected"
              @photo-uploaded="onProblemStatementPhotoUploaded"
              @photo-removed="onProblemStatementPhotoRemoved"
              @photo-error="onProblemStatementPhotoError"
            />

            <!-- ── BENEFITS — CPD.3 ── -->
            <CoachPageBenefitsEditor
              v-if="section === 'benefits'"
              :items="benefitsForm?.items ?? []"
              :vision-intro="benefitsForm?.visionIntro ?? null"
              :vision-text="benefitsForm?.visionText ?? null"
              :benefits-eyebrow="sectionTitlesForm.benefitsEyebrow"
              :benefits-title="sectionTitlesForm.benefitsTitle"
              @update:item="onBenefitItemUpdate($event)"
              @add="addBenefit()"
              @remove="removeBenefit($event)"
              @update:vision-intro="setBenefitsVisionIntro($event)"
              @update:vision-text="setBenefitsVisionText($event)"
              @update:benefits-eyebrow="sectionTitlesForm.benefitsEyebrow = $event"
              @update:benefits-title="sectionTitlesForm.benefitsTitle = $event"
            />

            <!-- ── FREE TEXT (Bloc de texte libre) — CPD.5 ── -->
            <template v-if="section === 'freeText'">
              <CoachPageFreeTextEditor
                :free-text-form="freeTextForm"
                @update:title="setFreeTextTitle($event)"
                @update:paragraph="setFreeTextParagraph($event.index, $event.value)"
                @add-paragraph="addFreeTextParagraph()"
                @remove-paragraph="removeFreeTextParagraph($event)"
              />
            </template>

            <!-- ── PILLARS — CPD.3 ── -->
            <CoachPagePillarsEditor
              v-if="section === 'pillars'"
              :items="pillarsForm?.items ?? []"
              :emotional-support="pillarsForm?.emotionalSupport ?? null"
              :show-emotional-support="hasEmotionalSupportSection"
              :pillars-eyebrow="sectionTitlesForm.pillarsEyebrow"
              :pillars-title="sectionTitlesForm.pillarsTitle"
              @update:item="onPillarItemUpdate($event)"
              @add="addPillar()"
              @remove="removePillar($event)"
              @update:emotional-support-title="setPillarsEmotionalSupportTitle($event)"
              @update:emotional-support-description="setPillarsEmotionalSupportDescription($event)"
              @update:pillars-eyebrow="sectionTitlesForm.pillarsEyebrow = $event"
              @update:pillars-title="sectionTitlesForm.pillarsTitle = $event"
            />

            <!-- ── HOW IT WORKS — CPD.3 ── -->
            <CoachPageHowItWorksEditor
              v-if="section === 'howItWorks'"
              :items="howItWorksForm"
              :how-it-works-eyebrow="sectionTitlesForm.howItWorksEyebrow"
              :how-it-works-title="sectionTitlesForm.howItWorksTitle"
              @update:item="onHowItWorksItemUpdate($event)"
              @add="addStep()"
              @remove="removeStep($event)"
              @update:how-it-works-eyebrow="sectionTitlesForm.howItWorksEyebrow = $event"
              @update:how-it-works-title="sectionTitlesForm.howItWorksTitle = $event"
            />

            <!-- ── FIT / POUR QUI — CPD.5 ── -->
            <template v-if="section === 'fit'">
              <CoachPageFitEditor
                :fit-form="fitForm"
                @update:fit-field="setFitField"
                @update:item="applyFitItem"
                @add="addFitItem($event)"
                @remove="removeFitItem($event)"
              />
            </template>

            <!-- ── EDUCATIONAL CONTENT — CPD.5 ── -->
            <template v-if="section === 'educationalContent'">
              <CoachPageEducationalContentEditor
                :educational-content-form="educationalContentForm"
                @update:paragraph="setEducationalParagraph($event.index, $event.value)"
                @add-paragraph="addEducationalParagraph()"
                @remove-paragraph="removeEducationalParagraph($event)"
                @update:insight="setEducationalInsight"
              />
            </template>

            <!-- ── TESTIMONIALS — extrait CPD.4 ── -->
            <template v-if="section === 'testimonials'">
              <CoachPageTestimonialsEditor
                :items="testimonialsForm"
                :testimonials-eyebrow="sectionTitlesForm.testimonialsEyebrow"
                :testimonials-title="sectionTitlesForm.testimonialsTitle"
                @update:item="onTestimonialItemUpdate($event)"
                @add="addTestimonial()"
                @remove="removeTestimonial($event)"
                @update:testimonials-eyebrow="sectionTitlesForm.testimonialsEyebrow = $event"
                @update:testimonials-title="sectionTitlesForm.testimonialsTitle = $event"
              />
            </template>

            <!-- ── FAQ — extrait CPD.4 ── -->
            <template v-if="section === 'faq'">
              <CoachPageFaqEditor
                :items="faqForm"
                :faq-eyebrow="sectionTitlesForm.faqEyebrow"
                :faq-title="sectionTitlesForm.faqTitle"
                @update:item="onFaqItemUpdate($event)"
                @add="addFaq()"
                @remove="removeFaq($event)"
                @update:faq-eyebrow="sectionTitlesForm.faqEyebrow = $event"
                @update:faq-title="sectionTitlesForm.faqTitle = $event"
              />
            </template>
          </CoachPageSectionCard>
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
          :consultation-plans="previewConsultationPlans"
          :public-programs="previewPublicPrograms"
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

    <!-- Slideover mobile / tablet (Story 0-28) — plein écran sous xl.
         CR-4 (Codex 2026-05-02) : on retire le plafond max-width tablette qui
         clippait la preview en colonne partielle. AC-2 demande explicitement
         plein écran sur tout viewport < 1280px. -->
    <USlideover
      v-model:open="previewMobileOpen"
      side="right"
      :ui="{ content: 'w-screen max-w-none' }"
    >
      <template #content>
        <CoachPagePreviewPanel
          :coach-profile="draftCoachProfile"
          :tenant="draftTenant"
          :consultation-plans="previewConsultationPlans"
          :public-programs="previewPublicPrograms"
          :device="previewDevice"
          :show-close="true"
          @update:device="setPreviewDevice"
          @close="closeMobilePreview"
        />
      </template>
    </USlideover>

    <!-- Modal checklist de publication -->
    <CoachPublishChecklistModal
      v-if="account?.publishChecklist"
      v-model:open="checklistModalOpen"
      :checklist="account.publishChecklist"
      :loading="publishing"
      :error="publishError"
      @publish="executePublish"
      @navigate-to-section="handleNavigateToSection"
    />

    <!-- Modal confirmation de dépublication -->
    <ConfirmActionModal
      v-model:open="confirmUnpublishModalOpen"
      title="Dépublier ma page coach"
      description="Votre site repassera en brouillon. Les visiteurs accédant à votre adresse ne pourront plus voir votre page ni réserver de créneaux. Voulez-vous continuer ?"
      confirm-label="Dépublier"
      :loading="publishing"
      @confirm="handleUnpublish"
    />
  </div>
</template>
