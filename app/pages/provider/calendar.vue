<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import ProviderCalendarDisplayOptions from '../../components/organisms/ProviderCalendarDisplayOptions.vue'
import ProviderCalendarTopBar from '../../components/organisms/ProviderCalendarTopBar.vue'
import ProviderCalendarMonthView from '../../components/organisms/ProviderCalendarMonthView.vue'
import ProviderCalendarWeekView from '../../components/organisms/ProviderCalendarWeekView.vue'
import { useProviderCalendar } from '../../features/calendar/useProviderCalendar'
import type { ProviderAppointmentListItem, ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
import { buildDay, buildWeekDays } from '../../features/calendar/domain/range'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Calendrier'
})

const noticeMessage = ref<string | null>(null)
const toast = useToast()

const calendar = await useProviderCalendar()

type DisplayTypeFilter = 'all' | ProviderCalendarAppointmentType

const displayTypeFilter = ref<DisplayTypeFilter>('all')
const selectedAppointment = ref<ProviderAppointmentListItem | null>(null)

const visibleAppointments = computed(() => {
  if (displayTypeFilter.value === 'all') return calendar.sortedAppointments.value
  return calendar.sortedAppointments.value.filter(appointment => appointment.type === displayTypeFilter.value)
})

function setDisplayTypeFilter(value: DisplayTypeFilter) {
  displayTypeFilter.value = value
}

function onCreateAppointment() {
  noticeMessage.value = 'La création manuelle de rendez-vous arrive dans le prochain ticket (Feature L).'
}

async function onRetry() {
  noticeMessage.value = null
  await calendar.refresh({ revalidate: true })
}

function onSelectAppointment(appointment: ProviderAppointmentListItem) {
  selectedAppointment.value = appointment
  noticeMessage.value = 'Le drawer de détail arrive au ticket L13-a (ouvrez/éditez/annulez depuis la fiche).'
}

function onSelectEmpty() {
  noticeMessage.value = 'Le modal de création arrive au ticket L13-b.'
}

function onSelectMonthDay() {
  noticeMessage.value = 'Le modal de création arrive au ticket L13-b (heure obligatoire en vue mois).'
}

const isEmpty = computed(() => visibleAppointments.value.length === 0 && !calendar.pending.value && !calendar.errorMessage.value)

const weekDays = computed(() => buildWeekDays(calendar.anchorDate.value, calendar.timeZone.value))
const dayDays = computed(() => [buildDay(calendar.anchorDate.value, calendar.timeZone.value)])

const weekRangeLabel = computed(() => {
  if (calendar.view.value !== 'week') return null
  const days = weekDays.value
  if (days.length === 0) return null

  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: calendar.timeZone.value,
    day: '2-digit',
    month: 'short'
  })
  const start = formatter.format(days[0]!.date)
  const end = formatter.format(days[days.length - 1]!.date)
  return `${start} → ${end}`
})

const dayLabel = computed(() => {
  if (calendar.view.value !== 'day') return null
  const day = dayDays.value[0]
  return day?.label ?? null
})

const monthLabel = computed(() => {
  if (calendar.view.value !== 'month') return null
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: calendar.timeZone.value,
    month: 'long',
    year: 'numeric'
  })
  return formatter.format(calendar.anchorDate.value)
})

watch(
  () => displayTypeFilter.value,
  (next) => {
    const selected = selectedAppointment.value
    if (!selected) return
    if (next === 'all') return
    if (selected.type === next) return

    selectedAppointment.value = null
    toast.add({
      title: 'Filtre actif',
      description: 'Rendez-vous masqués — ajustez le filtre pour les afficher.',
      color: 'primary'
    })
  }
)
</script>

<template>
  <div class="grid gap-10">
    <ProviderCalendarTopBar
      :view="calendar.view.value"
      :is-loading="calendar.pending.value"
      @prev="calendar.goPrev"
      @today="calendar.goToday"
      @next="calendar.goNext"
      @update:view="calendar.setView"
    >
      <template #right>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <span
            v-if="weekRangeLabel || dayLabel || monthLabel"
            class="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.7)]"
          >
            {{ weekRangeLabel ?? dayLabel ?? monthLabel }}
          </span>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="calendar.pending.value"
            @click="onRetry"
          >
            <Icon
              name="lucide:refresh-ccw"
              size="18"
              aria-hidden="true"
            />
            Actualiser
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="calendar.pending.value"
            @click="onCreateAppointment"
          >
            <Icon
              name="lucide:plus"
              size="18"
              aria-hidden="true"
            />
            Créer un RDV
          </button>
        </div>
      </template>
    </ProviderCalendarTopBar>

    <ProviderCalendarDisplayOptions
      :type-filter="displayTypeFilter"
      :disabled="calendar.pending.value"
      @update:type-filter="setDisplayTypeFilter"
    />

    <SystemAlert
      v-if="noticeMessage"
      variant="info"
      :description="noticeMessage"
    />

    <SystemAlert
      v-if="calendar.errorMessage.value"
      variant="error"
      title="Erreur"
      :description="calendar.errorMessage.value"
    />

    <div
      v-if="calendar.pending.value && !calendar.data.value"
      class="grid gap-6 rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Chargement…
      </p>
      <div class="mt-2 grid gap-4 md:grid-cols-2">
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.45)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.30)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.25)]" />
      </div>
    </div>

    <div
      v-else-if="isEmpty"
      class="rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Cette semaine
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        Aucun RDV sur cette période. (Fuseau : {{ calendar.timeZone.value }})
      </p>

      <div class="mt-6 rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]">
        La vue calendrier complète (semaine/jour/mois + CRUD) arrive avec la Feature L.
      </div>
    </div>

    <ProviderCalendarWeekView
      v-else-if="calendar.view.value === 'week'"
      :time-zone="calendar.timeZone.value"
      :days="weekDays"
      :appointments="visibleAppointments"
      :px-per-minute="1"
      @select:appointment="onSelectAppointment"
      @select:empty="onSelectEmpty"
    />

    <ProviderCalendarWeekView
      v-else-if="calendar.view.value === 'day'"
      mode="day"
      :time-zone="calendar.timeZone.value"
      :days="dayDays"
      :appointments="visibleAppointments"
      :px-per-minute="1"
      @select:appointment="onSelectAppointment"
      @select:empty="onSelectEmpty"
    />

    <ProviderCalendarMonthView
      v-else-if="calendar.view.value === 'month'"
      :time-zone="calendar.timeZone.value"
      :anchor-date="calendar.anchorDate.value"
      :appointments="visibleAppointments"
      @select:appointment="onSelectAppointment"
      @select:day="onSelectMonthDay"
    />

    <div
      v-else
      class="rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Vue {{ calendar.view.value === 'month' ? 'mois' : 'jour' }}
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        Cette vue arrive avec les tickets suivants (L12-b / L12-c). La navigation recalcule déjà la plage et refetch.
      </p>
      <div class="mt-6 rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]">
        {{ calendar.sortedAppointments.value.length }} rendez-vous chargés sur la plage courante.
      </div>
    </div>
  </div>
</template>
