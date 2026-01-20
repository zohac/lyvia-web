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
  { label: 'Discovery', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' }
]

function isFilterActive(value: DisplayTypeFilter) {
  return props.typeFilter === value
}

function getFilterButtonClasses(value: DisplayTypeFilter, active: boolean) {
  if (!active) return 'text-stone-600 hover:text-stone-900'
  if (value === 'discovery') return 'bg-amber-100 text-amber-800'
  if (value === 'consultation') return 'bg-crepuscule-100 text-crepuscule-800'
  return 'bg-stone-200 text-stone-800'
}
</script>

<template>
  <div class="rounded-lg border border-stone-200 bg-white p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
          Affichage
        </p>
        <p class="mt-1 text-sm text-stone-600">
          Filtrer la timeline sans modifier les données chargées.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <!-- Filter buttons -->
        <div class="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1">
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
        <div class="hidden items-center gap-4 text-xs text-stone-500 sm:flex">
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-crepuscule-500" />
            Planifié
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-green-500" />
            Terminé
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-red-500" />
            Annulé
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Payé
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
