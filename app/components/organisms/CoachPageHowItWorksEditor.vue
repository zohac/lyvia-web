<script setup lang="ts">
/**
 * CPD.3 — Éditeur « Déroulé » (liste d'étapes à icônes, plafond 6), extrait
 * de `coach-page.vue`.
 */
import { computed } from 'vue'

import IconPicker from '~/components/molecules/IconPicker.vue'
import FormControl from '~/components/molecules/FormControl.vue'

interface StepItem {
  number?: string | null
  title?: string | null
  description?: string | null
  icon?: string | null
}

const props = withDefaults(
  defineProps<{
    items?: StepItem[] | null
    howItWorksForm?: StepItem[] | null
    form?: StepItem[] | null
    steps?: StepItem[] | null
    howItWorksEyebrow?: string | null
    howItWorksTitle?: string | null
    saving?: boolean
  }>(),
  {
    items: null,
    howItWorksForm: null,
    form: null,
    steps: null,
    howItWorksEyebrow: null,
    howItWorksTitle: null,
    saving: false
  }
)

const emit = defineEmits<{
  'update:item': [{ index: number, field: 'title' | 'description' | 'icon' | 'number', value: string | undefined }]
  'add': []
  'remove': [index: number]
  'update:how-it-works-eyebrow': [value: string]
  'update:how-it-works-title': [value: string]
  'save': []
}>()

const resolvedItems = computed(() => props.items ?? props.howItWorksForm ?? props.form ?? props.steps ?? [])
const eyebrowValue = computed(() => props.howItWorksEyebrow ?? '')
const titleValue = computed(() => props.howItWorksTitle ?? '')
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="howItWorksEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Le parcours"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="eyebrowValue"
            v-bind="inputAttrs"
            placeholder="Le parcours"
            :maxlength="100"
            @update:model-value="emit('update:how-it-works-eyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="howItWorksTitle"
        label="Titre principal de la section"
        hint="Défaut : Comment se déroule l'accompagnement"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="titleValue"
            v-bind="inputAttrs"
            placeholder="Comment se déroule l'accompagnement"
            :maxlength="200"
            @update:model-value="emit('update:how-it-works-title', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <div class="space-y-4">
      <div
        v-for="(step, idx) in (resolvedItems ?? [])"
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
        <div class="mb-2 text-xs font-bold text-[color:var(--color-brand-primary)]">
          Étape {{ step?.number ?? (idx + 1) }}
        </div>
        <div class="space-y-3">
          <UInput
            :model-value="step?.title ?? ''"
            placeholder="Titre de l'étape"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'title', value: $event as string })"
          />
          <UTextarea
            :model-value="step?.description ?? ''"
            class="w-full"
            placeholder="Description (max 500 caractères)"
            :maxlength="500"
            :rows="3"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'description', value: $event as string })"
          />
          <div>
            <label class="mb-1 block text-xs text-[color:var(--color-brand-secondary)]">
              Icône de l'étape
            </label>
            <IconPicker
              :model-value="step?.icon ?? null"
              label="Icône de l'étape"
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
      :disabled="(resolvedItems?.length ?? 0) >= 6"
      @click="emit('add')"
    >
      Ajouter une étape
    </UButton>
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
