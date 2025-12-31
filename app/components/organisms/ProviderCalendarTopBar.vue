<script setup lang="ts">
type CalendarViewMode = 'month' | 'week' | 'day'

const props = defineProps<{
  view: CalendarViewMode
  isLoading?: boolean
}>()

defineEmits<{
  (e: 'prev' | 'today' | 'next'): void
  (e: 'update:view', value: CalendarViewMode): void
}>()

function isActive(value: CalendarViewMode) {
  return props.view === value
}
</script>

<template>
  <header class="grid gap-4 rounded-blob-b border border-white/60 bg-white/70 p-6 shadow-soft backdrop-blur">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="grid gap-1">
        <h1 class="font-serif text-3xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-4xl">
          Calendrier
        </h1>
        <p class="text-sm font-medium text-[color:var(--color-brand-secondary)]">
          Une timeline unique pour Discovery et Consultations.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading"
          @click="$emit('prev')"
        >
          <Icon
            name="lucide:chevron-left"
            size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Prev</span>
        </button>

        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)] px-4 text-sm font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading"
          @click="$emit('today')"
        >
          Today
        </button>

        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading"
          @click="$emit('next')"
        >
          <span class="hidden sm:inline">Next</span>
          <Icon
            name="lucide:chevron-right"
            size="18"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-full bg-white/80 p-1 ring-1 ring-[rgba(231,229,228,0.7)]">
        <button
          type="button"
          class="h-9 rounded-full px-4 text-sm font-bold transition-base"
          :class="isActive('month') ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft' : 'text-[color:var(--color-brand-primary)] hover:bg-[rgba(231,229,228,0.45)]'"
          @click="$emit('update:view', 'month')"
        >
          Mois
        </button>
        <button
          type="button"
          class="h-9 rounded-full px-4 text-sm font-bold transition-base"
          :class="isActive('week') ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft' : 'text-[color:var(--color-brand-primary)] hover:bg-[rgba(231,229,228,0.45)]'"
          @click="$emit('update:view', 'week')"
        >
          Semaine
        </button>
        <button
          type="button"
          class="h-9 rounded-full px-4 text-sm font-bold transition-base"
          :class="isActive('day') ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft' : 'text-[color:var(--color-brand-primary)] hover:bg-[rgba(231,229,228,0.45)]'"
          @click="$emit('update:view', 'day')"
        >
          Jour
        </button>
      </div>

      <slot name="right" />
    </div>
  </header>
</template>
