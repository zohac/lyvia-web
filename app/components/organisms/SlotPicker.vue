<script setup lang="ts">
import type { TimeSlot } from '../../features/slots/domain/slots'
import { getYmdInTimeZone, groupSlotsByLocalDay } from '../../features/slots/domain/slots'
import CalendarMonthView from '../molecules/CalendarMonthView.vue'
import TimeSlotGrid from '../molecules/TimeSlotGrid.vue'

const props = withDefaults(
  defineProps<{
    slots: TimeSlot[]
    selectedStartAt?: string | null
    timeZone?: string
    timezoneLabel?: string
    isLoading?: boolean
    error?: string | null
    minDate?: string
    maxDate?: string
    allowUnavailableSelection?: boolean
    date?: string | null
    visibleMonth?: Date
  }>(),
  {
    selectedStartAt: null,
    timeZone: 'Europe/Paris',
    timezoneLabel: 'Europe/Paris',
    isLoading: false,
    error: null,
    minDate: undefined,
    maxDate: undefined,
    allowUnavailableSelection: false,
    date: null,
    visibleMonth: undefined
  }
)

const emit = defineEmits<{
  'select': [slot: TimeSlot]
  'update:selectedStartAt': [value: string | null]
  'update:date': [value: string | null]
  'update:visibleMonth': [value: Date]
}>()

function safeYmdFromLocal(date: Date, timeZone: string): string {
  return getYmdInTimeZone(date, timeZone)
}

function parseYmdToUtcMidday(ymd: string): Date | null {
  const [yearStr, monthStr, dayStr] = ymd.split('-')
  if (!yearStr || !monthStr || !dayStr) return null

  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null

  return new Date(Date.UTC(year, month - 1, day, 12))
}

const dayGroups = computed(() => groupSlotsByLocalDay(props.slots, props.timeZone))

const availableDates = computed(() => new Set(dayGroups.value.map(group => group.key)))

const resolvedMinDate = computed(() => {
  if (props.minDate) return props.minDate
  if (dayGroups.value.length > 0) return dayGroups.value[0]!.key
  return safeYmdFromLocal(new Date(), props.timeZone)
})

const resolvedMaxDate = computed(() => {
  if (props.maxDate) return props.maxDate
  if (dayGroups.value.length > 0) return dayGroups.value[dayGroups.value.length - 1]!.key
  return safeYmdFromLocal(new Date(), props.timeZone)
})

const internalSelectedDate = ref<string | null>(props.date)
const selectedDate = computed<string | null>({
  get: () => props.date ?? internalSelectedDate.value,
  set: (value) => {
    internalSelectedDate.value = value
    emit('update:date', value)
  }
})

function buildVisibleMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function buildInitialVisibleMonth(): Date {
  const baseYmd = selectedDate.value ?? resolvedMinDate.value
  const base = parseYmdToUtcMidday(baseYmd) ?? new Date()
  return buildVisibleMonth(base)
}

const internalVisibleMonth = ref<Date>(buildInitialVisibleMonth())

const visibleMonth = computed<Date>({
  get: () => props.visibleMonth ?? internalVisibleMonth.value,
  set: (value) => {
    internalVisibleMonth.value = value
    emit('update:visibleMonth', value)
  }
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return null
  const date = parseYmdToUtcMidday(selectedDate.value)
  if (!date) return null
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date)
})

const selectedDaySlots = computed(() => {
  const key = selectedDate.value
  if (!key) return []
  const group = dayGroups.value.find(item => item.key === key)
  return group?.slots ?? []
})

function ensureDefaultSelectedDate() {
  if (selectedDate.value && (props.allowUnavailableSelection || availableDates.value.has(selectedDate.value))) {
    return
  }

  if (dayGroups.value.length > 0) {
    selectedDate.value = dayGroups.value[0]!.key
    return
  }

  selectedDate.value = resolvedMinDate.value
}

watchEffect(() => {
  ensureDefaultSelectedDate()
})

watch(
  () => props.selectedStartAt,
  (value) => {
    if (!value) return
    const slot = props.slots.find(item => item.startAt === value)
    if (!slot) return
    selectedDate.value = getYmdInTimeZone(new Date(slot.startAt), props.timeZone)
  },
  { immediate: true }
)

watch(
  selectedDate,
  (value) => {
    if (!value) return
    const date = parseYmdToUtcMidday(value)
    if (!date) return
    const month = buildVisibleMonth(date)
    if (month.getTime() === visibleMonth.value.getTime()) return
    visibleMonth.value = month
  },
  { immediate: true }
)

function onSelectSlot(slot: TimeSlot) {
  emit('update:selectedStartAt', slot.startAt)
  emit('select', slot)
}
</script>

<template>
  <section class="grid gap-6">
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Créneaux indisponibles"
      :description="error"
      icon="i-lucide-alert-circle"
    />

    <div
      v-if="isLoading && slots.length === 0"
      class="grid gap-4"
      role="status"
      aria-live="polite"
    >
      <USkeleton class="h-72 w-full rounded-xl" />
      <USkeleton class="h-44 w-full rounded-xl" />
    </div>

    <div
      v-else-if="slots.length === 0"
      class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500"
      role="status"
      aria-live="polite"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="mx-auto mb-2 size-8 text-neutral-400"
      />
      <p>Aucun créneau disponible pour le moment.</p>
    </div>

    <div
      v-else
      class="grid gap-6 md:grid-cols-[1fr_240px] md:items-start lg:grid-cols-[1fr_280px]"
    >
      <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <CalendarMonthView
          v-model="selectedDate"
          v-model:visible-month="visibleMonth"
          :available-dates="availableDates"
          :min-date="resolvedMinDate"
          :max-date="resolvedMaxDate"
          :timezone-label="timezoneLabel"
          :is-loading="isLoading"
          :allow-unavailable-selection="allowUnavailableSelection"
          :time-zone="timeZone"
        />
      </div>

      <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <TimeSlotGrid
          :title="selectedDateLabel ? `${selectedDateLabel}` : 'Sélectionnez un jour'"
          :slots="selectedDaySlots"
          :selected-start-at="selectedStartAt"
          :time-zone="timeZone"
          @select="onSelectSlot"
        />
      </div>
    </div>
  </section>
</template>
