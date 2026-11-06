<script setup lang="ts">
/**
 * CPD.4 — Éditeur « FAQ » (questions fréquentes), extrait de `coach-page.vue`.
 *
 * La carte est contrôlée : elle reçoit ses données en props et émet les
 * modifications (`update:item`, `add`, `remove`, `update:faq-eyebrow`,
 * `update:faq-title`) sans jamais toucher au store.
 *
 * Plafond asymétrique (historique, cf. story CPD.4 / 0-26) : le bouton
 * « Ajouter » est DÉSACTIVÉ à 20 entrées (`:disabled`), et n'émet rien.
 * Ne PAS uniformiser avec les témoignages (garde dans le handler) sans
 * décision produit.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (arbitrage CPD.2 du 2026-11-05).
 */
import type { FaqPatch } from '~/features/coach/domain/social-item-patch'
import type { FaqItem } from '~/features/seo/api/public-provider-profile.contract'

import { FAQ_MAX } from '~/features/coach/domain/social-editor-limits'

import FormControl from '~/components/molecules/FormControl.vue'

const props = withDefaults(
  defineProps<{
    items?: FaqItem[]
    faqEyebrow?: string | null
    faqTitle?: string | null
  }>(),
  {
    items: () => [],
    faqEyebrow: '',
    faqTitle: ''
  }
)

const emit = defineEmits<{
  'update:item': [patch: FaqPatch]
  'add': []
  'remove': [index: number]
  'update:faq-eyebrow': [value: string]
  'update:faq-title': [value: string]
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="faqEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Questions fréquentes"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="faqEyebrow ?? ''"
            v-bind="inputAttrs"
            placeholder="Questions fréquentes"
            :maxlength="100"
            @update:model-value="emit('update:faq-eyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="faqTitle"
        label="Titre principal de la section"
        hint="Défaut : Questions fréquentes sur l'accompagnement"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="faqTitle ?? ''"
            v-bind="inputAttrs"
            placeholder="Questions fréquentes sur l'accompagnement"
            :maxlength="200"
            @update:model-value="emit('update:faq-title', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <div
      v-for="(item, idx) in props.items"
      :key="idx"
      class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
    >
      <button
        type="button"
        class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
        aria-label="Supprimer cette question"
        @click="emit('remove', idx)"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>
      <div class="space-y-3">
        <UInput
          :model-value="item.label"
          placeholder="Question"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'label', value: $event as string })"
        />
        <UTextarea
          :model-value="item.content"
          class="w-full"
          placeholder="Réponse (max 2000 caractères)"
          :maxlength="2000"
          :rows="4"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'content', value: $event as string })"
        />
      </div>
    </div>
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-plus"
      :disabled="props.items.length >= FAQ_MAX"
      @click="emit('add')"
    >
      Ajouter une question
    </UButton>
  </div>
</template>
