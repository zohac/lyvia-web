<script setup lang="ts">
/**
 * CPD.3 — Éditeur « Piliers » (liste à icônes + soutien émotionnel), extrait
 * de `coach-page.vue`. Le soutien émotionnel n'est rendu que si
 * `showEmotionalSupport` est vrai (prop explicite, pas de lecture globalisée).
 */
import { computed } from 'vue'

import IconPicker from '~/components/molecules/IconPicker.vue'
import FormControl from '~/components/molecules/FormControl.vue'

interface PillarItem {
  title?: string | null
  description?: string | null
  icon?: string | null
}

interface EmotionalSupport {
  title?: string | null
  description?: string | null
}

interface PillarsForm {
  items?: PillarItem[] | null
  emotionalSupport?: EmotionalSupport | null
}

const props = withDefaults(
  defineProps<{
    items?: PillarItem[] | null
    pillarsForm?: PillarsForm | null
    form?: PillarsForm | null
    emotionalSupport?: EmotionalSupport | null
    showEmotionalSupport?: boolean
    pillarsEyebrow?: string | null
    pillarsTitle?: string | null
    saving?: boolean
  }>(),
  {
    items: null,
    pillarsForm: null,
    form: null,
    emotionalSupport: null,
    showEmotionalSupport: false,
    pillarsEyebrow: null,
    pillarsTitle: null,
    saving: false
  }
)

const emit = defineEmits<{
  'update:item': [{ index: number, field: 'title' | 'description' | 'icon', value: string | undefined }]
  'add': []
  'remove': [index: number]
  'update:emotional-support-title': [value: string]
  'update:emotional-support-description': [value: string]
  'update:pillars-eyebrow': [value: string]
  'update:pillars-title': [value: string]
  'save': []
}>()

const resolvedItems = computed(() => props.items ?? props.pillarsForm?.items ?? props.form?.items ?? [])
const resolvedEmotionalSupport = computed(() => props.emotionalSupport ?? props.pillarsForm?.emotionalSupport ?? props.form?.emotionalSupport ?? null)
const eyebrowValue = computed(() => props.pillarsEyebrow ?? '')
const titleValue = computed(() => props.pillarsTitle ?? '')
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
            :model-value="eyebrowValue"
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
            :model-value="titleValue"
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
        v-for="(pillar, idx) in (resolvedItems ?? [])"
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
            :model-value="pillar?.title ?? ''"
            placeholder="Titre du pilier"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'title', value: $event as string })"
          />
          <UTextarea
            :model-value="pillar?.description ?? ''"
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
              :model-value="pillar?.icon ?? null"
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
      :disabled="(resolvedItems?.length ?? 0) >= 10"
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
          :model-value="resolvedEmotionalSupport?.title ?? ''"
          placeholder="Titre (ex: Un espace d'écoute bienveillant)"
          size="sm"
          @update:model-value="emit('update:emotional-support-title', $event as string)"
        />
        <UTextarea
          :model-value="resolvedEmotionalSupport?.description ?? ''"
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
