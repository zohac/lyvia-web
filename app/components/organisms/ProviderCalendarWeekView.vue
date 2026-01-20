<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import type { CalendarWeekDay } from '../../features/calendar/domain/range'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { getAppointmentAccentClass, getAppointmentMetaClass, getAppointmentNameClass } from '../../features/calendar/presentation/appointment-style'
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

const gridStyle = computed(() => ({
  gridTemplateColumns: `88px repeat(${Math.max(1, props.days.length)}, minmax(0, 1fr))`
}))

const modeLabel = computed(() => (props.mode === 'day' ? 'Vue jour' : 'Vue semaine'))

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

function eventAccentClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentAccentClass(appointment)
}

function eventMetaClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentMetaClass(appointment)
}

function eventNameClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentNameClass(appointment)
}

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
  const target = centerMinute * props.pxPerMinute - el.clientHeight / 2
  el.scrollTop = Math.max(0, target)
}

function scrollToHighlight() {
  const highlight = props.highlight
  if (!highlight?.autoScroll) return
  const scrollEl = scrollRef.value
  if (!scrollEl) return

  const center = (highlight.startMinutes + highlight.endMinutes) / 2
  const centerPx = center * props.pxPerMinute
  const viewportStart = scrollEl.scrollTop
  const viewportEnd = viewportStart + scrollEl.clientHeight

  if (centerPx >= viewportStart && centerPx <= viewportEnd) return

  scrollEl.scrollTop = Math.max(0, centerPx - scrollEl.clientHeight / 2)
}

function onEmptyClick(event: MouseEvent, dayKey: string) {
  const scrollEl = scrollRef.value
  if (!scrollEl) return

  const rect = scrollEl.getBoundingClientRect()
  const y = event.clientY - rect.top + scrollEl.scrollTop
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
  <section class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div class="grid gap-1">
        <p class="text-xs font-bold uppercase tracking-wider text-stone-500">
          {{ modeLabel }}
        </p>
        <p class="text-sm text-stone-500">
          Fuseau : {{ timeZone }}
        </p>
      </div>
      <div class="hidden items-center gap-2 text-xs text-stone-500 md:flex">
        <span
          class="inline-flex size-2 rounded-full bg-amber-500"
          aria-hidden="true"
        />
        <span>Discovery</span>
        <span
          class="ml-3 inline-flex size-2 rounded-full bg-crepuscule-500"
          aria-hidden="true"
        />
        <span>Consultation</span>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div
        class="grid border-b border-stone-200 bg-stone-50"
        :style="gridStyle"
      >
        <div class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
          Heure
        </div>
        <div
          v-for="day in days"
          :key="day.key"
          class="px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-800"
        >
          {{ day.label }}
        </div>
      </div>

      <div
        ref="scrollRef"
        class="relative max-h-[560px] overflow-auto"
      >
        <div
          class="grid"
          :style="gridStyle"
        >
          <div class="relative border-r border-stone-200 bg-stone-50/50">
            <div
              v-for="hour in rows"
              :key="hour"
              class="relative h-[calc(var(--ppm)_*_60px)] border-b border-stone-200 px-4 py-2 text-xs font-medium text-stone-500"
              :style="{ '--ppm': String(pxPerMinute) }"
            >
              {{ String(hour).padStart(2, '0') }}:00
            </div>
          </div>

          <div
            v-for="day in days"
            :key="day.key"
            class="relative border-r border-stone-200 last:border-r-0"
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
              class="h-[calc(var(--ppm)_*_60px)] border-b border-stone-100"
              :style="{ '--ppm': String(pxPerMinute) }"
            />

            <div
              v-if="highlight && highlight.dayKey === day.key"
              class="pointer-events-none absolute left-2 right-2 z-[5] rounded-lg bg-amber-500/10 ring-2 ring-amber-400 shadow-sm animate-pulse"
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
                class="h-full w-full overflow-hidden rounded-lg px-3 py-2 text-left text-xs font-bold shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
                :class="[
                  eventAccentClass(appointment),
                  eventMetaClass(appointment),
                  highlight?.appointmentId === appointment.id ? 'ring-2 ring-amber-400 animate-pulse' : ''
                ]"
                @click.stop="emit('select:appointment', appointment)"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate">
                    {{ eventLabel(appointment) }}
                  </span>
                  <span class="shrink-0 opacity-90">{{ formatTimeRange(appointment) }}</span>
                </div>
                <div
                  class="mt-1 text-[11px] font-medium opacity-90"
                  :class="eventNameClass(appointment)"
                >
                  {{ appointment.firstname }} {{ appointment.lastname }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
