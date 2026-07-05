<script setup lang="ts">
import type { ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
import type { DisplayStatus } from '../../features/calendar/presentation/appointment-style'
import { STATUS_CONFIG, STATUS_LEGEND_ORDER } from '../../features/calendar/presentation/appointment-style'

type DisplayTypeFilter = 'all' | ProviderCalendarAppointmentType

const props = defineProps<{
  typeFilter: DisplayTypeFilter
  statusFilters: Record<DisplayStatus, boolean>
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:typeFilter', value: DisplayTypeFilter): void
  (e: 'toggle:status', value: DisplayStatus): void
}>()

const typeOptions: { label: string, value: DisplayTypeFilter, dot: string | null }[] = [
  { label: 'Tous', value: 'all', dot: null },
  { label: 'Découverte', value: 'discovery', dot: 'var(--color-sunset-500)' },
  { label: 'Consultation', value: 'consultation', dot: 'var(--color-crepuscule-500)' },
  { label: 'Suivi', value: 'free_followup', dot: 'var(--color-success-500)' }
]

function isTypeActive(value: DisplayTypeFilter) {
  return props.typeFilter === value
}
</script>

<template>
  <div class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-4 shadow-sm">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
          Affichage
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Filtrer la timeline sans modifier les données chargées.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <!-- Type filter (segmented pills) -->
        <div class="inline-flex flex-wrap gap-1 rounded-full bg-[color:var(--color-surface-muted)] p-1">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
            :class="isTypeActive(option.value)
              ? 'bg-[color:var(--color-surface-card)] text-[color:var(--color-text-primary)] shadow-sm'
              : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'"
            :disabled="disabled"
            @click="$emit('update:typeFilter', option.value)"
          >
            <span
              v-if="option.dot"
              class="inline-block size-2 rounded-full"
              :style="{ background: option.dot }"
            />
            {{ option.label }}
          </button>
        </div>

        <!-- Status filter (toggle chips) -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="status in STATUS_LEGEND_ORDER"
            :key="status"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
            :style="props.statusFilters[status]
              ? { background: STATUS_CONFIG[status].chipBg, color: STATUS_CONFIG[status].chipText, borderColor: STATUS_CONFIG[status].chipBorder }
              : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border-subtle)', opacity: '0.6' }"
            :aria-pressed="props.statusFilters[status]"
            :disabled="disabled"
            @click="$emit('toggle:status', status)"
          >
            <span
              class="inline-block size-2 rounded-full"
              :style="{ background: STATUS_CONFIG[status].dot }"
            />
            {{ STATUS_CONFIG[status].label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
