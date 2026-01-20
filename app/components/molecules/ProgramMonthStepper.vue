<template>
  <div class="space-y-3">
    <!-- Stepper buttons -->
    <div class="flex flex-wrap items-center gap-1.5">
      <!-- Month buttons (1-6) -->
      <button
        v-for="month in PROGRAM_MONTHS"
        :key="month"
        type="button"
        :disabled="pending"
        :aria-pressed="modelValue === month"
        :aria-label="`Mois ${month}`"
        class="relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-crepuscule-500 focus:ring-offset-2"
        :class="getMonthButtonClasses(month)"
        @click="handleMonthClick(month)"
      >
        <span :class="{ 'opacity-50': pending }">
          M{{ month }}
        </span>
      </button>

      <!-- Separator -->
      <span class="mx-1.5 h-px w-3 bg-stone-200" />

      <!-- Terminate button -->
      <button
        type="button"
        :disabled="pending"
        :aria-pressed="modelValue === null"
        aria-label="Terminer le programme"
        class="relative flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        :class="getTerminateButtonClasses()"
        @click="handleTerminate"
      >
        <span
          class="flex items-center gap-1.5"
          :class="{ 'opacity-50': pending }"
        >
          <UIcon
            name="lucide:check-circle"
            class="h-4 w-4"
          />
          Terminé
        </span>
      </button>
    </div>

    <!-- Loading indicator -->
    <div
      v-if="pending"
      class="flex items-center gap-2 text-xs text-stone-500"
    >
      <UIcon
        name="lucide:loader-2"
        class="h-3.5 w-3.5 animate-spin"
      />
      Mise à jour...
    </div>
  </div>
</template>

<script setup lang="ts">
const PROGRAM_MONTHS = [1, 2, 3, 4, 5, 6] as const

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    pending?: boolean
  }>(),
  {
    pending: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

function handleMonthClick(month: number): void {
  if (props.pending || props.modelValue === month) return
  emit('update:modelValue', month)
}

function handleTerminate(): void {
  if (props.pending || props.modelValue === null) return
  emit('update:modelValue', null)
}

function getMonthButtonClasses(month: number): string {
  const isActive = props.modelValue === month
  const isPast = props.modelValue !== null && month < props.modelValue

  if (isActive) {
    return 'bg-crepuscule-600 text-white shadow-sm ring-2 ring-crepuscule-600 ring-offset-2'
  }

  if (isPast) {
    return 'bg-stone-100 text-stone-600 hover:bg-stone-200'
  }

  return 'bg-white text-stone-400 border border-stone-200 hover:border-stone-300 hover:text-stone-600'
}

function getTerminateButtonClasses(): string {
  const isActive = props.modelValue === null

  if (isActive) {
    return 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-2'
  }

  return 'bg-white text-stone-400 border border-stone-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600'
}
</script>
