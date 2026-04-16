<script setup lang="ts">
import type { ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'

type DisplayTypeFilter = 'all' | ProviderCalendarAppointmentType

const props = defineProps<{
  typeFilter: DisplayTypeFilter
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:typeFilter', value: DisplayTypeFilter): void
}>()

const filterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Découverte', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' },
  { label: 'Suivi gratuit', value: 'free_followup' }
]

function isFilterActive(value: DisplayTypeFilter) {
  return props.typeFilter === value
}

function getFilterButtonClasses(value: DisplayTypeFilter, active: boolean) {
  if (!active) return 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
  if (value === 'discovery') return 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-800)]'
  if (value === 'consultation') return 'bg-crepuscule-100 text-crepuscule-800'
  if (value === 'free_followup') return 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-800)]'
  return 'bg-[color:var(--color-neutral-200)] text-[color:var(--color-text-primary)]'
}
</script>

<template>
  <div class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-text-muted)]">
          Affichage
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Filtrer la timeline sans modifier les données chargées.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <!-- Filter buttons -->
        <div class="inline-flex rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)] p-1">
          <button
            v-for="option in filterOptions"
            :key="option.value"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            :class="getFilterButtonClasses(option.value as DisplayTypeFilter, isFilterActive(option.value as DisplayTypeFilter))"
            :disabled="disabled"
            @click="$emit('update:typeFilter', option.value as DisplayTypeFilter)"
          >
            {{ option.label }}
          </button>
        </div>

        <!-- Legend -->
        <div class="hidden items-center gap-4 text-xs text-[color:var(--color-text-muted)] sm:flex">
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-crepuscule-500" />
            Planifié
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-[color:var(--color-success-50)]0" />
            Terminé
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-[color:var(--color-error-50)]0" />
            Annulé
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-[color:var(--color-sunset-50)]0" />
            Payé
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
