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

function isActive(value: DisplayTypeFilter) {
  return props.typeFilter === value
}
</script>

<template>
  <section class="rounded-blob-d border border-white/60 bg-white/55 p-4 shadow-soft backdrop-blur">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="grid gap-1">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-secondary)]">
          Affichage
        </p>
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          Filtrer la timeline sans modifier les données chargées.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex rounded-full bg-white/70 p-1 ring-1 ring-[rgba(231,229,228,0.7)]">
          <button
            type="button"
            class="h-8 rounded-full px-3 text-xs font-bold transition-base"
            :class="isActive('all') ? 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)] shadow-soft' : 'text-[color:var(--color-brand-secondary)] hover:bg-[rgba(231,229,228,0.35)]'"
            :disabled="disabled"
            @click="$emit('update:typeFilter', 'all')"
          >
            All
          </button>
          <button
            type="button"
            class="h-8 rounded-full px-3 text-xs font-bold transition-base"
            :class="isActive('discovery') ? 'bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)] shadow-soft' : 'text-[color:var(--color-brand-secondary)] hover:bg-[rgba(231,229,228,0.35)]'"
            :disabled="disabled"
            @click="$emit('update:typeFilter', 'discovery')"
          >
            Discovery
          </button>
          <button
            type="button"
            class="h-8 rounded-full px-3 text-xs font-bold transition-base"
            :class="isActive('consultation') ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft' : 'text-[color:var(--color-brand-secondary)] hover:bg-[rgba(231,229,228,0.35)]'"
            :disabled="disabled"
            @click="$emit('update:typeFilter', 'consultation')"
          >
            Consultation
          </button>
        </div>

        <div class="hidden flex-wrap items-center gap-3 text-xs text-[color:var(--color-brand-secondary)] md:flex">
          <span class="inline-flex items-center gap-2">
            <span
              class="inline-flex size-2 rounded-full bg-[color:var(--color-brand-primary)]"
              aria-hidden="true"
            />
            Planifié
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="inline-flex size-2 rounded-full bg-[color:var(--color-success)]"
              aria-hidden="true"
            />
            Terminé
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="inline-flex size-2 rounded-full bg-[color:var(--color-error)]"
              aria-hidden="true"
            />
            Annulé
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="inline-flex size-2 rounded-full bg-[color:var(--color-warning)]"
              aria-hidden="true"
            />
            Payé
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
