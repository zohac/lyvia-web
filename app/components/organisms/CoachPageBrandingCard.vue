<script setup lang="ts">
/**
 * CPD.6 — Carte « Identité de marque » (nom de marque + widget logo 3 états),
 * extraite de `coach-page.vue`.
 *
 * La carte NE décide PAS du gating : elle est montée par la page SOUS
 * `<FeatureGate feature="white_label_branding">`. L'ancre `id="section-branding"`
 * et le titre `<h2>` vivent HORS du gate (cf. correctif 18-3b).
 *
 * La mécanique d'upload (`validateBrandLogoFile`, `uploadAsset('brand_logo')`)
 * vit ICI ; la persistance (`updateAccount`) reste dans la page. La carte
 * n'appelle jamais `updateAccount` : elle émet `update:brand-name`, `save`,
 * `logo-uploaded` (url + assetId) et `logo-removed`.
 */
import { computed, ref } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import SystemAlert from '~/components/atoms/SystemAlert.vue'
import {
  uploadAsset,
  formatUploadError,
  validateBrandLogoFile
} from '~/features/assets/use-asset-upload'

const props = withDefaults(
  defineProps<{
    brandName?: string | null
    logoServerUrl?: string | null
    saving?: boolean
    logoDeleting?: boolean
  }>(),
  {
    brandName: '',
    logoServerUrl: null,
    saving: false,
    logoDeleting: false
  }
)

const emit = defineEmits<{
  'update:brand-name': [value: string]
  'save': []
  'logo-uploaded': [payload: { url: string, assetId: string }]
  'logo-removed': []
}>()

const toast = useToast()

const BRAND_NAME_MAX_LENGTH = 100

// ── Logo upload widget state (Story 0-27) ──
const logoFile = ref<File | null>(null)
const logoLocalPreview = ref<string | null>(null)
const logoFileInputRef = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const logoUploadError = ref<string | null>(null)

const logoPreviewSrc = computed(
  () => logoLocalPreview.value ?? props.logoServerUrl ?? ''
)

const hasBrandLogo = computed(() => Boolean(props.logoServerUrl))

const brandNameCharCount = computed(() => (props.brandName ?? '').length)

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
    const result = await uploadAsset('brand_logo', logoFile.value)
    if (logoLocalPreview.value && logoLocalPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(logoLocalPreview.value)
    }
    logoLocalPreview.value = null
    logoFile.value = null
    if (logoFileInputRef.value) logoFileInputRef.value.value = ''
    emit('logo-uploaded', { url: result.url, assetId: result.assetId })
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

function cancelLogoSelection() {
  if (logoLocalPreview.value && logoLocalPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoLocalPreview.value)
  }
  logoLocalPreview.value = null
  logoFile.value = null
  logoUploadError.value = null
  if (logoFileInputRef.value) logoFileInputRef.value.value = ''
}

function handleLogoDelete() {
  emit('logo-removed')
}
</script>

<template>
  <!-- Live preview tiles -->
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
          {{ (brandName ?? '').trim() || 'Keova' }}
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
          {{ (brandName ?? '').trim() || 'Keova' }}
        </span>
      </div>
    </div>
  </div>

  <div class="px-6 py-5">
    <SystemAlert
      v-if="! (brandName ?? '').trim() && !hasBrandLogo"
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
            :model-value="brandName ?? ''"
            v-bind="inputAttrs"
            class="w-full"
            placeholder="Ex: Sophie Jouan — Coach"
            :maxlength="BRAND_NAME_MAX_LENGTH"
            @update:model-value="emit('update:brand-name', $event as string)"
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

        <!-- État : preview locale -->
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

        <!-- État : logo persisté -->
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

        <!-- État : aucun logo -->
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

  <!-- Footer Save -->
  <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
    <UButton
      color="primary"
      variant="solid"
      size="sm"
      :loading="saving"
      :disabled="saving"
      @click="emit('save')"
    >
      Enregistrer
    </UButton>
  </div>
</template>
