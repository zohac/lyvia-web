<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import type { CalendarMonthCell } from '../../features/calendar/domain/range'
import { buildMonthGrid } from '../../features/calendar/domain/range'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'
import type { ConsultationPricePlanById } from '../../features/calendar/presentation/appointment-pricing'
import { formatConsultationChipLabel } from '../../features/calendar/presentation/appointment-pricing'

const emit = defineEmits<{
  (e: 'select:appointment', appointment: ProviderAppointmentListItem): void
  (e: 'select:day', payload: { dayKey: string }): void
}>()

const props = defineProps<{
  timeZone: string
  anchorDate: Date
  appointments: ProviderAppointmentListItem[]
  consultationPricePlansById?: ConsultationPricePlanById
  highlight?: { dayKey: string, appointmentId: string | null } | null
}>()

const monthCells = computed<CalendarMonthCell[]>(() => buildMonthGrid(props.anchorDate, props.timeZone))

const appointmentsByDayKey = computed(() => {
  const map = new Map<string, ProviderAppointmentListItem[]>()
  for (const appointment of props.appointments) {
    const key = getYmdInTimeZone(new Date(appointment.startAt), props.timeZone)
    const list = map.get(key) ?? []
    list.push(appointment)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }
  return map
})

const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: props.timeZone, weekday: 'short' })
  const monday = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)) // 2024-01-01 is Monday
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(monday.getTime() + idx * 24 * 60 * 60 * 1000)
    return formatter.format(date)
  })
})

const openPopoverDayKey = ref<string | null>(null)

function closePopover() {
  openPopoverDayKey.value = null
}

watch(
  () => props.appointments,
  () => {
    closePopover()
  }
)

function togglePopover(dayKey: string) {
  openPopoverDayKey.value = openPopoverDayKey.value === dayKey ? null : dayKey
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date)
}

function eventAccentClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentAccentClass(appointment)
}

function eventMetaClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentMetaClass(appointment)
}

function appointmentChipLabel(appointment: ProviderAppointmentListItem): string {
  return formatConsultationChipLabel(appointment, props.consultationPricePlansById ?? {})
}

function onSelectAppointment(appointment: ProviderAppointmentListItem) {
  closePopover()
  emit('select:appointment', appointment)
}

function onSelectDay(dayKey: string) {
  closePopover()
  emit('select:day', { dayKey })
}
</script>

<template>
  <section class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div class="grid gap-1">
        <p class="text-xs font-bold uppercase tracking-wider text-stone-500">
          Vue mois
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
      <div class="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
        <div
          v-for="label in weekdayLabels"
          :key="label"
          class="px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-800"
        >
          {{ label }}
        </div>
      </div>

      <div class="grid grid-cols-7">
        <div
          v-for="cell in monthCells"
          :key="cell.key"
          class="relative min-h-[112px] border-b border-r border-stone-100 p-3 last:border-r-0"
          :class="cell.inMonth ? 'bg-white' : 'bg-stone-50 text-stone-500 opacity-70'"
        >
          <div
            v-if="highlight?.dayKey === cell.key"
            class="pointer-events-none absolute inset-2 rounded-lg bg-amber-500/10 ring-2 ring-amber-400 shadow-sm animate-pulse"
            aria-hidden="true"
          />

          <button
            type="button"
            class="absolute inset-0 z-0 w-full cursor-pointer bg-transparent text-left"
            :disabled="!cell.inMonth"
            @click="onSelectDay(cell.key)"
          >
            <span class="sr-only">Créer un rendez-vous</span>
          </button>

          <div class="relative z-10 flex items-start justify-between gap-2">
            <span class="text-xs font-bold text-stone-800">
              {{ cell.dayNumber }}
            </span>

            <UPopover
              v-if="(appointmentsByDayKey.get(cell.key)?.length ?? 0) > 2"
              :open="openPopoverDayKey === cell.key"
              :ui="{
                content: 'w-[280px] rounded-lg border border-stone-200 bg-white p-3 shadow-lg',
                arrow: 'hidden'
              }"
              @update:open="(value: boolean) => (openPopoverDayKey = value ? cell.key : null)"
            >
              <button
                type="button"
                class="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-stone-800 ring-1 ring-stone-200 transition-all hover:bg-stone-50"
                @click.stop="togglePopover(cell.key)"
              >
                +{{ (appointmentsByDayKey.get(cell.key)?.length ?? 0) - 2 }}
              </button>

              <template #content>
                <div class="grid gap-2">
                  <p class="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Rendez-vous
                  </p>
                  <div class="grid gap-2">
                    <button
                      v-for="appointment in appointmentsByDayKey.get(cell.key) ?? []"
                      :key="appointment.id"
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-bold shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
                      :class="[
                        eventAccentClass(appointment),
                        eventMetaClass(appointment),
                        highlight?.appointmentId === appointment.id ? 'ring-2 ring-amber-400 animate-pulse' : ''
                      ]"
                      @click="onSelectAppointment(appointment)"
                    >
                      <span class="truncate">
                        {{ appointment.firstname }} {{ appointment.lastname }}
                      </span>
                      <span class="shrink-0 opacity-90">
                        {{ formatTime(appointment.startAt) }}
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div class="relative z-10 mt-2 grid gap-1">
            <button
              v-for="appointment in (appointmentsByDayKey.get(cell.key) ?? []).slice(0, 2)"
              :key="appointment.id"
              type="button"
              class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-[11px] font-bold shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
              :class="[
                eventAccentClass(appointment),
                eventMetaClass(appointment),
                highlight?.appointmentId === appointment.id ? 'ring-2 ring-amber-400 animate-pulse' : ''
              ]"
              @click.stop="onSelectAppointment(appointment)"
            >
              <span class="truncate">
                {{ formatTime(appointment.startAt) }} · {{ appointment.firstname }}
              </span>
              <span class="max-w-[9rem] truncate text-right text-[11px] font-semibold opacity-90">
                {{ appointmentChipLabel(appointment) }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
