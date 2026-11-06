<script setup lang="ts">
/**
 * CPD.3 — Éditeur « Piliers » (liste à icônes + soutien émotionnel), extrait
 * de `coach-page.vue`.
 *
 * Le soutien émotionnel n'est rendu que si `showEmotionalSupport` est vrai
 * (prop explicite, pas de lecture globalisée) : la carte reste testable seule.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (arbitrage CPD.2 du 2026-11-05, appliqué à CPD.3).
 */
import type { EmotionalSupport, PillarItem } from '~/features/seo/api/public-provider-profile.contract'
import type { ListItemPatch } from '~/features/coach/domain/list-item-patch'

import FormControl from '~/components/molecules/FormControl.vue'
import IconPicker from '~/components/molecules/IconPicker.vue'

withDefaults(
  defineProps<{
    items?: PillarItem[]
    emotionalSupport?: EmotionalSupport | null
    showEmotionalSupport?: boolean
    pillarsEyebrow?: string | null
    pillarsTitle?: string | null
  }>(),
  {
    items: () => [],
    emotionalSupport: null,
    showEmotionalSupport: false,
    pillarsEyebrow: '',
    pillarsTitle: ''
  }
)

const emit = defineEmits<{
  'update:item': [patch: ListItemPatch]
  'add': []
  'remove': [index: number]
  'update:emotional-support-title': [value: string]
  'update:emotional-support-description': [value: string]
  'update:pillars-eyebrow': [value: string]
  'update:pillars-title': [value: string]
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="pillarsEyebrow"
        label="Surtitre de la section"
        hint="Défaut : L'approche"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="pillarsEyebrow ?? ''"
            v-bind="inputAttrs"
            placeholder="L'approche"
            :maxlength="100"
            @update:model-value="emit('update:pillars-eyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="pillarsTitle"
        label="Titre principal de la section"
        hint="Défaut : Les piliers de l'accompagnement"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="pillarsTitle ?? ''"
            v-bind="inputAttrs"
            placeholder="Les piliers de l'accompagnement"
            :maxlength="200"
            @update:model-value="emit('update:pillars-title', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <div class="space-y-4">
      <div
        v-for="(pillar, idx) in items"
        :key="idx"
        class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
      >
        <button
          type="button"
          class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          @click="emit('remove', idx)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
          />
        </button>
        <div class="space-y-3">
          <UInput
            :model-value="pillar.title"
            placeholder="Titre du pilier"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'title', value: $event as string })"
          />
          <UTextarea
            :model-value="pillar.description"
            class="w-full"
            placeholder="Description (max 500 caractères)"
            :maxlength="500"
            :rows="3"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'description', value: $event as string })"
          />
          <div>
            <label class="mb-1 block text-xs text-[color:var(--color-brand-secondary)]">
              Icône (optionnel)
            </label>
            <IconPicker
              :model-value="pillar.icon ?? null"
              label="Icône du pilier"
              @update:model-value="(v: string) => emit('update:item', { index: idx, field: 'icon', value: v || undefined })"
            />
          </div>
        </div>
      </div>
    </div>
    <UButton
      class="mt-4"
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-plus"
      :disabled="items.length >= 10"
      @click="emit('add')"
    >
      Ajouter un pilier
    </UButton>

    <!-- F1: Emotional Support sub-section (Signature template only) -->
    <div
      v-if="showEmotionalSupport"
      class="mt-6 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
        Soutien émotionnel (optionnel)
      </h3>
      <div class="space-y-3">
        <UInput
          :model-value="emotionalSupport?.title ?? ''"
          placeholder="Titre (ex: Un espace d'écoute bienveillant)"
          size="sm"
          @update:model-value="emit('update:emotional-support-title', $event as string)"
        />
        <UTextarea
          :model-value="emotionalSupport?.description ?? ''"
          class="w-full"
          placeholder="Description (max 1000 caractères)"
          :maxlength="1000"
          :rows="3"
          size="sm"
          @update:model-value="emit('update:emotional-support-description', $event as string)"
        />
      </div>
    </div>
  </div>
</template>
