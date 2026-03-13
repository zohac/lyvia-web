<script setup lang="ts">
import type { PublicProgramListItem } from '../../features/programs/api/programs.contract'
import { formatProgramInstallments } from '../../features/programs/domain/programs'
import { formatCurrency } from '../../features/analytics/helpers/format-kpi'

const props = defineProps<{
  program: PublicProgramListItem
  bookingUrl: string
  isAuthenticated: boolean
}>()

const installmentsLabel = computed(() => formatProgramInstallments(props.program))

/**
 * CTA logic based on discovery gate + auth state.
 *
 * discovery_gate: true  + not authenticated → "Prendre un appel découverte" → booking
 * discovery_gate: true  + authenticated     → "Choisir ce programme" (placeholder X3)
 * discovery_gate: false + not authenticated → "Choisir ce programme" → login
 * discovery_gate: false + authenticated     → "Choisir ce programme" (placeholder X3)
 */
const cta = computed(() => {
  if (props.program.discoveryGate && !props.isAuthenticated) {
    return {
      label: 'Prendre un appel découverte',
      to: props.bookingUrl,
      disabled: false
    }
  }

  if (!props.isAuthenticated) {
    return {
      label: 'Choisir ce programme',
      to: '/login',
      disabled: false
    }
  }

  // Authenticated — placeholder for checkout (X3)
  return {
    label: 'Choisir ce programme',
    to: undefined,
    disabled: true
  }
})
</script>

<template>
  <article class="flex flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
    <!-- Name -->
    <h3 class="font-serif text-xl text-[#2d2438]">
      {{ program.name }}
    </h3>

    <!-- Description -->
    <p class="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[#4a4255]">
      {{ program.description }}
    </p>

    <!-- Details -->
    <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#857d8c]">
      <span>{{ program.totalSessions }} séances</span>
      <span>{{ program.sessionDurationMinutes }} min</span>
      <span>{{ program.validityMonths }} mois de validité</span>
    </div>

    <!-- Price -->
    <div class="mt-4">
      <p class="text-2xl font-bold text-[#2d2438]">
        {{ formatCurrency(program.priceCents) }}
      </p>
      <p
        v-if="installmentsLabel"
        class="mt-1 text-sm text-[#857d8c]"
      >
        {{ installmentsLabel }}
      </p>
    </div>

    <!-- Discovery gate badge -->
    <div
      v-if="program.discoveryGate"
      class="mt-4"
    >
      <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        <UIcon
          name="i-lucide-phone-call"
          class="h-3.5 w-3.5"
        />
        Appel découverte requis
      </span>
    </div>

    <!-- CTA -->
    <div class="mt-6">
      <UButton
        :to="cta.to"
        :disabled="cta.disabled"
        color="primary"
        block
        class="rounded-full"
      >
        {{ cta.label }}
      </UButton>
    </div>
  </article>
</template>
