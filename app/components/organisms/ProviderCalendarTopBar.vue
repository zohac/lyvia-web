<script setup lang="ts">
type CalendarViewMode = 'month' | 'week' | 'day'

const props = defineProps<{
  view: CalendarViewMode
  isLoading?: boolean
  rangeLabel?: string | null
}>()

defineEmits<{
  (e: 'prev' | 'today' | 'next' | 'refresh'): void
  (e: 'update:view', value: CalendarViewMode): void
}>()

const viewOptions = [
  { label: 'Mois', value: 'month' },
  { label: 'Semaine', value: 'week' },
  { label: 'Jour', value: 'day' }
]

function isViewActive(value: CalendarViewMode) {
  return props.view === value
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- View segmented control -->
    <div class="inline-flex gap-1 rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-1">
      <button
        v-for="option in viewOptions"
        :key="option.value"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        :class="isViewActive(option.value as CalendarViewMode)
          ? 'bg-[color:var(--color-brand-primary)] text-white'
          : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'"
        @click="$emit('update:view', option.value as CalendarViewMode)"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- Date navigation -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="grid size-9 place-items-center rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] disabled:opacity-50"
        :disabled="isLoading"
        aria-label="Période précédente"
        @click="$emit('prev')"
      >
        <UIcon
          name="lucide:chevron-left"
          class="size-4"
        />
      </button>

      <span
        v-if="rangeLabel"
        class="min-w-40 px-2 text-center text-sm font-semibold text-[color:var(--color-text-primary)]"
      >
        {{ rangeLabel }}
      </span>

      <button
        type="button"
        class="grid size-9 place-items-center rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] disabled:opacity-50"
        :disabled="isLoading"
        aria-label="Période suivante"
        @click="$emit('next')"
      >
        <UIcon
          name="lucide:chevron-right"
          class="size-4"
        />
      </button>
    </div>

    <!-- Today -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)] disabled:opacity-50"
      :disabled="isLoading"
      @click="$emit('today')"
    >
      <UIcon
        name="lucide:calendar-check"
        class="size-4"
      />
      Aujourd'hui
    </button>

    <!-- Refresh -->
    <button
      type="button"
      class="ml-auto grid size-9 place-items-center rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] disabled:opacity-50"
      :disabled="isLoading"
      aria-label="Actualiser"
      @click="$emit('refresh')"
    >
      <UIcon
        name="lucide:refresh-cw"
        class="size-4"
        :class="isLoading ? 'animate-spin' : ''"
      />
    </button>
  </div>
</template>
