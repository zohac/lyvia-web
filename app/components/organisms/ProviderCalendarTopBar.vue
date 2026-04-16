<script setup lang="ts">
type CalendarViewMode = 'month' | 'week' | 'day'

const props = defineProps<{
  view: CalendarViewMode
  isLoading?: boolean
  rangeLabel?: string | null
}>()

defineEmits<{
  (e: 'prev' | 'today' | 'next' | 'refresh' | 'create'): void
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
  <div class="flex flex-wrap items-center justify-between gap-4">
    <!-- Left side: View selector -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- View selector -->
      <div class="inline-flex rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-1">
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          :class="isViewActive(option.value as CalendarViewMode)
            ? 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-primary)] shadow-sm'
            : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'"
          @click="$emit('update:view', option.value as CalendarViewMode)"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Date navigation: chevrons around range label -->
      <div class="flex items-center gap-1">
        <UButton
          icon="lucide:chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          aria-label="Période précédente"
          @click="$emit('prev')"
        />

        <span
          v-if="rangeLabel"
          class="min-w-32 px-3 py-1.5 text-center text-sm font-semibold text-[color:var(--color-text-secondary)]"
        >
          {{ rangeLabel }}
        </span>

        <UButton
          icon="lucide:chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          aria-label="Période suivante"
          @click="$emit('next')"
        />
      </div>

      <!-- Today button: explicit reset action -->
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        :disabled="isLoading"
        @click="$emit('today')"
      >
        <UIcon
          name="lucide:calendar-check"
          class="mr-1.5 h-4 w-4"
        />
        Revenir à aujourd'hui
      </UButton>
    </div>

    <!-- Right side: actions -->
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :loading="isLoading"
        aria-label="Actualiser"
        @click="$emit('refresh')"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="h-4 w-4"
        />
      </UButton>

      <UButton
        color="primary"
        size="sm"
        :disabled="isLoading"
        @click="$emit('create')"
      >
        <UIcon
          name="lucide:plus"
          class="mr-1.5 h-4 w-4"
        />
        Créer un RDV
      </UButton>
    </div>
  </div>
</template>
