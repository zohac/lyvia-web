<script setup lang="ts">
/**
 * CPD.5 — Éditeur « Contenu éducatif », extrait de `coach-page.vue`.
 *
 * La carte est contrôlée : formulaire en prop, patches typés en sortie, aucun
 * accès au store. L'encadré n'émet qu'un canal, `update:insight { field, value }`
 * — deux setters parallèles auraient appliqué chaque frappe deux fois (revue
 * CPD.5).
 */
import type { EducationalContentJson } from '~/features/seo/api/public-provider-profile.contract'
import type { InsightPatch } from '~/features/coach/domain/content-item-patch'

import { computed } from 'vue'

const EDU_PARAGRAPH_MAX = 10
const EDU_PARAGRAPH_MAX_LENGTH = 2000

const props = withDefaults(
  defineProps<{
    educationalContentForm?: EducationalContentJson | null
  }>(),
  {
    educationalContentForm: null
  }
)

const form = computed(() => props.educationalContentForm)
const paragraphs = computed(() => props.educationalContentForm?.paragraphs ?? [])

const emit = defineEmits<{
  'update:paragraph': [patch: { index: number, value: string }]
  'add-paragraph': []
  'remove-paragraph': [index: number]
  'update:insight': [patch: InsightPatch]
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="space-y-4">
      <div
        v-for="(_, idx) in paragraphs"
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
          :model-value="paragraphs[idx]"
          class="w-full"
          :placeholder="`Paragraphe ${idx + 1} (max ${EDU_PARAGRAPH_MAX_LENGTH} caractères)`"
          :maxlength="EDU_PARAGRAPH_MAX_LENGTH"
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
      :disabled="paragraphs.length >= EDU_PARAGRAPH_MAX"
      @click="emit('add-paragraph')"
    >
      Ajouter un paragraphe
    </UButton>

    <div class="mt-6 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4">
      <h3 class="mb-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
        Encadré insight (optionnel)
      </h3>
      <div class="space-y-3">
        <UInput
          :model-value="form?.insightBox?.title ?? ''"
          placeholder="Titre de l'encadré"
          size="sm"
          @update:model-value="emit('update:insight', { field: 'title', value: $event as string })"
        />
        <UTextarea
          :model-value="form?.insightBox?.content ?? ''"
          class="w-full"
          placeholder="Contenu de l'encadré"
          :rows="3"
          size="sm"
          @update:model-value="emit('update:insight', { field: 'content', value: $event as string })"
        />
      </div>
    </div>
  </div>
</template>
