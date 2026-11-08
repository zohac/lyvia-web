<script setup lang="ts">
/**
 * CPD.5 — Éditeur « Pour qui » (fit), extrait de `coach-page.vue`.
 *
 * La carte est contrôlée : elle reçoit le formulaire en prop et émet des
 * patches typés, sans jamais toucher au store. Un seul canal par geste —
 * `update:fit-field` porte `{ field, value }`, sinon surtitre et titre sont
 * indiscernables (revue CPD.5).
 *
 * `fitForm` peut être `null` : la carte émet la valeur sans lever, et c'est
 * `setFitField` du store (`ensureFitForm`) qui crée le formulaire avant
 * d'appliquer. Un seul point d'appel, couvert par un test.
 */
import type { FitItem, FitJson } from '~/features/seo/api/public-provider-profile.contract'
import type { FitField, FitItemPatch } from '~/features/coach/domain/content-item-patch'

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    fitForm?: FitJson | null
  }>(),
  {
    fitForm: null
  }
)

const form = computed(() => props.fitForm)

const emit = defineEmits<{
  'update:fit-field': [patch: { field: FitField, value: string }]
  'update:item': [patch: FitItemPatch]
  'add': [type: FitItem['type']]
  'remove': [index: number]
}>()
</script>

<template>
  <div class="px-6 py-5">
    <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label
          for="fitEyebrow"
          class="mb-1 block text-xs font-medium text-[color:var(--color-text-muted)]"
        >Surtitre</label>
        <UInput
          id="fitEyebrow"
          :model-value="form?.eyebrow ?? ''"
          placeholder="Adéquation"
          @update:model-value="emit('update:fit-field', { field: 'eyebrow', value: $event as string })"
        />
      </div>
      <div>
        <label
          for="fitTitle"
          class="mb-1 block text-xs font-medium text-[color:var(--color-text-muted)]"
        >Titre de section</label>
        <UInput
          id="fitTitle"
          :model-value="form?.title ?? ''"
          placeholder="Cet accompagnement est-il fait pour vous ?"
          @update:model-value="emit('update:fit-field', { field: 'title', value: $event as string })"
        />
      </div>
    </div>

    <p class="mb-3 text-xs text-[color:var(--color-text-muted)]">
      Définissez les critères d'adéquation pour vos clientes (pour qui c'est fait / pour qui ce n'est pas adapté).
    </p>

    <div class="space-y-3">
      <div
        v-for="(item, idx) in (form?.items ?? [])"
        :key="idx"
        class="flex items-start gap-2 rounded-lg border border-[color:var(--color-border-subtle)] p-3"
      >
        <div class="w-40 shrink-0">
          <select
            :value="item.type"
            class="w-full rounded border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] px-2 py-1 text-xs font-medium text-[color:var(--color-text-primary)]"
            @change="emit('update:item', { index: idx, field: 'type', value: ($event.target as HTMLSelectElement).value as FitItem['type'] })"
          >
            <option value="for">
              Pour vous si
            </option>
            <option value="not_for">
              Ce n'est pas adapté si
            </option>
          </select>
        </div>
        <div class="flex-1">
          <UInput
            :model-value="item.text"
            placeholder="Décrivez un critère..."
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'text', value: $event as string })"
          />
        </div>
        <button
          type="button"
          class="mt-1 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          title="Supprimer"
          @click="emit('remove', idx)"
        >
          <UIcon
            name="i-lucide-trash-2"
            class="size-4"
          />
        </button>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-check"
        color="primary"
        @click="emit('add', 'for')"
      >
        Ajouter un critère « Pour vous »
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-x"
        color="neutral"
        @click="emit('add', 'not_for')"
      >
        Ajouter un critère « Pas adapté »
      </UButton>
    </div>
  </div>
</template>
