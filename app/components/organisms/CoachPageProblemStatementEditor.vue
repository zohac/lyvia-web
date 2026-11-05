<script setup lang="ts">
/**
 * CPD.2 — Éditeur « Énoncé du problème » (titres, citation, paragraphes, photo),
 * extrait de `coach-page.vue`.
 *
 * `problemStatementForm` peut être `null` : la carte n'affiche alors aucun
 * paragraphe fantôme (une coach qui n'a jamais rempli la section).
 *
 * La suppression de la photo est déléguée à la page (`photo-removed`) : la
 * carte ne décide de rien et n'appelle jamais `updateAccount`. L'image locale
 * est retirée quand la prop `photoUrl` passe à `null`, c'est-à-dire quand le
 * serveur a effectivement accepté la suppression.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (cf. AC-2 amendé le 2026-11-05).
 */
import { computed, watch } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import { useImageUpload } from '~/features/assets/use-image-upload'

const props = withDefaults(
  defineProps<{
    problemStatementForm?: { blockquote?: string | null, paragraphs?: string[] | null } | null
    problemStatementEyebrow?: string | null
    problemStatementTitle?: string | null
    photoUrl?: string | null
    photoBusy?: boolean
    photoError?: string | null
  }>(),
  {
    problemStatementForm: null,
    problemStatementEyebrow: null,
    problemStatementTitle: null,
    photoUrl: null,
    photoBusy: false,
    photoError: null
  }
)

const emit = defineEmits<{
  'update:blockquote': [value: string]
  'update:paragraph': [{ index: number, value: string }]
  'update:problemStatementEyebrow': [value: string]
  'update:problemStatementTitle': [value: string]
  'add-paragraph': []
  'remove-paragraph': [index: number]
  'photo-selected': [previewUrl: string]
  'photo-uploaded': [url: string]
  'photo-error': [message: string]
  'photo-removed': []
}>()

const PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH = 500

const eyebrowValue = computed(() => props.problemStatementEyebrow ?? '')
const titleValue = computed(() => props.problemStatementTitle ?? '')
const blockquoteValue = computed(() => props.problemStatementForm?.blockquote ?? '')
const paragraphsValue = computed(() => props.problemStatementForm?.paragraphs ?? [])

const {
  preview,
  uploading,
  error: uploadError,
  inputRef: problemStatementFileInputRef,
  hasSelection,
  trigger,
  onFileSelected: selectFile,
  upload,
  clearPreview
} = useImageUpload({
  assetType: 'problem_statement_photo',
  maxBytes: 5 * 1024 * 1024
})

const displayedPhotoUrl = computed(() => preview.value || props.photoUrl)
const inlineError = computed(() => uploadError.value || props.photoError)

/**
 * Le serveur a accepté la suppression (ou la photo n'a jamais existé) : l'URL
 * locale issue de l'upload ne doit plus masquer l'état réel.
 */
watch(
  () => props.photoUrl,
  (value) => {
    if (!value) clearPreview()
  }
)

function onFileSelected(event: Event): void {
  const previewUrl = selectFile(event)
  if (previewUrl) emit('photo-selected', previewUrl)
}

async function onUploadClick(): Promise<void> {
  const url = await upload()
  if (url) {
    emit('photo-uploaded', url)
    return
  }
  if (uploadError.value) emit('photo-error', uploadError.value)
}

function onDeleteClick(): void {
  emit('photo-removed')
}
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <input
      ref="problemStatementFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileSelected"
    >

    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="problemStatementEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Comprendre"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="eyebrowValue"
            v-bind="inputAttrs"
            placeholder="Comprendre"
            :maxlength="100"
            @update:model-value="emit('update:problemStatementEyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="problemStatementTitle"
        label="Titre principal de la section"
        hint="Défaut : Ce que vous traversez n'est pas une fatalité"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="titleValue"
            v-bind="inputAttrs"
            placeholder="Ce que vous traversez n'est pas une fatalité"
            :maxlength="200"
            @update:model-value="emit('update:problemStatementTitle', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <div class="space-y-3">
      <UTextarea
        :model-value="blockquoteValue"
        aria-label="Citation principale"
        class="w-full"
        placeholder="Citation principale (max 2000 caractères)"
        :maxlength="2000"
        :rows="4"
        size="sm"
        @update:model-value="emit('update:blockquote', $event as string)"
      />
    </div>

    <h3 class="mb-3 mt-6 text-sm font-semibold text-[color:var(--color-text-primary)]">
      Paragraphes explicatifs (optionnel)
    </h3>
    <div class="space-y-4">
      <div
        v-for="(_, idx) in paragraphsValue"
        :key="idx"
        class="relative"
      >
        <button
          type="button"
          class="absolute -right-1 -top-1 z-10 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          :aria-label="`Supprimer le paragraphe ${idx + 1}`"
          @click="emit('remove-paragraph', idx)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
          />
        </button>
        <UTextarea
          :model-value="paragraphsValue[idx] ?? ''"
          :aria-label="`Paragraphe ${idx + 1}`"
          class="w-full"
          :placeholder="`Paragraphe ${idx + 1} (max ${PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH} caractères)`"
          :maxlength="PROBLEM_STATEMENT_PARAGRAPH_MAX_LENGTH"
          :rows="4"
          size="sm"
          @update:model-value="emit('update:paragraph', { index: idx, value: $event as string })"
        />
      </div>
    </div>
    <UButton
      class="mt-4"
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-plus"
      :disabled="paragraphsValue.length >= 10"
      @click="emit('add-paragraph')"
    >
      Ajouter un paragraphe
    </UButton>

    <!-- Photo de fond -->
    <div class="mt-8 border-t border-[color:var(--color-border-subtle)] pt-6">
      <p class="mb-1 text-sm font-medium text-[color:var(--color-text-primary)]">
        Image d'arrière-plan de la section (template Visuel / Luna)
      </p>
      <p class="mb-3 text-xs text-[color:var(--color-brand-secondary)]">
        JPEG, PNG ou WebP, max 5 Mo. Recommandé : 1920×1080 (paysage ambiance sombre).
      </p>
      <div class="flex items-center gap-6">
        <div class="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
          <img
            v-if="displayedPhotoUrl"
            :src="displayedPhotoUrl"
            alt="Image d'arrière-plan du problème"
            class="h-full w-full object-cover"
          >
          <UIcon
            v-else
            name="i-lucide-image"
            class="h-8 w-8 text-[color:var(--color-brand-muted)]"
          />
        </div>
        <div class="flex flex-col items-start gap-2">
          <div class="flex flex-wrap gap-2">
            <UButton
              variant="outline"
              icon="i-lucide-upload"
              :label="displayedPhotoUrl ? 'Modifier l\'image' : 'Ajouter une image'"
              size="sm"
              type="button"
              @click="trigger"
            />
            <UButton
              v-if="displayedPhotoUrl"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              label="Supprimer l'image"
              size="sm"
              type="button"
              :loading="photoBusy"
              :disabled="photoBusy"
              @click="onDeleteClick"
            />
          </div>
          <UButton
            v-if="hasSelection"
            :loading="uploading"
            :disabled="uploading"
            label="Enregistrer l'image"
            size="sm"
            @click="onUploadClick"
          />
          <p
            v-if="inlineError"
            class="text-sm text-[color:var(--color-error)]"
            role="alert"
          >
            {{ inlineError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
