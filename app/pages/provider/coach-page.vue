<script setup lang="ts">
/**
 * Provider Coach Page Editor (YC3.1)
 *
 * Allows the provider to:
 * - Select a coach page template
 * - Toggle sections on/off
 * - Edit content per section (pillars, FAQ, benefits, how-it-works, etc.)
 *
 * Each section saves independently (AC-6).
 */
import {
  getCoachPageExternalEditorSection,
  getCoachPageTemplateSaveErrorToast,
  isCoachPageInlineEditorSection
} from '~/features/coach/domain/coach-page-editor'
import { useCoachPageEditor } from '~/features/coach/useCoachPageEditor'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Ma page coach'
})

const toast = useToast()

const {
  loading,
  saving,
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
} = useCoachPageEditor()

onMounted(() => init())

const PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH = 500

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
  disclaimer: 'Disclaimer médical'
}

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section
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

// ── Toggles ──
function toggleSection(section: string) {
  if (isAlwaysOn(section)) return
  sectionsConfig[section] = !isSectionOn(section)
}

async function onSaveToggles() {
  const ok = await saveSectionsConfig()
  if (ok) {
    toast.add({ title: 'Configuration des sections mise à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  }
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
  toast.add({ title: ok ? 'Piliers sauvegardés' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
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
  toast.add({ title: ok ? 'FAQ sauvegardée' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
}

async function onSaveBenefits() {
  const ok = await saveBenefits()
  toast.add({ title: ok ? 'Bénéfices sauvegardés' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
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
  toast.add({ title: ok ? 'Étapes sauvegardées' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
}

async function onSaveEducationalContent() {
  const ok = await saveEducationalContent()
  toast.add({ title: ok ? 'Contenu éducatif sauvegardé' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
}

async function onSaveProblemStatement() {
  const ok = await saveProblemStatement()
  toast.add({ title: ok ? 'Énoncé sauvegardé' : 'Erreur de sauvegarde', color: ok ? 'primary' : 'error' })
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

    <template v-else>
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
            <!-- F5: template preview image when available -->
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

      <!-- ═══════ 2. SECTION TOGGLES ═══════ -->
      <section class="mb-10">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
            Sections visibles
          </h2>
          <UButton
            color="primary"
            variant="solid"
            size="sm"
            :loading="saving"
            @click="onSaveToggles"
          >
            Sauvegarder
          </UButton>
        </div>
        <div class="space-y-3">
          <div
            v-for="section in configurableSections"
            :key="section"
            class="flex items-center justify-between rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-4 py-3"
          >
            <span class="text-sm font-medium text-[color:var(--color-text-primary)]">
              {{ sectionLabel(section) }}
            </span>
            <USwitch
              :model-value="isSectionOn(section)"
              :disabled="isAlwaysOn(section)"
              @update:model-value="toggleSection(section)"
            />
          </div>
        </div>
      </section>

      <!-- ═══════ 3. SECTION EDITORS ═══════ -->
      <template
        v-for="section in editableSections"
        :key="section"
      >
        <!-- F2: Sections edited elsewhere — show link to /provider/account -->
        <div
          v-if="externalSection(section) && isSectionOn(section)"
          class="mb-10 flex items-center justify-between rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-6 py-4"
        >
          <div>
            <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {{ sectionLabel(section) }}
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              {{ externalSection(section)?.label }}
            </p>
          </div>
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

        <section
          v-if="hasEditor(section) && isSectionOn(section)"
          :id="section === 'pillars' ? 'section-pillars' : undefined"
          class="mb-10 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-6"
        >
          <!-- ── PILLARS ── -->
          <template v-if="section === 'pillars'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Piliers
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSavePillars"
              >
                Sauvegarder
              </UButton>
            </div>
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
                    placeholder="Description (max 500 caractères)"
                    :maxlength="500"
                    :rows="2"
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
          </template>

          <!-- ── FAQ ── -->
          <template v-if="section === 'faq'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Questions fréquentes
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSaveFaq"
              >
                Sauvegarder
              </UButton>
            </div>
            <div class="space-y-4">
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
                    placeholder="Réponse (max 2000 caractères)"
                    :maxlength="2000"
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
              :disabled="faqForm.length >= 20"
              @click="addFaq"
            >
              Ajouter une question
            </UButton>
          </template>

          <!-- ── BENEFITS ── -->
          <template v-if="section === 'benefits'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Bénéfices de l'accompagnement
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSaveBenefits"
              >
                Sauvegarder
              </UButton>
            </div>
            <div class="mb-4 space-y-3">
              <UInput
                :model-value="benefitsForm?.visionIntro ?? ''"
                placeholder="Introduction vision (optionnel)"
                size="sm"
                @update:model-value="setBenefitsVisionIntro"
              />
              <UTextarea
                :model-value="benefitsForm?.visionText ?? ''"
                placeholder="Texte vision (optionnel)"
                :rows="2"
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
                    placeholder="Description (max 300 caractères)"
                    :maxlength="300"
                    :rows="2"
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
          </template>

          <!-- ── HOW IT WORKS ── -->
          <template v-if="section === 'howItWorks'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Comment ça marche
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSaveHowItWorks"
              >
                Sauvegarder
              </UButton>
            </div>
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
                    placeholder="Description (max 500 caractères)"
                    :maxlength="500"
                    :rows="2"
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
          </template>

          <!-- ── EDUCATIONAL CONTENT ── -->
          <template v-if="section === 'educationalContent'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Contenu éducatif
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSaveEducationalContent"
              >
                Sauvegarder
              </UButton>
            </div>
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
                  :placeholder="`Paragraphe ${idx + 1} (max 2000 caractères)`"
                  :maxlength="2000"
                  :rows="3"
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
                  placeholder="Contenu de l'encadré"
                  :rows="2"
                  size="sm"
                  @update:model-value="setEducationalInsightContent"
                />
              </div>
            </div>
          </template>

          <!-- ── PROBLEM STATEMENT ── -->
          <template v-if="section === 'problemStatement'">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Énoncé du problème
              </h2>
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="saving"
                @click="onSaveProblemStatement"
              >
                Sauvegarder
              </UButton>
            </div>
            <div class="space-y-3">
              <UTextarea
                :model-value="problemStatementForm?.blockquote ?? ''"
                placeholder="Citation principale (max 2000 caractères)"
                :maxlength="2000"
                :rows="3"
                size="sm"
                @update:model-value="setProblemStatementBlockquote"
              />
            </div>

            <!-- Paragraphs under the blockquote -->
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
                  :placeholder="`Paragraphe ${idx + 1} (max ${PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH} caractères)`"
                  :maxlength="PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH"
                  :rows="3"
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
          </template>
        </section>
      </template>
    </template>
  </div>
</template>
