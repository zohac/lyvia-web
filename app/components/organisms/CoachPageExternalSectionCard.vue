<script setup lang="ts">
/**
 * TF.1 — Carte des sections externes de la page coach, extraite de
 * `coach-page.vue` (bloc l. 2258-2338) à l'identique.
 *
 * Composant montable : la preuve de câblage (lab-3/lab-5) peut désormais
 * rendre ce composant réellement. La logique d'autosave reste dans la page
 * (`onToggleSection`) ; ce composant ne fait que relayer les événements.
 */
const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (en-tête)',
  bio: 'Qui suis-je',
  certifications: 'Section Parcours & qualifications',
  benefits: 'Bénéfices',
  freeText: 'Bloc de texte libre',
  pillars: 'Piliers',
  howItWorks: 'Comment ça marche',
  fit: 'Pour qui / Adéquation',
  educationalContent: 'Contenu éducatif',
  problemStatement: 'Énoncé du problème',
  faq: 'Questions fréquentes',
  testimonials: 'Témoignages',
  pricing: 'Tarifs',
  disclaimer: 'Disclaimer médical',
  branding: 'Identité affichée dans vos emails'
}

defineProps<{
  section: string
  label: string
  actionLabel: string
  to: string
  isOn: boolean
  saving: boolean
  pricingEyebrow: string
  pricingTitle: string
}>()

const emit = defineEmits<{
  'toggle': [section: string, value: boolean]
  'save-pricing-titles': []
  'update:pricingEyebrow': [value: string]
  'update:pricingTitle': [value: string]
}>()

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section
}
</script>

<template>
  <div
    class="mb-10 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
  >
    <div
      class="flex items-center justify-between px-6 py-4"
      :class="isOn ? 'border-b border-[color:var(--color-border-subtle)]' : ''"
    >
      <div>
        <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
          {{ sectionLabel(section) }}
        </h2>
        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
          {{ label }}
        </p>
      </div>
      <label class="flex items-center gap-3">
        <span class="text-sm text-[color:var(--color-brand-secondary)]">Visible sur ma page</span>
        <USwitch
          :model-value="isOn"
          :aria-label="`${sectionLabel(section)} — visible sur ma page`"
          @update:model-value="(v: boolean) => emit('toggle', section, v)"
        />
      </label>
    </div>
    <template v-if="isOn">
      <!-- LAB.6 — les titres de section ne concernent que `pricing`. -->
      <div
        v-if="section === 'pricing'"
        class="space-y-4 px-6 py-5"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <FormControl
            id="pricingEyebrow"
            label="Surtitre de la section"
            hint="Défaut : Tarifs"
          >
            <template #default="{ inputAttrs }">
              <UInput
                :model-value="pricingEyebrow"
                v-bind="inputAttrs"
                placeholder="Tarifs"
                :maxlength="100"
                @update:model-value="emit('update:pricingEyebrow', $event as string)"
              />
            </template>
          </FormControl>
          <FormControl
            id="pricingTitle"
            label="Titre principal de la section"
            hint="Défaut : Les formules d'accompagnement"
          >
            <template #default="{ inputAttrs }">
              <UInput
                :model-value="pricingTitle"
                v-bind="inputAttrs"
                placeholder="Les formules d'accompagnement"
                :maxlength="200"
                @update:model-value="emit('update:pricingTitle', $event as string)"
              />
            </template>
          </FormControl>
        </div>
      </div>
      <div class="flex items-center justify-between border-t border-[color:var(--color-border-subtle)] px-6 py-4">
        <UButton
          :to="to"
          color="neutral"
          variant="outline"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        >
          {{ actionLabel }}
        </UButton>
        <!-- LAB.6 — l'enregistrement ne concerne que les titres de `pricing`. -->
        <UButton
          v-if="section === 'pricing'"
          color="primary"
          variant="solid"
          size="sm"
          :loading="saving"
          @click="emit('save-pricing-titles')"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </div>
</template>
