<script setup lang="ts">
/**
 * CPD.6 — Éditeur de palette (2 couleurs + 2 avertissements de contraste),
 * extrait de `coach-page.vue`.
 *
 * La carte NE décide de rien : elle émet `update:brand-color`,
 * `update:brand-accent-color` et `save`. Les seuils de contraste (3.0 pour la
 * couleur principale, 2.5 pour l'accent) sont inchangés et calculés ici.
 */
import { computed } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'
import {
  parseHex,
  getRelativeLuminance,
  getContrastRatio
} from '#shared/utils/brand-color-helpers'

const props = withDefaults(
  defineProps<{
    brandColor?: string | null
    brandAccentColor?: string | null
    saving?: boolean
  }>(),
  {
    brandColor: '#5B4B6E',
    brandAccentColor: '#D4956A',
    saving: false
  }
)

const emit = defineEmits<{
  'update:brand-color': [value: string]
  'update:brand-accent-color': [value: string]
  'save': []
}>()

const brandColorValue = computed(() => props.brandColor ?? '')
const brandAccentColorValue = computed(() => props.brandAccentColor ?? '')

const primaryContrastWarning = computed(() => {
  const hex = brandColorValue.value.trim()
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return null
  const rgb = parseHex(hex)
  if (!rgb) return null
  const bgL = getRelativeLuminance(255, 255, 255)
  const fgL = getRelativeLuminance(rgb.r, rgb.g, rgb.b)
  const ratio = getContrastRatio(fgL, bgL)
  if (ratio < 3.0) {
    return 'Attention : cette couleur est très claire sur fond blanc (contraste faible).'
  }
  return null
})

const accentContrastWarning = computed(() => {
  const hex = brandAccentColorValue.value.trim()
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return null
  const rgb = parseHex(hex)
  if (!rgb) return null
  const bgL = getRelativeLuminance(255, 255, 255)
  const fgL = getRelativeLuminance(rgb.r, rgb.g, rgb.b)
  const ratio = getContrastRatio(fgL, bgL)
  if (ratio < 2.5) {
    return 'Attention : cette couleur d\'accent est très claire (lisibilité réduite).'
  }
  return null
})
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-6 sm:grid-cols-2">
      <div>
        <FormControl
          id="brandColor"
          label="Couleur principale (Titres, navigation, accents)"
          :hint="primaryContrastWarning || 'Format hexadécimal (ex: #5B4B6E)'"
        >
          <template #default="{ inputAttrs }">
            <div class="flex items-center gap-3">
              <input
                :value="brandColorValue"
                type="color"
                class="size-10 cursor-pointer rounded-lg border border-[color:var(--color-border-subtle)] p-0.5"
                @input="emit('update:brand-color', ($event.target as HTMLInputElement).value)"
              >
              <UInput
                :model-value="brandColorValue"
                v-bind="inputAttrs"
                class="flex-1"
                placeholder="#5B4B6E"
                :maxlength="7"
                @update:model-value="emit('update:brand-color', $event as string)"
              />
            </div>
          </template>
        </FormControl>
      </div>

      <div>
        <FormControl
          id="brandAccentColor"
          label="Couleur d'accent (Boutons d'action, puces, badges)"
          :hint="accentContrastWarning || 'Format hexadécimal (ex: #D4956A)'"
        >
          <template #default="{ inputAttrs }">
            <div class="flex items-center gap-3">
              <input
                :value="brandAccentColorValue"
                type="color"
                class="size-10 cursor-pointer rounded-lg border border-[color:var(--color-border-subtle)] p-0.5"
                @input="emit('update:brand-accent-color', ($event.target as HTMLInputElement).value)"
              >
              <UInput
                :model-value="brandAccentColorValue"
                v-bind="inputAttrs"
                class="flex-1"
                placeholder="#D4956A"
                :maxlength="7"
                @update:model-value="emit('update:brand-accent-color', $event as string)"
              />
            </div>
          </template>
        </FormControl>
      </div>
    </div>
  </div>

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
