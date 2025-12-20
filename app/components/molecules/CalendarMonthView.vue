<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
  visibleMonth: Date
  availableDates: Set<string>
  minDate: string
  timezoneLabel: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'update:visibleMonth': [value: Date]
}>()

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function getYmdInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const year = parts.find(p => p.type === 'year')?.value ?? '0000'
  const month = parts.find(p => p.type === 'month')?.value ?? '01'
  const day = parts.find(p => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

const timeZone = 'Europe/Paris'

const monthLabel = computed(() => formatMonthLabel(props.visibleMonth))

const days = computed(() => {
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))

  const offset = (first.getUTCDay() + 6) % 7

  const grid: { ymd: string, day: number, inMonth: boolean, disabled: boolean }[] = []

  for (let i = 0; i < offset; i += 1) {
    const d = new Date(Date.UTC(year, month, 1 - (offset - i)))
    const ymd = getYmdInTimeZone(d, timeZone)
    grid.push({ ymd, day: d.getUTCDate(), inMonth: false, disabled: true })
  }

  for (let day = 1; day <= last.getUTCDate(); day += 1) {
    const d = new Date(Date.UTC(year, month, day))
    const ymd = getYmdInTimeZone(d, timeZone)
    const isPast = ymd < props.minDate
    const hasAvailability = props.availableDates.has(ymd)
    grid.push({ ymd, day, inMonth: true, disabled: isPast || !hasAvailability })
  }

  while (grid.length % 7 !== 0) {
    const tailIndex = grid.length - (offset + last.getUTCDate())
    const d = new Date(Date.UTC(year, month + 1, tailIndex + 1))
    const ymd = getYmdInTimeZone(d, timeZone)
    grid.push({ ymd, day: d.getUTCDate(), inMonth: false, disabled: true })
  }

  return grid
})

const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const canGoPrev = computed(() => {
  const prevYear = props.visibleMonth.getUTCFullYear()
  const prevMonth = props.visibleMonth.getUTCMonth() - 1
  const prev = new Date(Date.UTC(prevYear, prevMonth, 1))
  const ymdPrevStart = getYmdInTimeZone(prev, timeZone)
  return ymdPrevStart >= props.minDate
})

function onPrevMonth() {
  if (!canGoPrev.value) return
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() - 1
  emit('update:visibleMonth', new Date(Date.UTC(year, month, 1)))
}

function onNextMonth() {
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() + 1
  emit('update:visibleMonth', new Date(Date.UTC(year, month, 1)))
}

function formatAriaDateLabel(ymd: string): string {
  const [yearStr, monthStr, dayStr] = ymd.split('-')
  if (!yearStr || !monthStr || !dayStr) return ymd

  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ymd

  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}
</script>

<template>
  <section class="grid gap-4">
    <div class="flex items-center justify-between gap-3">
      <div class="grid gap-0.5">
        <h3 class="font-semibold text-[color:var(--color-brand-primary)]">
          {{ monthLabel }}
        </h3>
        <p class="text-xs text-[color:var(--color-brand-secondary)]">
          Horaires affichés : {{ timezoneLabel }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canGoPrev || isLoading"
          aria-label="Mois précédent"
          @click="onPrevMonth"
        >
          <Icon
            name="lucide:chevron-left"
            size="18"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isLoading"
          aria-label="Mois suivant"
          @click="onNextMonth"
        >
          <Icon
            name="lucide:chevron-right"
            size="18"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[color:var(--color-brand-secondary)]">
      <span
        v-for="(label, index) in weekdayLabels"
        :key="index"
        class="py-1"
        aria-hidden="true"
      >
        {{ label }}
      </span>
    </div>

    <div
      class="grid grid-cols-7 gap-2"
      role="grid"
      aria-label="Calendrier des disponibilités"
    >
      <button
        v-for="d in days"
        :key="d.ymd"
        type="button"
        class="h-11 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(200,121,100,0.2)]"
        :class="
          !d.inMonth
            ? 'text-transparent'
            : d.disabled
              ? 'cursor-not-allowed bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-secondary)] opacity-40'
              : modelValue === d.ymd
                ? 'bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)]'
                : 'bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-surface-highlight)]'
        "
        :disabled="d.disabled || isLoading"
        role="gridcell"
        :aria-current="modelValue === d.ymd ? 'date' : undefined"
        :aria-label="d.inMonth ? formatAriaDateLabel(d.ymd) : undefined"
        @click="emit('update:modelValue', d.ymd)"
      >
        {{ d.day }}
      </button>
    </div>
  </section>
</template>
