<script setup lang="ts">
/**
 * TF.1 — Carte des sections externes de la page coach, extraite de
 * `coach-page.vue` (bloc « External sections » du template).
 *
 * Le MARKUP est déplacé à l'identique (mêmes classes, même ordre, mêmes gardes
 * `section === 'pricing'`) ; il est désormais piloté par props et par
 * événements au lieu de lire l'état de la page. La logique d'autosave reste
 * dans la page (`onToggleSection`) : ce composant ne fait que relayer.
 *
 * `FormControl` est un composant de l'APPLICATION, pas un auto-import Nuxt :
 * il doit être importé explicitement. Nuxt ne l'enregistre que sous
 * `MoleculesFormControl`, donc l'oublier rendait les deux champs de titres
 * silencieusement vides (trouvé en revue TF.1, classe de défaut lab-3).
 */
import FormControl from '~/components/molecules/FormControl.vue'
import { sectionLabel } from '~/features/coach/domain/coach-page-section-labels'

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
