<script setup lang="ts">
/**
 * CPD.2 — Éditeur « Qui suis-je » (bio + city + region + photo secondaire),
 * extrait de `coach-page.vue`.
 *
 * La carte ne décide de rien : elle émet les modifications champ par champ et
 * délègue la persistance à la page. L'upload (`uploadAsset`) est fait côté
 * serveur ; la carte prévient la page via `photo-selected` (aperçu local, avant
 * upload), `photo-uploaded` (URL définitive) et `photo-error`.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (cf. AC-2 amendé le 2026-11-05).
 */
import { computed } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import { useImageUpload } from '~/features/assets/use-image-upload'

const props = withDefaults(
  defineProps<{
    bioForm?: { longBio?: string | null, city?: string | null, region?: string | null } | null
    bioEyebrow?: string | null
    bioTitle?: string | null
    secondaryPhotoUrl?: string | null
  }>(),
  {
    bioForm: null,
    bioEyebrow: null,
    bioTitle: null,
    secondaryPhotoUrl: null
  }
)

const emit = defineEmits<{
  'update:longBio': [value: string]
  'update:city': [value: string]
  'update:region': [value: string]
  'update:bioEyebrow': [value: string]
  'update:bioTitle': [value: string]
  'photo-selected': [previewUrl: string]
  'photo-uploaded': [url: string]
  'photo-error': [message: string]
}>()

const LONG_BIO_MAX_LENGTH = 5000

const longBioValue = computed(() => props.bioForm?.longBio ?? '')
const cityValue = computed(() => props.bioForm?.city ?? '')
const regionValue = computed(() => props.bioForm?.region ?? '')
const bioEyebrowValue = computed(() => props.bioEyebrow ?? '')
const bioTitleValue = computed(() => props.bioTitle ?? '')

const bioCharCount = computed(() => longBioValue.value.length)

const {
  preview,
  uploading,
  error: uploadError,
  inputRef: secondaryFileInputRef,
  hasSelection,
  trigger,
  onFileSelected: selectFile,
  upload
} = useImageUpload({
  assetType: 'secondary_photo',
  maxBytes: 2 * 1024 * 1024
})

const photoPreview = computed(() => preview.value || props.secondaryPhotoUrl)

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
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <input
      ref="secondaryFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileSelected"
    >

    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="bioEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Qui suis-je"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="bioEyebrowValue"
            v-bind="inputAttrs"
            placeholder="Qui suis-je"
            :maxlength="100"
            @update:model-value="emit('update:bioEyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="bioTitle"
        label="Titre principal de la section"
        hint="Défaut : Votre spécialiste ménopause — {Nom}"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="bioTitleValue"
            v-bind="inputAttrs"
            placeholder="Votre spécialiste ménopause — ..."
            :maxlength="200"
            @update:model-value="emit('update:bioTitle', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <!-- Photo secondaire -->
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
            v-if="photoPreview"
            :src="photoPreview"
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
            @click="trigger"
          />
          <UButton
            v-if="hasSelection"
            :loading="uploading"
            :disabled="uploading"
            label="Enregistrer la photo"
            size="sm"
            @click="onUploadClick"
          />
          <p
            v-if="uploadError"
            class="text-sm text-[color:var(--color-error)]"
            role="alert"
          >
            {{ uploadError }}
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
          :model-value="longBioValue"
          v-bind="inputAttrs"
          class="w-full"
          placeholder="Mon parcours, mes méthodes, ma philosophie..."
          :maxlength="LONG_BIO_MAX_LENGTH"
          :rows="8"
          size="sm"
          @update:model-value="emit('update:longBio', $event as string)"
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
            :model-value="cityValue"
            v-bind="inputAttrs"
            class="w-full"
            placeholder="Paris"
            :maxlength="100"
            @update:model-value="emit('update:city', $event as string)"
          />
        </template>
      </FormControl>

      <FormControl
        id="region"
        label="Région"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="regionValue"
            v-bind="inputAttrs"
            class="w-full"
            placeholder="Île-de-France"
            :maxlength="100"
            @update:model-value="emit('update:region', $event as string)"
          />
        </template>
      </FormControl>
    </div>
  </div>
</template>
