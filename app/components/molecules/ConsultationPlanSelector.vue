<script setup lang="ts">
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'

/**
 * Sélecteur de tarif consultation (price plan).
 *
 * Atomic Design : Molécule
 * Usage : Modal création/édition RDV consultation (calendrier provider)
 *
 * Règles métier :
 * - Affiche uniquement les plans actifs (`isActive: true`)
 * - Tri par `sortOrder` ASC (ordre stable défini par le provider)
 * - Si aucun plan actif : affiche un empty state avec CTA vers /provider/pricing/consultations
 */

type PlanOption = {
  id: string
  label: string
  durationMinutes: number
  amountCents: number
}

const props = withDefaults(
  defineProps<{
    /**
     * Liste complète des plans (actifs + inactifs).
     * Le composant filtre pour n'afficher que les actifs.
     */
    plans: ConsultationPricePlan[]
    /**
     * ID du plan actuellement sélectionné.
     */
    modelValue: string | null
    /**
     * Désactiver la sélection (ex: pendant un submit).
     */
    disabled?: boolean
    /**
     * Message d'erreur de validation (ex: `fieldErrors.pricePlanId`).
     */
    error?: string | null
  }>(),
  {
    disabled: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void
}>()

/**
 * Plans actifs, triés par sortOrder.
 */
const activePlans = computed<PlanOption[]>(() => {
  return props.plans
    .filter(plan => plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(plan => ({
      id: plan.id,
      label: plan.label,
      durationMinutes: plan.durationMinutes,
      amountCents: plan.amountCents
    }))
})

const hasActivePlans = computed(() => activePlans.value.length > 0)

const selectedPlan = computed(() => {
  if (!props.modelValue) return null
  return activePlans.value.find(plan => plan.id === props.modelValue) ?? null
})

const selectOptions = computed(() => {
  return activePlans.value.map(plan => ({
    label: plan.label,
    value: plan.id
  }))
})

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}

function updateSelection(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="grid gap-3">
    <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
      Tarif consultation
    </label>

    <!-- Empty State : aucun plan actif -->
    <div
      v-if="!hasActivePlans"
      class="grid gap-4 rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-5"
    >
      <div class="flex items-start gap-3">
        <Icon
          name="lucide:alert-circle"
          size="20"
          class="mt-0.5 shrink-0 text-[color:var(--color-warning)]"
          aria-hidden="true"
        />
        <div class="grid gap-2">
          <p class="text-sm font-bold text-[color:var(--color-brand-primary)]">
            Aucun tarif actif
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Créez d'abord un tarif de consultation pour pouvoir planifier un rendez-vous.
          </p>
        </div>
      </div>

      <ULink
        to="/provider/pricing/consultations"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-5 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-soft transition-base hover:shadow-floating"
      >
        <Icon
          name="lucide:plus"
          size="18"
          aria-hidden="true"
        />
        Créer un tarif
      </ULink>
    </div>

    <!-- Sélecteur : plans actifs disponibles -->
    <div
      v-else
      class="grid gap-3"
    >
      <USelect
        :model-value="modelValue ?? ''"
        :items="selectOptions"
        placeholder="Choisir un tarif…"
        :disabled="disabled"
        @update:model-value="updateSelection"
      />

      <!-- Récap du plan sélectionné (durée + prix) -->
      <div
        v-if="selectedPlan"
        class="rounded-input border border-[rgba(231,229,228,0.7)] bg-white/70 p-4 shadow-soft"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-sm text-[color:var(--color-brand-secondary)]">
            <Icon
              name="lucide:clock"
              size="16"
              aria-hidden="true"
            />
            <span>{{ selectedPlan.durationMinutes }} min</span>
          </div>
          <div class="text-base font-bold text-[color:var(--color-brand-primary)]">
            {{ formatPrice(selectedPlan.amountCents) }}
          </div>
        </div>
      </div>

      <!-- Message d'erreur (validation) -->
      <p
        v-if="error"
        class="text-xs font-bold text-[color:var(--color-error)]"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
