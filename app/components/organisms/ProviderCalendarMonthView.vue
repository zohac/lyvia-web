<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import type { CalendarMonthCell } from '../../features/calendar/domain/range'
import { buildMonthGrid } from '../../features/calendar/domain/range'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { getMonthChipStyle, getAppointmentNameClass } from '../../features/calendar/presentation/appointment-style'
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

const todayKey = computed(() => getYmdInTimeZone(new Date(), props.timeZone))

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

function formatTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date)
}

function chipStyle(appointment: ProviderAppointmentListItem) {
  return getMonthChipStyle(appointment)
}

function nameClass(appointment: ProviderAppointmentListItem): string {
  return getAppointmentNameClass(appointment)
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
  <section class="overflow-hidden rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] shadow-sm">
    <div class="grid grid-cols-7 border-b border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-muted)]">
      <div
        v-for="label in weekdayLabels"
        :key="label"
        class="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]"
      >
        {{ label }}
      </div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="cell in monthCells"
        :key="cell.key"
        class="relative flex min-h-[120px] flex-col overflow-hidden border-b border-r border-[color:var(--color-neutral-100)] p-2 last:border-r-0"
        :class="!cell.inMonth
          ? 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]'
          : cell.key === todayKey
            ? 'bg-[color:var(--color-surface-highlight)]'
            : 'bg-[color:var(--color-surface-card)]'"
      >
        <div
          v-if="highlight?.dayKey === cell.key"
          class="pointer-events-none absolute inset-2 rounded-lg bg-[color:var(--color-sunset-50)] ring-2 ring-[color:var(--color-sunset-400)] shadow-sm animate-pulse"
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

        <div class="relative z-10 flex items-center justify-end">
          <span
            class="grid size-6 place-items-center rounded-full text-xs"
            :class="cell.key === todayKey
              ? 'bg-[color:var(--color-brand-primary)] font-bold text-white'
              : cell.inMonth ? 'font-semibold text-[color:var(--color-text-primary)]' : 'font-medium text-[color:var(--color-text-muted)]'"
          >
            {{ cell.dayNumber }}
          </span>
        </div>

        <div class="relative z-10 mt-1 flex flex-col gap-1">
          <button
            v-for="appointment in (appointmentsByDayKey.get(cell.key) ?? []).slice(0, 3)"
            :key="appointment.id"
            type="button"
            :title="`${formatTime(appointment.startAt)} · ${appointment.firstname} ${appointment.lastname} — ${appointmentChipLabel(appointment)}`"
            class="flex w-full min-w-0 items-center gap-1.5 rounded-[5px] py-0.5 pl-1.5 pr-1 text-left text-[11px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
            :style="chipStyle(appointment)"
            :class="highlight?.appointmentId === appointment.id ? 'ring-2 ring-[color:var(--color-sunset-400)] animate-pulse' : ''"
            @click.stop="onSelectAppointment(appointment)"
          >
            <span class="shrink-0 tabular-nums opacity-80">{{ formatTime(appointment.startAt) }}</span>
            <span
              class="min-w-0 flex-1 truncate"
              :class="nameClass(appointment)"
            >{{ appointment.firstname }}</span>
          </button>

          <UPopover
            v-if="(appointmentsByDayKey.get(cell.key)?.length ?? 0) > 3"
            :open="openPopoverDayKey === cell.key"
            :ui="{
              content: 'w-[280px] rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-3 shadow-lg',
              arrow: 'hidden'
            }"
            @update:open="(value: boolean) => (openPopoverDayKey = value ? cell.key : null)"
          >
            <button
              type="button"
              class="w-full rounded-[5px] px-1.5 py-0.5 text-left text-[11px] font-semibold text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
              @click.stop
            >
              +{{ (appointmentsByDayKey.get(cell.key)?.length ?? 0) - 3 }} de plus
            </button>

            <template #content>
              <div class="grid gap-2">
                <p class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
                  Rendez-vous
                </p>
                <div class="grid gap-1.5">
                  <button
                    v-for="appointment in appointmentsByDayKey.get(cell.key) ?? []"
                    :key="appointment.id"
                    type="button"
                    class="flex w-full min-w-0 items-center justify-between gap-3 rounded-[5px] py-1 pl-1.5 pr-2 text-left text-xs font-semibold transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crepuscule-500"
                    :style="chipStyle(appointment)"
                    @click="onSelectAppointment(appointment)"
                  >
                    <span
                      class="min-w-0 flex-1 truncate"
                      :class="nameClass(appointment)"
                    >{{ appointment.firstname }} {{ appointment.lastname }}</span>
                    <span class="shrink-0 tabular-nums opacity-80">{{ formatTime(appointment.startAt) }}</span>
                  </button>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
    </div>
  </section>
</template>
