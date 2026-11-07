<script setup lang="ts">
import { computed, watch } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import { buildHeroHeadlineHint } from '~/features/coach/domain/hero-headline-hint'
import { useImageUpload } from '~/features/assets/use-image-upload'

const props = withDefaults(
  defineProps<{
    headline?: string | null
    heroHeadline?: string | null
    description?: string | null
    heroDescription?: string | null
    urgency?: string | null
    urgencyText?: string | null
    heroIsBackground?: boolean
    isHeroBackground?: boolean
    isHeroBackgroundTemplate?: boolean
    photoUrl?: string | null
    heroImageUrl?: string | null
    heroPhotoUrl?: string | null
    photoBusy?: boolean
    heroPhotoUploading?: boolean
    photoError?: string | null
    heroPhotoError?: string | null
    photoDisabled?: boolean
    heroImageDisabled?: boolean
    disabled?: boolean
    saving?: boolean
  }>(),
  {
    headline: '',
    heroHeadline: '',
    description: '',
    heroDescription: '',
    urgency: '',
    urgencyText: '',
    heroIsBackground: true,
    isHeroBackground: true,
    isHeroBackgroundTemplate: true,
    photoUrl: null,
    heroImageUrl: null,
    heroPhotoUrl: null,
    photoBusy: false,
    heroPhotoUploading: false,
    photoError: null,
    heroPhotoError: null,
    photoDisabled: false,
    heroImageDisabled: false,
    disabled: false,
    saving: false
  }
)

const emit = defineEmits<{
  'update:headline': [value: string]
  'update:description': [value: string]
  'update:urgency': [value: string]
  'photo-selected': [previewUrl: string]
  'photo-uploaded': [url: string]
  'photo-error': [message: string]
  'photo-disable': []
  'photo-enable-default': []
  'save': []
}>()

const headlineValue = computed(() => props.headline ?? props.heroHeadline ?? '')
const descriptionValue = computed(() => props.description ?? props.heroDescription ?? '')
const urgencyValue = computed(() => props.urgency ?? props.urgencyText ?? '')

const isBackground = computed(
  () => props.heroIsBackground ?? props.isHeroBackground ?? props.isHeroBackgroundTemplate ?? true
)

const serverPhotoUrl = computed(
  () => props.photoUrl ?? props.heroImageUrl ?? props.heroPhotoUrl ?? null
)

const photoBusyValue = computed(
  () => props.photoBusy || props.heroPhotoUploading || false
)

const photoErrorValue = computed(
  () => props.photoError ?? props.heroPhotoError ?? null
)

const photoDisabledValue = computed(
  () => props.photoDisabled || props.heroImageDisabled || props.disabled || false
)

const heroHeadlineHint = computed(() => buildHeroHeadlineHint(isBackground.value))

const headlineCharCount = computed(() => (headlineValue.value ?? '').length)
const descriptionCharCount = computed(() => (descriptionValue.value ?? '').length)
const urgencyCharCount = computed(() => (urgencyValue.value ?? '').length)

const {
  preview,
  uploading,
  error: uploadError,
  inputRef: heroFileInputRef,
  hasSelection,
  trigger,
  onFileSelected: selectFile,
  upload,
  clearPreview
} = useImageUpload({
  assetType: 'profile_photo',
  maxBytes: 2 * 1024 * 1024
})

const displayedPhotoUrl = computed(() => preview.value || serverPhotoUrl.value || null)
const inlinePhotoError = computed(() => uploadError.value || photoErrorValue.value)

watch(
  () => serverPhotoUrl.value,
  (value) => {
    if (!value && !hasSelection.value) clearPreview()
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

function onCancelSelection(): void {
  clearPreview()
  if (heroFileInputRef.value) heroFileInputRef.value.value = ''
}

function onDisableClick(): void {
  emit('photo-disable')
}

function onEnableDefaultClick(): void {
  emit('photo-enable-default')
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!isBackground" class="text-xs text-[color:var(--color-brand-secondary)]">
      Le template Alba affiche votre portrait : modifiez-le depuis
      <span class="font-medium text-[color:var(--color-brand-primary)]">Mon compte → Photo de profil</span>.
    </div>

    <template v-else>
      <div class="flex items-center gap-6">
        <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
          <div
            v-if="photoDisabledValue"
            class="flex h-full w-full flex-col items-center justify-center p-2 text-center text-[10px] font-medium text-[color:var(--color-brand-muted)]"
          >
            <UIcon name="i-lucide-eye-off" class="mb-1 h-5 w-5" />
            Image désactivée
          </div>
          <img
            v-else-if="displayedPhotoUrl"
            :src="displayedPhotoUrl"
            alt="Photo Hero"
            class="h-full w-full object-cover"
          />
          <UIcon
            v-else
            name="i-lucide-image"
            class="h-10 w-10 text-[color:var(--color-brand-muted)]"
          />
        </div>

        <div class="flex flex-col items-start gap-2">
          <input
            ref="heroFileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onFileSelected"
          />

          <div v-if="hasSelection" class="flex flex-wrap gap-2">
            <UButton
              :loading="uploading"
              :disabled="uploading"
              color="primary"
              variant="solid"
              size="sm"
              icon="i-lucide-cloud-upload"
              @click="onUploadClick"
            >
              {{ uploading ? 'Téléversement…' : 'Téléverser' }}
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              :disabled="uploading"
              @click="onCancelSelection"
            >
              Annuler
            </UButton>
          </div>

          <div v-else-if="serverPhotoUrl" class="flex flex-wrap gap-2">
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-upload"
              type="button"
              @click="trigger"
            >
              Remplacer
            </UButton>
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              label="Retirer"
              size="sm"
              type="button"
              :loading="photoBusyValue"
              :disabled="photoBusyValue"
              @click="onDisableClick"
            />
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-upload"
              type="button"
              @click="trigger"
            >
              Ajouter une photo
            </UButton>
          </div>

          <UButton
            v-if="photoDisabledValue"
            variant="ghost"
            size="sm"
            icon="i-lucide-rotate-ccw"
            @click="onEnableDefaultClick"
          >
            Remettre la photo par défaut
          </UButton>

          <p v-if="inlinePhotoError" class="text-sm text-[color:var(--color-error)]">
            {{ inlinePhotoError }}
          </p>
        </div>
      </div>
    </template>

    <FormControl
      id="heroHeadline"
      label="Accroche / Sous-titre principal"
      :hint="heroHeadlineHint"
    >
      <template #default="{ inputAttrs }">
        <UInput
          :model-value="headlineValue"
          v-bind="inputAttrs"
          class="w-full"
          placeholder="Ex: Spécialiste accompagnement ménopause à Paris"
          :maxlength="200"
          @update:model-value="emit('update:headline', $event as string)"
        />
      </template>
      <template #label-aside>
        <span
          class="text-xs"
          :class="headlineCharCount > 180 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
        >
          {{ headlineCharCount }}/200
        </span>
      </template>
    </FormControl>

    <FormControl
      id="heroDescription"
      label="Description détaillée du Hero"
      hint="Paragraphe de présentation sous le titre (supporte les sauts de ligne). Laissez vide pour le texte par défaut."
    >
      <template #default="{ inputAttrs }">
        <UTextarea
          :model-value="descriptionValue"
          v-bind="inputAttrs"
          class="w-full"
          placeholder="Accompagnement personnalisé en périménopause et ménopause..."
          :maxlength="1000"
          :rows="4"
          @update:model-value="emit('update:description', $event as string)"
        />
      </template>
      <template #label-aside>
        <span
          class="text-xs"
          :class="descriptionCharCount > 900 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
        >
          {{ descriptionCharCount }}/1000
        </span>
      </template>
    </FormControl>

    <FormControl
      id="urgencyText"
      label="Message de réassurance sous le bouton CTA"
      hint="Ex: Prochaines disponibilités la semaine prochaine"
    >
      <template #default="{ inputAttrs }">
        <UInput
          :model-value="urgencyValue"
          v-bind="inputAttrs"
          class="w-full"
          placeholder="Ex: Prochaines disponibilités : semaine du 21 avril"
          :maxlength="200"
          @update:model-value="emit('update:urgency', $event as string)"
        />
      </template>
      <template #label-aside>
        <span
          class="text-xs"
          :class="urgencyCharCount > 180 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
        >
          {{ urgencyCharCount }}/200
        </span>
      </template>
    </FormControl>
  </div>

  <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
    <UButton
      color="primary"
      variant="solid"
      size="sm"
      :loading="saving"
      @click="emit('save')"
    >
      Enregistrer
    </UButton>
  </div>
</template>
