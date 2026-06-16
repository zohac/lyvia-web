<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import type { CalendarWeekDay } from '../../features/calendar/domain/range'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { getTimeEventStyle, getStatusDotStyle, getAppointmentNameClass } from '../../features/calendar/presentation/appointment-style'
import type { ConsultationPricePlanById } from '../../features/calendar/presentation/appointment-pricing'
import { formatConsultationChipLabel } from '../../features/calendar/presentation/appointment-pricing'

const emit = defineEmits<{
  (e: 'select:appointment', appointment: ProviderAppointmentListItem): void
  (e: 'select:empty', payload: { dayKey: string, minutes: number }): void
}>()

const props = withDefaults(
  defineProps<{
    timeZone: string
    days: CalendarWeekDay[]
    appointments: ProviderAppointmentListItem[]
    consultationPricePlansById?: ConsultationPricePlanById
    highlight?: {
      dayKey: string
      startMinutes: number
      endMinutes: number
      appointmentId: string | null
      autoScroll: boolean
    } | null
    /**
     * Pixels per minute in the grid.
     */
    pxPerMinute?: number
    mode?: 'week' | 'day'
  }>(),
  {
    consultationPricePlansById: () => ({}),
    highlight: null,
    pxPerMinute: 1,
    mode: 'week'
  }
)

const scrollRef = ref<HTMLDivElement | null>(null)
const headerRef = ref<HTMLDivElement | null>(null)

const gridStyle = computed(() => ({
  gridTemplateColumns: `88px repeat(${Math.max(1, props.days.length)}, minmax(0, 1fr))`
}))

function getZonedHourMinute(
  date: Date,
  timeZone: string,
  options: { allow24Hour?: boolean } = {}
): { hour: number, minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  const rawHour = map.hour ?? '0'
  const parsedHour = Number(rawHour)
  const hour = rawHour === '24' && options.allow24Hour ? 24 : parsedHour
  const minute = Number(map.minute ?? '0')
  return { hour: Number.isFinite(hour) ? hour : 0, minute: Number.isFinite(minute) ? minute : 0 }
}

function minutesSinceStartOfDay(iso: string, options: { allow24Hour?: boolean } = {}): number {
  const date = new Date(iso)
  const { hour, minute } = getZonedHourMinute(date, props.timeZone, options)
  const clampedHour = hour === 24 && minute === 0 ? 24 : hour % 24
  const total = clampedHour * 60 + minute
  return Math.min(24 * 60, Math.max(0, total))
}

function formatTimeRange(appointment: ProviderAppointmentListItem): string {
  const start = getZonedHourMinute(new Date(appointment.startAt), props.timeZone)
  const end = getZonedHourMinute(new Date(appointment.endAt), props.timeZone, { allow24Hour: true })
  const pad = (value: number) => String(value).padStart(2, '0')
  const startHour = start.hour % 24
  const endHour = end.hour % 24
  return `${pad(startHour)}:${pad(start.minute)}–${pad(endHour)}:${pad(end.minute)}`
}

function timeEventStyle(appointment: ProviderAppointmentListItem) {
  return getTimeEventStyle(appointment)
}

function statusDotStyle(appointment: ProviderAppointmentListItem) {
  return getStatusDotStyle(appointment)
}

function eventNameClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentNameClass(appointment)
}

const todayKey = computed(() => getYmdInTimeZone(new Date(), props.timeZone))

function dayWeekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: props.timeZone, weekday: 'short' })
    .format(date)
    .replace('.', '')
}

function dayNumberLabel(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: props.timeZone, day: 'numeric' }).format(date)
}

const nowOffsetMinutes = computed(() => {
  const { hour, minute } = getZonedHourMinute(new Date(), props.timeZone)
  return hour * 60 + minute
})

function eventLabel(appointment: ProviderAppointmentListItem): string {
  return formatConsultationChipLabel(appointment, props.consultationPricePlansById)
}

const rows = computed(() => Array.from({ length: 24 }, (_, idx) => idx))

const appointmentsByDayKey = computed(() => {
  const byKey = new Map<string, ProviderAppointmentListItem[]>()
  for (const item of props.appointments) {
    const key = getYmdInTimeZone(new Date(item.startAt), props.timeZone)
    const list = byKey.get(key) ?? []
    list.push(item)
    byKey.set(key, list)
  }
  for (const list of byKey.values()) {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }
  return byKey
})

function scrollToDefaultWindow() {
  const el = scrollRef.value
  if (!el) return
  const centerMinute = 13 * 60
  const headerH = headerRef.value?.offsetHeight ?? 0
  const target = headerH + centerMinute * props.pxPerMinute - el.clientHeight / 2
  el.scrollTop = Math.max(0, target)
}

function scrollToHighlight() {
  const highlight = props.highlight
  if (!highlight?.autoScroll) return
  const scrollEl = scrollRef.value
  if (!scrollEl) return

  const center = (highlight.startMinutes + highlight.endMinutes) / 2
  const headerH = headerRef.value?.offsetHeight ?? 0
  const centerPx = headerH + center * props.pxPerMinute
  const viewportStart = scrollEl.scrollTop
  const viewportEnd = viewportStart + scrollEl.clientHeight

  if (centerPx >= viewportStart && centerPx <= viewportEnd) return

  scrollEl.scrollTop = Math.max(0, centerPx - scrollEl.clientHeight / 2)
}

function onEmptyClick(event: MouseEvent, dayKey: string) {
  const scrollEl = scrollRef.value
  if (!scrollEl) return

  const rect = scrollEl.getBoundingClientRect()
  const headerH = headerRef.value?.offsetHeight ?? 0
  const y = event.clientY - rect.top + scrollEl.scrollTop - headerH
  const minutes = Math.min(23 * 60 + 59, Math.max(0, Math.round(y / props.pxPerMinute)))
  // Snap to 15 min for nicer UX.
  const snapped = Math.round(minutes / 15) * 15
  // Avoid 24:00 overflow.
  const safe = Math.min(23 * 60 + 45, Math.max(0, snapped))
  emit('select:empty', { dayKey, minutes: safe })
}

onMounted(() => {
  scrollToDefaultWindow()
  scrollToHighlight()
})

watch(
  () => props.highlight,
  () => {
    scrollToHighlight()
  }
)
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] shadow-sm">
    <div
      ref="scrollRef"
      class="relative max-h-[640px] overflow-auto"
    >
      <div
        ref="headerRef"
        class="sticky top-0 z-20 grid border-b border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]"
        :style="gridStyle"
      >
        <div class="px-4 py-3" />
        <div
          v-for="day in days"
          :key="day.key"
          class="border-l border-[color:var(--color-brand-subtle)] px-3 py-2 text-center"
        >
          <div
            class="text-[11px] font-bold uppercase tracking-wider"
            :class="day.key === todayKey ? 'text-[color:var(--color-brand-primary)]' : 'text-[color:var(--color-text-muted)]'"
          >
            {{ dayWeekdayLabel(day.date) }}
          </div>
          <div
            class="mx-auto mt-1 grid size-7 place-items-center rounded-full text-sm font-semibold"
            :class="day.key === todayKey
              ? 'bg-[color:var(--color-brand-primary)] text-white'
              : 'text-[color:var(--color-text-primary)]'"
          >
            {{ dayNumberLabel(day.date) }}
          </div>
        </div>
      </div>

      <div
        class="grid"
        :style="gridStyle"
      >
        <div class="relative border-r border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)]/50">
          <div
            v-for="hour in rows"
            :key="hour"
            class="relative h-[calc(var(--ppm)_*_60px)] border-b border-[color:var(--color-brand-subtle)] px-4 py-2 text-xs font-medium text-[color:var(--color-text-muted)]"
            :style="{ '--ppm': String(pxPerMinute) }"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </div>
        </div>

        <div
          v-for="day in days"
          :key="day.key"
          class="relative border-r border-[color:var(--color-brand-subtle)] last:border-r-0"
          :class="day.key === todayKey ? 'bg-[color:var(--color-surface-highlight)]' : ''"
        >
          <button
            type="button"
            class="absolute inset-0 z-0 w-full cursor-pointer bg-transparent text-left"
            @click="onEmptyClick($event, day.key)"
          >
            <span class="sr-only">Créer un rendez-vous</span>
          </button>

          <div
            v-for="hour in rows"
            :key="`${day.key}:${hour}`"
            class="h-[calc(var(--ppm)_*_60px)] border-b border-[color:var(--color-neutral-100)]"
            :style="{ '--ppm': String(pxPerMinute) }"
          />

          <div
            v-if="day.key === todayKey"
            class="pointer-events-none absolute inset-x-0 z-[6]"
            :style="{ top: `${nowOffsetMinutes * pxPerMinute}px` }"
            aria-hidden="true"
          >
            <span class="absolute -left-1 -top-1 size-2 rounded-full bg-[color:var(--color-error-500)]" />
            <span class="block border-t-2 border-[color:var(--color-error-500)]" />
          </div>

          <div
            v-if="highlight && highlight.dayKey === day.key"
            class="pointer-events-none absolute left-2 right-2 z-[5] rounded-lg bg-[color:var(--color-sunset-50)] ring-2 ring-[color:var(--color-sunset-400)] shadow-sm animate-pulse"
            :style="{
              top: `${highlight.startMinutes * pxPerMinute}px`,
              height: `${Math.max(24, (highlight.endMinutes - highlight.startMinutes) * pxPerMinute)}px`
            }"
            aria-hidden="true"
          />

          <div
            v-for="appointment in appointmentsByDayKey.get(day.key) ?? []"
            :key="appointment.id"
            class="absolute left-2 right-2 z-10"
            :style="{
              top: `${minutesSinceStartOfDay(appointment.startAt) * pxPerMinute}px`,
              height: `${Math.max(
                24,
                (minutesSinceStartOfDay(appointment.endAt, { allow24Hour: true }) - minutesSinceStartOfDay(appointment.startAt)) * pxPerMinute
              )}px`
            }"
          >
            <button
              type="button"
              class="relative h-full w-full overflow-hidden rounded-[7px] px-2.5 py-1.5 text-left text-xs font-bold transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
              :style="timeEventStyle(appointment)"
              :class="highlight?.appointmentId === appointment.id ? 'ring-2 ring-[color:var(--color-sunset-400)] animate-pulse' : ''"
              @click.stop="emit('select:appointment', appointment)"
            >
              <span
                class="absolute right-1.5 top-1.5 size-2 rounded-full"
                :style="statusDotStyle(appointment)"
                aria-hidden="true"
              />
              <div
                class="truncate pr-3 text-[11px] font-bold leading-tight"
                :class="eventNameClass(appointment)"
              >
                {{ formatTimeRange(appointment) }}
              </div>
              <div
                class="mt-0.5 truncate text-[11px] font-medium opacity-90"
                :class="eventNameClass(appointment)"
              >
                {{ eventLabel(appointment) }} · {{ appointment.firstname }} {{ appointment.lastname }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
