<script setup lang="ts">
/**
 * CPD.4 — Éditeur « Témoignages » (liste de retours clients), extrait de
 * `coach-page.vue`.
 *
 * La carte est contrôlée : elle reçoit ses données en props et émet les
 * modifications (`update:item`, `add`, `remove`, `update:testimonials-eyebrow`,
 * `update:testimonials-title`) sans jamais toucher au store.
 *
 * Plafond asymétrique (historique, cf. story CPD.4 / 0-26) : le bouton
 * « Ajouter » est MASQUÉ au plafond (`v-if`) et le handler porte en plus un
 * garde — c'est le comportement d'origine, restauré après la revue CPD.4 (le
 * premier jet le rendait visible et inerte, ce que la story interdisait).
 * Ne PAS aligner sur la FAQ (qui désactive son bouton) sans décision produit.
 *
 * Le pied « Enregistrer » n'est PAS ici : il appartient à
 * `CoachPageSectionCard` (arbitrage CPD.2 du 2026-11-05).
 */
import type { TestimonialPatch } from '~/features/coach/domain/social-item-patch'
import type { TestimonialItem } from '~/features/account/api/provider-account.contract'

import { TESTIMONIALS_MAX } from '~/features/coach/domain/social-editor-limits'

import FormControl from '~/components/molecules/FormControl.vue'

const props = withDefaults(
  defineProps<{
    items?: TestimonialItem[]
    testimonialsEyebrow?: string | null
    testimonialsTitle?: string | null
  }>(),
  {
    items: () => [],
    testimonialsEyebrow: '',
    testimonialsTitle: ''
  }
)

const emit = defineEmits<{
  'update:item': [patch: TestimonialPatch]
  'add': []
  'remove': [index: number]
  'update:testimonials-eyebrow': [value: string]
  'update:testimonials-title': [value: string]
}>()

/**
 * `age` est optionnel : vider le champ produit `undefined`, jamais `null`
 * (`TestimonialItem.age?: number`, et le contrat de `list-item-patch.ts` pose
 * la même règle). Une saisie non numérique ne produit pas `NaN`.
 */
function toOptionalNumber(raw: unknown): number | undefined {
  const text = String(raw ?? '').trim()
  if (text === '') return undefined
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function onAdd() {
  // Double garde, comme avant l'extraction : le bouton est déjà masqué au
  // plafond (`v-if`), ce garde couvre un appel programmatique. La FAQ, elle,
  // désactive son bouton — asymétrie volontaire, voir Dev Notes CPD.4.
  if ((props.items?.length ?? 0) >= TESTIMONIALS_MAX) return
  emit('add')
}
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="testimonialsEyebrow"
        label="Surtitre de la section"
        hint="Défaut : Témoignages"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="testimonialsEyebrow ?? ''"
            v-bind="inputAttrs"
            placeholder="Témoignages"
            :maxlength="100"
            @update:model-value="emit('update:testimonials-eyebrow', $event as string)"
          />
        </template>
      </FormControl>
      <FormControl
        id="testimonialsTitle"
        label="Titre principal de la section"
        hint="Défaut : Ce qu'elles en disent"
      >
        <template #default="{ inputAttrs }">
          <UInput
            :model-value="testimonialsTitle ?? ''"
            v-bind="inputAttrs"
            placeholder="Ce qu'elles en disent"
            :maxlength="200"
            @update:model-value="emit('update:testimonials-title', $event as string)"
          />
        </template>
      </FormControl>
    </div>

    <p class="text-sm text-[color:var(--color-brand-secondary)]">
      Les retours de vos clientes (max {{ TESTIMONIALS_MAX }}).
    </p>
    <div
      v-for="(t, idx) in props.items"
      :key="idx"
      class="relative rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-4"
    >
      <button
        type="button"
        class="absolute right-2 top-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
        aria-label="Supprimer ce témoignage"
        @click="emit('remove', idx)"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>
      <div class="mb-2 text-xs font-bold text-[color:var(--color-brand-primary)]">
        Témoignage {{ idx + 1 }}
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <UTextarea
            :model-value="t.quote"
            class="w-full"
            placeholder="Citation du témoignage *"
            :minlength="10"
            :maxlength="500"
            :rows="3"
            size="sm"
            @update:model-value="emit('update:item', { index: idx, field: 'quote', value: $event as string })"
          />
        </div>
        <UInput
          :model-value="t.firstName"
          placeholder="Prénom *"
          :minlength="2"
          :maxlength="50"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'firstName', value: $event as string })"
        />
        <UInput
          :model-value="t.age"
          type="number"
          placeholder="Âge"
          :min="18"
          :max="120"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'age', value: toOptionalNumber($event) })"
        />
        <UInput
          :model-value="t.location ?? ''"
          placeholder="Localisation"
          :maxlength="100"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'location', value: $event as string })"
        />
        <USelectMenu
          :model-value="t.rating"
          :items="[1, 2, 3, 4, 5]"
          placeholder="Note (1-5)"
          size="sm"
          @update:model-value="emit('update:item', { index: idx, field: 'rating', value: Number($event) })"
        />
        <UInput
          :model-value="t.result ?? ''"
          placeholder="Résultat après X mois..."
          :maxlength="200"
          size="sm"
          class="sm:col-span-2"
          @update:model-value="emit('update:item', { index: idx, field: 'result', value: $event as string })"
        />
      </div>
    </div>
    <div
      v-if="props.items.length === 0"
      class="py-4 text-center text-sm text-[color:var(--color-brand-muted)]"
    >
      Aucun témoignage ajouté.
    </div>
    <UButton
      v-if="props.items.length < TESTIMONIALS_MAX"
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-plus"
      @click="onAdd"
    >
      Ajouter un témoignage
    </UButton>
  </div>
</template>
