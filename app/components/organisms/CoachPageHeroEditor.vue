<script setup lang="ts">
import { computed, watch } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import { useImageUpload } from '~/features/assets/use-image-upload'

/**
 * CPD.7 — éditeur du hero, extrait de `coach-page.vue` (section toujours
 * visible, hors de la boucle des sections).
 *
 * L'état (`heroForm`, la photo, l'erreur) reste dans la page : il alimente
 * l'aperçu live via `useCoachPagePreviewProfile`. La carte ne rend que le
 * markup et émet des intentions. L'aide de l'accroche est calculée par la page
 * (elle seule connaît le template sélectionné) et reçue en prop : la carte
 * n'importe ni le registre de templates ni le helper.
 */
const props = withDefaults(
  defineProps<{
    headline?: string
    description?: string
    urgency?: string
    heroIsBackground?: boolean
    templateCode?: string | null
    headlineHint?: string
    photoUrl?: string | null
    profilePhotoUrl?: string | null
    photoBusy?: boolean
    photoError?: string | null
    photoDisabled?: boolean
    saving?: boolean
  }>(),
  {
    headline: '',
    description: '',
    urgency: '',
    heroIsBackground: true,
    templateCode: null,
    headlineHint: '',
    photoUrl: null,
    profilePhotoUrl: null,
    photoBusy: false,
    photoError: null,
    photoDisabled: false,
    saving: false
  }
)

const emit = defineEmits<{
  'update:headline': [value: string]
  'update:description': [value: string]
  'update:urgency': [value: string]
  'photo-selected': [previewUrl: string]
  'photo-cleared': []
  'photo-uploaded': [url: string]
  'photo-error': [message: string]
  'photo-disable': []
  'photo-enable-default': []
  'save': []
}>()

const headlineValue = computed(() => props.headline ?? '')
const descriptionValue = computed(() => props.description ?? '')
const urgencyValue = computed(() => props.urgency ?? '')

/**
 * Le template Alba affiche un PORTRAIT plat : le champ « Photo d'en-tête »
 * pilote un fond que sa page ne rend jamais (AD-6). La page transmet le
 * signal ; la carte ne connaît pas le registre.
 */
const isBackground = computed(() => props.heroIsBackground)
const isVisuel = computed(() => props.templateCode === 'visuel')

const headlineCharCount = computed(() => headlineValue.value.length)
const descriptionCharCount = computed(() => descriptionValue.value.length)
const urgencyCharCount = computed(() => urgencyValue.value.length)

const {
  file: selectedFile,
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

const displayedPhotoUrl = computed(() => preview.value || props.photoUrl || null)
const inlinePhotoError = computed(() => uploadError.value || props.photoError || null)
const photoBusyValue = computed(() => props.photoBusy)
const photoDisabledValue = computed(() => props.photoDisabled)

/**
 * Un seul état « occupé » pour tous les boutons photo : un téléversement et un
 * retrait/rétablissement écrivent le même champ, ils ne doivent pas courir
 * ensemble.
 */
const photoActionsBusy = computed(() => uploading.value || photoBusyValue.value)

/** Le libellé d'image désactivée dépend du fond que le template rend. */
const disabledPhotoLabel = computed(() => (isVisuel.value ? 'Fond sombre' : 'Sans photo'))

watch(
  () => props.photoUrl,
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
  // `clearPreview` ne vide que l'aperçu : sans remettre `file` à null,
  // `hasSelection` reste vrai et « Téléverser » enverrait le fichier annulé.
  selectedFile.value = null
  if (heroFileInputRef.value) heroFileInputRef.value.value = ''
  emit('photo-cleared')
}

function onDisableClick(): void {
  emit('photo-disable')
}

function onEnableDefaultClick(): void {
  emit('photo-enable-default')
}
</script>

<template>
  <div>
    <div class="space-y-4 px-6 py-5">
      <!-- Photo de fond / Portrait Hero (Story 0-38) -->
      <div>
        <p class="mb-2 text-sm font-medium text-[color:var(--color-text-primary)]">
          Photo d'en-tête (fond du Hero en template Visuel, portrait en Signature)
        </p>
        <p class="mb-3 text-xs text-[color:var(--color-brand-secondary)]">
          JPEG, PNG ou WebP, max 2 Mo. Le template Alba n'utilise pas ce champ :
          son hero affiche votre portrait, à gauche du titre.
        </p>
        <div class="flex items-center gap-6">
          <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <!--
              YB.1.2 — Alba. Les deux premières branches décrivent le champ
              « Photo d'en-tête », dont la sémantique est celle d'un FOND de
              hero : c'est le fond que Visuel étale en strate, et que le hero
              d'Alba n'a pas (AD-6 : hero plat, ni strate, ni image de fond, et
              `hero_image_disabled` n'y est pas lu). Alba saute donc la chaîne et
              tombe sur son PORTRAIT, plus bas. Sans cette garde, l'aperçu de
              l'éditeur annoncerait à la coach un « fond sombre » ou une image
              d'ambiance que son hero n'affiche jamais — l'aperçu mentirait sur
              la page.
            -->
            <div
              v-if="isBackground && photoDisabledValue"
              class="flex h-full w-full flex-col items-center justify-center p-2 text-center text-[10px] font-medium text-[color:var(--color-brand-muted)]"
            >
              <UIcon
                name="i-lucide-eye-off"
                class="mb-1 h-5 w-5"
              />
              {{ disabledPhotoLabel }}
            </div>
            <img
              v-else-if="isBackground && displayedPhotoUrl"
              :src="displayedPhotoUrl"
              alt="Photo Hero"
              class="h-full w-full object-cover"
            >
            <img
              v-else-if="isVisuel"
              src="/images/templates/visuel/hero-default.webp"
              alt="Photo Hero par défaut"
              class="h-full w-full object-cover opacity-75"
            >
            <!-- Alba : portrait de la coach, c'est-à-dire ce que rend
                 réellement `CoachAlbaHero` — pas une image de fond. -->
            <img
              v-else-if="profilePhotoUrl"
              :src="profilePhotoUrl"
              alt="Photo de profil"
              class="h-full w-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-image"
              class="h-10 w-10 text-[color:var(--color-brand-muted)]"
            />
          </div>

          <div
            v-if="isBackground"
            class="flex flex-col items-start gap-2"
          >
            <input
              ref="heroFileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onFileSelected"
            >

            <div
              v-if="hasSelection"
              class="flex flex-wrap gap-2"
            >
              <UButton
                :loading="uploading"
                :disabled="photoActionsBusy"
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
                type="button"
                :disabled="photoActionsBusy"
                @click="onCancelSelection"
              >
                Annuler
              </UButton>
            </div>

            <div
              v-else-if="!photoDisabledValue && displayedPhotoUrl"
              class="flex flex-wrap gap-2"
            >
              <UButton
                variant="outline"
                size="sm"
                icon="i-lucide-upload"
                type="button"
                :disabled="photoActionsBusy"
                @click="trigger"
              >
                Remplacer
              </UButton>
              <UButton
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                size="sm"
                type="button"
                :loading="photoBusyValue"
                :disabled="photoActionsBusy"
                @click="onDisableClick"
              >
                Retirer
              </UButton>
            </div>

            <div
              v-else
              class="flex flex-wrap gap-2"
            >
              <UButton
                variant="outline"
                size="sm"
                icon="i-lucide-upload"
                type="button"
                :disabled="photoActionsBusy"
                @click="trigger"
              >
                {{ displayedPhotoUrl ? 'Remplacer' : 'Ajouter une photo' }}
              </UButton>
              <UButton
                v-if="photoDisabledValue"
                variant="ghost"
                size="sm"
                type="button"
                icon="i-lucide-rotate-ccw"
                :loading="photoBusyValue"
                :disabled="photoActionsBusy"
                @click="onEnableDefaultClick"
              >
                Remettre la photo par défaut
              </UButton>
            </div>

            <p
              v-if="inlinePhotoError"
              class="text-sm text-[color:var(--color-error)]"
            >
              {{ inlinePhotoError }}
            </p>
          </div>

          <!-- Revue YB.1.2 — sur Alba, ce bloc de contrôles pilote un fond de
               hero (upload/retrait/rétablissement) que sa page ne rend pas. Le
               portrait se modifie depuis Mon compte. -->
          <p
            v-else
            class="text-xs text-[color:var(--color-brand-secondary)]"
          >
            Le template Alba affiche votre portrait : modifiez-le depuis
            <NuxtLink
              to="/provider/account"
              class="font-medium text-[color:var(--color-brand-primary)] underline-offset-4 hover:underline"
            >Mon compte → Photo de profil</NuxtLink>.
          </p>
        </div>
      </div>

      <FormControl
        id="heroHeadline"
        label="Accroche / Sous-titre principal"
        :hint="headlineHint"
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
        type="button"
        :loading="saving"
        @click="emit('save')"
      >
        Enregistrer
      </UButton>
    </div>
  </div>
</template>
