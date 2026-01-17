<template>
  <div class="grid gap-3">
    <label class="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
      Mois en cours
    </label>

    <!-- Stepper buttons -->
    <div class="flex flex-wrap items-center gap-1">
      <!-- Month buttons (1-6) -->
      <button
        v-for="month in PROGRAM_MONTHS"
        :key="month"
        type="button"
        :disabled="pending"
        :aria-pressed="modelValue === month"
        :aria-label="`Mois ${month}`"
        class="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all"
        :class="getMonthButtonClasses(month)"
        @click="handleMonthClick(month)"
      >
        <span
          class="relative z-10"
          :class="{ 'opacity-50': pending }"
        >
          M{{ month }}
        </span>

        <!-- Active indicator ring -->
        <span
          v-if="modelValue === month"
          class="absolute inset-0 rounded-full ring-2 ring-[color:var(--color-brand-primary)] ring-offset-2"
          aria-hidden="true"
        />
      </button>

      <!-- Separator -->
      <span class="mx-2 h-px w-4 bg-[color:var(--color-brand-subtle)]" />

      <!-- Terminate button -->
      <button
        type="button"
        :disabled="pending"
        :aria-pressed="modelValue === null"
        aria-label="Terminer le programme"
        class="relative flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-all"
        :class="getTerminateButtonClasses()"
        @click="handleTerminate"
      >
        <span
          class="relative z-10 flex items-center gap-1.5"
          :class="{ 'opacity-50': pending }"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Terminé
        </span>

        <!-- Active indicator ring -->
        <span
          v-if="modelValue === null"
          class="absolute inset-0 rounded-full ring-2 ring-[color:var(--color-success)] ring-offset-2"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Loading indicator -->
    <div
      v-if="pending"
      class="flex items-center gap-2 text-xs text-[color:var(--color-brand-muted)]"
    >
      <span class="h-3 w-3 animate-spin rounded-full border-2 border-[color:var(--color-brand-muted)] border-t-transparent" />
      Mise à jour en cours...
    </div>
  </div>
</template>

<script setup lang="ts">
const PROGRAM_MONTHS = [1, 2, 3, 4, 5, 6] as const

const props = withDefaults(
  defineProps<{
    /**
     * Current program month (1-6) or null if completed.
     */
    modelValue: number | null
    /**
     * Whether an update is in progress.
     */
    pending?: boolean
  }>(),
  {
    pending: false
  }
)

const emit = defineEmits<{
  /**
   * Emitted when a new month is selected.
   */
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
    return 'bg-[color:var(--color-brand-primary)] text-white shadow-md'
  }

  if (isPast) {
    return 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-brand-subtle)]'
  }

  return 'bg-white/60 text-[color:var(--color-brand-muted)] hover:bg-white hover:text-[color:var(--color-brand-primary)] border border-[color:var(--color-brand-subtle)]'
}

function getTerminateButtonClasses(): string {
  const isActive = props.modelValue === null

  if (isActive) {
    return 'bg-[color:var(--color-success-200)] text-[color:var(--color-success-700)]'
  }

  return 'bg-white/60 text-[color:var(--color-brand-muted)] hover:bg-[color:var(--color-success-50)] hover:text-[color:var(--color-success-600)] border border-[color:var(--color-brand-subtle)]'
}
</script>
