<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
  visibleMonth: Date
  availableDates: Set<string>
  minDate: string
  maxDate: string
  timezoneLabel: string
  timeZone?: string
  isLoading?: boolean
  allowUnavailableSelection?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'update:visibleMonth': [value: Date]
}>()

function formatMonthLabel(date: Date, timeZone: string): string {
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

const timeZone = computed(() => props.timeZone ?? 'Europe/Paris')

const monthLabel = computed(() => formatMonthLabel(props.visibleMonth, timeZone.value))

const days = computed(() => {
  const resolvedTimeZone = timeZone.value
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))

  const offset = (first.getUTCDay() + 6) % 7

  const grid: { ymd: string, day: number, inMonth: boolean, disabled: boolean }[] = []

  for (let i = 0; i < offset; i += 1) {
    const d = new Date(Date.UTC(year, month, 1 - (offset - i)))
    const ymd = getYmdInTimeZone(d, resolvedTimeZone)
    grid.push({ ymd, day: d.getUTCDate(), inMonth: false, disabled: true })
  }

  for (let day = 1; day <= last.getUTCDate(); day += 1) {
    const d = new Date(Date.UTC(year, month, day))
    const ymd = getYmdInTimeZone(d, resolvedTimeZone)
    const isBeforeWindow = ymd < props.minDate
    const isAfterWindow = ymd > props.maxDate
    const hasAvailability = props.availableDates.has(ymd)
    grid.push({
      ymd,
      day,
      inMonth: true,
      disabled: isBeforeWindow || isAfterWindow || (!hasAvailability && !props.allowUnavailableSelection)
    })
  }

  while (grid.length % 7 !== 0) {
    const tailIndex = grid.length - (offset + last.getUTCDate())
    const d = new Date(Date.UTC(year, month + 1, tailIndex + 1))
    const ymd = getYmdInTimeZone(d, resolvedTimeZone)
    grid.push({ ymd, day: d.getUTCDate(), inMonth: false, disabled: true })
  }

  return grid
})

const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const canGoPrev = computed(() => {
  const resolvedTimeZone = timeZone.value
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() - 1
  const prevEnd = new Date(Date.UTC(year, month + 1, 0))
  const ymdPrevEnd = getYmdInTimeZone(prevEnd, resolvedTimeZone)
  return ymdPrevEnd >= props.minDate
})

function onPrevMonth() {
  if (!canGoPrev.value) return
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() - 1
  emit('update:visibleMonth', new Date(Date.UTC(year, month, 1)))
}

const canGoNext = computed(() => {
  const resolvedTimeZone = timeZone.value
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() + 1
  const nextStart = new Date(Date.UTC(year, month, 1))
  const ymdNextStart = getYmdInTimeZone(nextStart, resolvedTimeZone)
  return ymdNextStart <= props.maxDate
})

function onNextMonth() {
  if (!canGoNext.value) return
  const year = props.visibleMonth.getUTCFullYear()
  const month = props.visibleMonth.getUTCMonth() + 1
  emit('update:visibleMonth', new Date(Date.UTC(year, month, 1)))
}

function formatAriaDateLabel(ymd: string): string {
  const resolvedTimeZone = timeZone.value
  const [yearStr, monthStr, dayStr] = ymd.split('-')
  if (!yearStr || !monthStr || !dayStr) return ymd

  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ymd

  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: resolvedTimeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}
</script>

<template>
  <section class="grid gap-4 sm:min-w-[340px] lg:min-w-[400px]">
    <div class="flex items-center justify-between gap-3">
      <div class="grid gap-0.5">
        <h3 class="text-lg font-semibold capitalize text-neutral-900 sm:text-xl">
          {{ monthLabel }}
        </h3>
        <p class="text-xs text-neutral-500">
          {{ timezoneLabel }}
        </p>
      </div>

      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          color="neutral"
          size="md"
          icon="i-lucide-chevron-left"
          :disabled="!canGoPrev || isLoading"
          aria-label="Mois précédent"
          @click="onPrevMonth"
        />
        <UButton
          variant="ghost"
          color="neutral"
          size="md"
          icon="i-lucide-chevron-right"
          :disabled="!canGoNext || isLoading"
          aria-label="Mois suivant"
          @click="onNextMonth"
        />
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-neutral-500 sm:gap-2">
      <span
        v-for="(label, index) in weekdayLabels"
        :key="index"
        class="py-2 sm:py-2.5 sm:text-sm"
        aria-hidden="true"
      >
        {{ label }}
      </span>
    </div>

    <div
      class="grid grid-cols-7 gap-1.5 sm:gap-2"
      role="grid"
      aria-label="Calendrier des disponibilités"
    >
      <button
        v-for="d in days"
        :key="d.ymd"
        type="button"
        class="flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 sm:text-base"
        :class="[
          !d.inMonth
            ? 'pointer-events-none text-transparent'
            : d.disabled
              ? 'cursor-not-allowed text-neutral-300'
              : modelValue === d.ymd
                ? 'bg-crepuscule-600 text-white shadow-md ring-2 ring-crepuscule-600/20'
                : availableDates.has(d.ymd)
                  ? 'bg-crepuscule-50 text-crepuscule-700 hover:bg-crepuscule-100 hover:shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-100'
        ]"
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
