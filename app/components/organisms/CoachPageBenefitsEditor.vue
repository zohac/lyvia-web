<script setup lang="ts">
/**
 * CPD.3 — Éditeur « Bénéfices » (liste à icônes + vision), extrait de
 * `coach-page.vue`.
 *
 * La carte est contrôlée : elle reçoit ses données en props et émet les
 * modifications (`update:item`, `add`, `remove`, `update:vision-intro`,
 * `update:vision-text`, `update:benefits-eyebrow`, `update:benefits-title`)
 * sans jamais toucher au store.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (arbitrage CPD.2 du 2026-11-05, appliqué à CPD.3).
 */
import type { BenefitItem } from '~/features/seo/api/public-provider-profile.contract'
import type { ListItemPatch } from '~/features/coach/domain/list-item-patch'

import FormControl from '~/components/molecules/FormControl.vue'
import IconPicker from '~/components/molecules/IconPicker.vue'

withDefaults(
  defineProps<{
    items?: BenefitItem[]
    visionIntro?: string | null
    visionText?: string | null
    benefitsEyebrow?: string | null
    benefitsTitle?: string | null
  }>(),
  {
    items: () => [],
    visionIntro: '',
    visionText: '',
    benefitsEyebrow: '',
    benefitsTitle: ''
  }
)

const emit = defineEmits<{
  'update:item': [patch: ListItemPatch]
  'add': []
  'remove': [index: number]
  'update:vision-intro': [value: string]
  'update:vision-text': [value: string]
  'update:benefits-eyebrow': [value: string]
  'update:benefits-title': [value: string]
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="benefitsEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Ce que l'accompagnement apporte"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="benefitsEyebrow ?? ''"
            v-bind="inputAttrs"
            placeholder="Ce que l'accompagnement apporte"
            :maxlength="100"
            @update:model-value="emit('update:benefits-eyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="benefitsTitle"
        label="Titre principal de la section"
        hint="Défaut : Un parcours adapté"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="benefitsTitle ?? ''"
            v-bind="inputAttrs"
            placeholder="Un parcours adapté"
            :maxlength="200"
            @update:model-value="emit('update:benefits-title', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <div class="mb-4 space-y-3">
      <UInput
        :model-value="visionIntro ?? ''"
        placeholder="Introduction vision (optionnel)"
        size="sm"
        @update:model-value="emit('update:vision-intro', $event as string)"
      />
      <UTextarea
        :model-value="visionText ?? ''"
        class="w-full"
        placeholder="Texte vision (optionnel)"
        :rows="3"
        size="sm"
        @update:model-value="emit('update:vision-text', $event as string)"
      />
    </div>
    <div class="space-y-4">
      <div
        v-for="(item, idx) in items"
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
            :model-value="item.title"
            placeholder="Titre du bénéfice"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'title', value: $event as string })"
          />
          <UTextarea
            :model-value="item.description"
            class="w-full"
            placeholder="Description (max 300 caractères)"
            :maxlength="300"
            :rows="3"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'description', value: $event as string })"
          />
          <div>
            <label class="mb-1 block text-xs text-[color:var(--color-brand-secondary)]">
              Icône (par défaut : Éclat)
            </label>
            <IconPicker
              :model-value="item.icon ?? null"
              label="Icône du bénéfice"
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
      Ajouter un bénéfice
    </UButton>
  </div>
</template>
