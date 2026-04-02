<script setup lang="ts">
import type { PublicProgramListItem } from '../../features/programs/api/programs.contract'
import { formatProgramInstallments } from '../../features/programs/domain/programs'
import { formatCurrency } from '../../features/analytics/helpers/format-kpi'

const props = defineProps<{
  program: PublicProgramListItem
  bookingUrl: string
  isAuthenticated: boolean
  currentPath?: string
}>()

const emit = defineEmits<{
  (e: 'checkout', program: PublicProgramListItem): void
}>()

const installmentsLabel = computed(() => formatProgramInstallments(props.program))

/**
 * CTA logic based on discovery gate + auth state.
 *
 * discovery_gate: true  + not authenticated → "Prendre un appel découverte" → booking
 * discovery_gate: true  + authenticated     → "Choisir ce programme" → emit checkout
 * discovery_gate: false + not authenticated → "Choisir ce programme" → login
 * discovery_gate: false + authenticated     → "Choisir ce programme" → emit checkout
 */
const cta = computed(() => {
  if (props.program.discoveryGate && !props.isAuthenticated) {
    return {
      label: 'Prendre un appel découverte',
      to: props.bookingUrl,
      action: null as (() => void) | null,
      disabled: false
    }
  }

  if (!props.isAuthenticated) {
    const redirect = props.currentPath ? encodeURIComponent(`${props.currentPath}#programmes`) : ''
    return {
      label: 'Choisir ce programme',
      to: redirect ? `/login?redirect=${redirect}` : '/login',
      action: null as (() => void) | null,
      disabled: false
    }
  }

  // Authenticated → open checkout modal
  return {
    label: 'Choisir ce programme',
    to: undefined,
    action: () => emit('checkout', props.program),
    disabled: false
  }
})
</script>

<template>
  <article class="flex flex-col rounded-2xl bg-[color:var(--color-surface-card)] p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
    <!-- Name -->
    <h3 class="font-serif text-xl text-[var(--color-crepuscule-950)]">
      {{ program.name }}
    </h3>

    <!-- Description -->
    <p class="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-crepuscule-700)]">
      {{ program.description }}
    </p>

    <!-- Details -->
    <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
      <span>{{ program.totalSessions }} séances</span>
      <span>{{ program.sessionDurationMinutes }} min</span>
      <span>{{ program.validityMonths }} mois de validité</span>
    </div>

    <!-- Price -->
    <div class="mt-4">
      <p class="text-2xl font-bold text-[var(--color-crepuscule-950)]">
        {{ formatCurrency(program.priceCents) }}
      </p>
      <p
        v-if="installmentsLabel"
        class="mt-1 text-sm text-[var(--color-text-muted)]"
      >
        {{ installmentsLabel }}
      </p>
    </div>

    <!-- Discovery gate badge -->
    <div
      v-if="program.discoveryGate"
      class="mt-4"
    >
      <span class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-sunset-50)] px-3 py-1 text-xs font-medium text-[color:var(--color-sunset-700)] ring-1 ring-amber-200">
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
        @click="cta.action?.()"
      >
        {{ cta.label }}
      </UButton>
    </div>
  </article>
</template>
