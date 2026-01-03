<script setup lang="ts">
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'

type Props = {
  plans: ConsultationPricePlan[]
  selectedPlanId: string | null
  currency?: string
  selectionRequired?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'EUR',
  selectionRequired: false
})

const emit = defineEmits<{
  (event: 'update:selectedPlanId', value: string | null): void
}>()

const formatter = computed(() => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: props.currency }))

function handleSelect(planId: string) {
  emit('update:selectedPlanId', planId)
}
</script>

<template>
  <section class="rounded-blob-b border border-[rgba(231,229,228,0.85)] bg-white/75 p-6 shadow-soft backdrop-blur">
    <div class="grid gap-2">
      <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
        Tarif
      </p>
      <p class="text-sm text-[color:var(--color-brand-secondary)]">
        Choisissez la durée de consultation avant d’afficher les créneaux.
      </p>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <button
        v-for="plan in plans"
        :key="plan.id"
        type="button"
        class="rounded-blob-a border bg-white/75 p-4 text-left shadow-soft transition-base hover:bg-white"
        :class="selectedPlanId === plan.id ? 'border-[color:var(--color-brand-accent)] ring-2 ring-[rgba(212,184,160,0.35)]' : 'border-[rgba(231,229,228,0.85)]'"
        :aria-pressed="selectedPlanId === plan.id"
        @click="handleSelect(plan.id)"
      >
        <p class="font-serif text-base italic text-[color:var(--color-brand-primary)]">
          {{ plan.label }}
        </p>
        <p class="mt-2 text-xs text-[color:var(--color-brand-muted)]">
          {{ formatter.format(plan.amountCents / 100) }}
          <span class="mx-2 text-[color:var(--color-brand-subtle)]">•</span>
          {{ plan.durationMinutes }} min
        </p>
      </button>
    </div>

    <p
      v-if="selectionRequired && !selectedPlanId"
      class="mt-4 text-xs text-[color:var(--color-brand-muted)]"
    >
      Sélection obligatoire avant chargement des créneaux.
    </p>
  </section>
</template>
