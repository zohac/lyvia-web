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
    <!-- Left side: View selector + Navigation -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- View selector -->
      <div class="inline-flex rounded-lg border border-stone-200 bg-white p-1">
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          :class="isViewActive(option.value as CalendarViewMode)
            ? 'bg-stone-100 text-stone-900 shadow-sm'
            : 'text-stone-600 hover:text-stone-900'"
          @click="$emit('update:view', option.value as CalendarViewMode)"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <UButton
          icon="lucide:chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          @click="$emit('prev')"
        />

        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="isLoading"
          @click="$emit('today')"
        >
          Aujourd'hui
        </UButton>

        <UButton
          icon="lucide:chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          @click="$emit('next')"
        />
      </div>
    </div>

    <!-- Right side: Range label + actions -->
    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        v-if="rangeLabel"
        color="neutral"
        variant="soft"
        size="lg"
      >
        {{ rangeLabel }}
      </UBadge>

      <UButton
        variant="outline"
        color="neutral"
        size="sm"
        :loading="isLoading"
        @click="$emit('refresh')"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="mr-1.5 h-4 w-4"
        />
        Actualiser
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
