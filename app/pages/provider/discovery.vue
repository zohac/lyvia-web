<script setup lang="ts">
import type {
  ConvertDiscoveryToActiveClientResponse,
  DiscoveryAppointmentListItem,
  ListDiscoveryAppointmentsResponse,
  UpdateAppointmentStatusResponse
} from '../../features/appointments/api/appointments.contract'
import { mapAppointmentErrorCodeToUserMessage } from '../../features/appointments/api/appointments-error'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import CalendarMonthView from '../../components/molecules/CalendarMonthView.vue'
import ConfirmActionModal from '../../components/molecules/ConfirmActionModal.vue'
import CallConclusionModal from '../../components/organisms/CallConclusionModal.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Appels discovery'
})

type RangeFilter = 'all' | 'today' | 'next14' | 'past7'

const systemError = ref<string | null>(null)
const conversionNotice = ref<string | null>(null)
const updatingId = ref<string | null>(null)
const conclusionModalOpen = ref(false)
const conclusionError = ref<string | null>(null)
const conclusionTarget = ref<DiscoveryAppointmentListItem | null>(null)

const cancelModalOpen = ref(false)
const cancelError = ref<string | null>(null)
const cancelTarget = ref<DiscoveryAppointmentListItem | null>(null)

watch(
  () => conclusionModalOpen.value,
  (isOpen) => {
    if (isOpen) return
    conclusionTarget.value = null
    conclusionError.value = null
  }
)

watch(
  () => cancelModalOpen.value,
  (isOpen) => {
    if (isOpen) return
    cancelTarget.value = null
    cancelError.value = null
  }
)

const { data, pending, refresh } = await useAsyncData<ListDiscoveryAppointmentsResponse>('provider-discovery-appointments', async () => {
  try {
    return await apiFetch<ListDiscoveryAppointmentsResponse>('/appointments/discovery', {
      method: 'GET'
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      systemError.value = mapAppointmentErrorCodeToUserMessage(err.apiError.code)
      return { timezone: 'Europe/Paris', appointments: [] }
    }
    systemError.value = 'Une erreur est survenue. Veuillez réessayer.'
    return { timezone: 'Europe/Paris', appointments: [] }
  }
})

const timezone = computed(() => data.value?.timezone ?? 'Europe/Paris')

const appointments = computed(() => data.value?.appointments ?? [])

const rangeFilter = ref<RangeFilter>('all')
const searchQuery = ref('')

const selectedDay = ref<string | null>(null)
const isDayFilterActive = ref(false)
const visibleMonth = ref(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)))

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

function ymdFromIso(iso: string): string {
  return getYmdInTimeZone(new Date(iso), timezone.value)
}

const minDate = computed(() => {
  const now = new Date()
  const start = new Date(now)
  start.setUTCDate(start.getUTCDate() - 90)
  return getYmdInTimeZone(start, timezone.value)
})

const maxDate = computed(() => {
  const now = new Date()
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() + 90)
  return getYmdInTimeZone(end, timezone.value)
})

const appointmentDays = computed(() => {
  const days = new Set<string>()
  for (const item of appointments.value) {
    if (item.status !== 'scheduled') continue
    days.add(ymdFromIso(item.scheduledAt))
  }
  return days
})

const todayYmd = computed(() => getYmdInTimeZone(new Date(), timezone.value))

function setVisibleMonthFromYmd(ymd: string) {
  const [yearStr, monthStr] = ymd.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return
  visibleMonth.value = new Date(Date.UTC(year, month - 1, 1))
}

function activateDayFilter(ymd: string | null) {
  if (!ymd) return
  isDayFilterActive.value = true
  selectedDay.value = ymd
  setVisibleMonthFromYmd(ymd)
}

function resetDayFilter() {
  isDayFilterActive.value = false
  selectedDay.value = todayYmd.value
  setVisibleMonthFromYmd(todayYmd.value)
}

watch(
  () => selectedDay.value,
  (ymd) => {
    if (!ymd) return
    setVisibleMonthFromYmd(ymd)
  }
)

watchEffect(() => {
  if (import.meta.server) return
  if (pending.value) return
  if (selectedDay.value) return

  selectedDay.value = todayYmd.value
  setVisibleMonthFromYmd(todayYmd.value)
})

const baseFilteredAppointments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const now = new Date()
  const todayYmdValue = getYmdInTimeZone(now, timezone.value)
  const fourteenDaysFromNow = new Date(now)
  fourteenDaysFromNow.setUTCDate(fourteenDaysFromNow.getUTCDate() + 14)
  const fourteenYmd = getYmdInTimeZone(fourteenDaysFromNow, timezone.value)

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const sevenDaysAgoYmd = getYmdInTimeZone(sevenDaysAgo, timezone.value)

  const items = appointments.value.filter((item) => {
    if (isDayFilterActive.value && selectedDay.value) {
      if (ymdFromIso(item.scheduledAt) !== selectedDay.value) return false
    }

    const ymd = ymdFromIso(item.scheduledAt)
    if (rangeFilter.value === 'today' && ymd !== todayYmdValue) return false
    if (rangeFilter.value === 'next14' && (ymd < todayYmdValue || ymd > fourteenYmd)) return false
    if (rangeFilter.value === 'past7' && (ymd < sevenDaysAgoYmd || ymd > todayYmdValue)) return false

    if (!query) return true
    const fullName = `${item.client.firstname} ${item.client.lastname}`.toLowerCase()
    return (
      fullName.includes(query)
      || item.client.email.toLowerCase().includes(query)
      || item.client.phone.toLowerCase().includes(query)
    )
  })

  return items
})

const upcomingAppointments = computed(() => {
  const now = Date.now()
  return appointments.value
    .filter(item => item.status === 'scheduled' && new Date(item.scheduledAt).getTime() >= now)
    .toSorted((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
})

const countScheduledToday = computed(() => {
  return appointments.value.filter(item => item.status === 'scheduled' && ymdFromIso(item.scheduledAt) === todayYmd.value).length
})

const countCompletedLast7Days = computed(() => {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const minYmd = getYmdInTimeZone(sevenDaysAgo, timezone.value)
  const maxYmd = getYmdInTimeZone(now, timezone.value)
  return appointments.value.filter((item) => {
    if (item.status !== 'completed') return false
    const ymd = ymdFromIso(item.scheduledAt)
    return ymd >= minYmd && ymd <= maxYmd
  }).length
})

const countUpcomingNext14Days = computed(() => {
  const now = new Date()
  const minYmd = getYmdInTimeZone(now, timezone.value)
  const max = new Date(now)
  max.setUTCDate(max.getUTCDate() + 14)
  const maxYmd = getYmdInTimeZone(max, timezone.value)
  return appointments.value.filter((item) => {
    if (item.status !== 'scheduled') return false
    const ymd = ymdFromIso(item.scheduledAt)
    return ymd >= minYmd && ymd <= maxYmd
  }).length
})

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone.value,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function formatShortTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone.value,
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatSelectedDayLabel(ymd: string): string {
  const [yearStr, monthStr, dayStr] = ymd.split('-')
  if (!yearStr || !monthStr || !dayStr) return ymd
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ymd

  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone.value,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date)
}

function formatClientName(item: DiscoveryAppointmentListItem): string {
  return `${item.client.firstname} ${item.client.lastname}`.trim()
}

function clientInitials(item: DiscoveryAppointmentListItem): string {
  const firstname = item.client.firstname?.trim() ?? ''
  const lastname = item.client.lastname?.trim() ?? ''
  const initials = `${firstname.slice(0, 1)}${lastname.slice(0, 1)}`.toUpperCase()
  return initials || 'C'
}

function statusLabel(status: DiscoveryAppointmentListItem['status']): string {
  switch (status) {
    case 'scheduled':
      return 'Planifié'
    case 'completed':
      return 'Terminé'
    case 'cancelled':
      return 'Annulé'
    default:
      return status
  }
}

function isPastScheduledAppointment(item: DiscoveryAppointmentListItem): boolean {
  if (item.status !== 'scheduled') return false
  return new Date(item.scheduledAt).getTime() < Date.now()
}

function appointmentBorderClass(item: DiscoveryAppointmentListItem): string {
  if (isPastScheduledAppointment(item)) return 'border-l-[color:var(--color-warning)]'

  switch (item.status) {
    case 'scheduled':
      return 'border-l-[color:var(--color-brand-solid)]'
    case 'completed':
      return 'border-l-[rgba(181,192,163,0.8)]'
    case 'cancelled':
      return 'border-l-[rgba(239,68,68,0.4)]'
    default:
      return 'border-l-[rgba(231,229,228,0.9)]'
  }
}

function sortByScheduledAtDesc(items: DiscoveryAppointmentListItem[]) {
  return items.toSorted(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  )
}

const scheduledAppointments = computed(() =>
  sortByScheduledAtDesc(baseFilteredAppointments.value.filter(item => item.status === 'scheduled'))
)

const completedAppointments = computed(() =>
  sortByScheduledAtDesc(baseFilteredAppointments.value.filter(item => item.status === 'completed'))
)

const cancelledAppointments = computed(() =>
  sortByScheduledAtDesc(baseFilteredAppointments.value.filter(item => item.status === 'cancelled'))
)

function statusClass(status: DiscoveryAppointmentListItem['status']): string {
  switch (status) {
    case 'scheduled':
      return 'bg-[rgba(212,184,160,0.25)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(212,184,160,0.55)]'
    case 'completed':
      return 'bg-[rgba(181,192,163,0.25)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(181,192,163,0.5)]'
    case 'cancelled':
      return 'bg-[rgba(239,68,68,0.10)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(239,68,68,0.25)]'
    default:
      return 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.7)]'
  }
}

function appointmentStatusClass(item: DiscoveryAppointmentListItem): string {
  if (isPastScheduledAppointment(item)) {
    return 'bg-[rgba(217,119,6,0.12)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(217,119,6,0.25)]'
  }
  return statusClass(item.status)
}

function stageLabel(stage: DiscoveryAppointmentListItem['client']['stage']): string {
  return stage === 'active' ? 'Active' : 'Lead'
}

function stageClass(stage: DiscoveryAppointmentListItem['client']['stage']): string {
  if (stage === 'active') {
    return 'bg-[rgba(181,192,163,0.25)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(181,192,163,0.5)]'
  }
  return 'bg-[rgba(212,184,160,0.20)] text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(212,184,160,0.45)]'
}

async function requestUpdateAppointmentStatus(
  appointmentId: string,
  status: 'completed' | 'cancelled'
): Promise<{ ok: true } | { ok: false, message: string }> {
  const body
    = status === 'completed'
      ? { status: 'completed' as const }
      : { status: 'cancelled' as const, cancelledByRole: 'PROVIDER' as const }

  try {
    await apiFetch<UpdateAppointmentStatusResponse>(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body
    })
    return { ok: true }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'INVALID_STATUS_TRANSITION') {
        await refresh()
        const updatedStatus = data.value?.appointments?.find(a => a.id === appointmentId)?.status
        if (updatedStatus === status) return { ok: true }
      }

      return {
        ok: false,
        message: mapAppointmentErrorCodeToUserMessage(err.apiError.code)
      }
    }
    return { ok: false, message: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}

async function requestConvertDiscoveryLead(
  appointmentId: string,
  conversionNote?: string
): Promise<
  | { ok: true, data: ConvertDiscoveryToActiveClientResponse }
  | { ok: false, message: string }
> {
  try {
    const response = await apiFetch<ConvertDiscoveryToActiveClientResponse>(
      `/appointments/${appointmentId}/convert`,
      {
        method: 'POST',
        body: conversionNote ? { conversionNote } : {}
      }
    )
    return { ok: true, data: response }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      return { ok: false, message: mapAppointmentErrorCodeToUserMessage(err.apiError.code) }
    }
    return { ok: false, message: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}

function openConclusionModal(item: DiscoveryAppointmentListItem) {
  conclusionError.value = null
  conclusionTarget.value = item
  conclusionModalOpen.value = true
}

function openCancelModal(item: DiscoveryAppointmentListItem) {
  cancelError.value = null
  cancelTarget.value = item
  cancelModalOpen.value = true
}

const conclusionClientName = computed(() => {
  const item = conclusionTarget.value
  if (!item) return ''
  return formatClientName(item)
})

const conclusionDefaultConvertToClient = computed(() => {
  return conclusionTarget.value?.client.stage === 'lead'
})

const conclusionLoading = computed(() => {
  const targetId = conclusionTarget.value?.id
  return !!targetId && updatingId.value === targetId
})

const cancelLoading = computed(() => {
  const targetId = cancelTarget.value?.id
  return !!targetId && updatingId.value === targetId
})

async function submitConclusion(payload: { convertToClient: boolean, conversionNote?: string }) {
  const appointment = conclusionTarget.value
  if (!appointment) return

  conversionNotice.value = null
  systemError.value = null
  conclusionError.value = null

  if (updatingId.value) return
  updatingId.value = appointment.id

  try {
    if (appointment.status !== 'completed') {
      const statusResult = await requestUpdateAppointmentStatus(appointment.id, 'completed')
      if (!statusResult.ok) {
        conclusionError.value = statusResult.message
        return
      }
    }

    if (payload.convertToClient && appointment.client.stage === 'lead') {
      const convertResult = await requestConvertDiscoveryLead(
        appointment.id,
        payload.conversionNote
      )

      if (!convertResult.ok) {
        conclusionError.value = convertResult.message
        return
      }

      conversionNotice.value = convertResult.data.alreadyActive
        ? 'Cette cliente était déjà active.'
        : 'Cliente activée avec succès.'
    } else {
      conversionNotice.value = 'Appel clôturé.'
    }

    await refresh()
    conclusionModalOpen.value = false
    conclusionTarget.value = null
  } finally {
    updatingId.value = null
  }
}

async function confirmCancel() {
  const appointment = cancelTarget.value
  if (!appointment) return

  conversionNotice.value = null
  systemError.value = null
  cancelError.value = null

  if (updatingId.value) return
  updatingId.value = appointment.id

  try {
    const statusResult = await requestUpdateAppointmentStatus(appointment.id, 'cancelled')
    if (!statusResult.ok) {
      cancelError.value = statusResult.message
      return
    }

    await refresh()
    cancelModalOpen.value = false
    cancelTarget.value = null
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div class="grid gap-10">
    <CallConclusionModal
      v-model:open="conclusionModalOpen"
      :client-name="conclusionClientName"
      :default-convert-to-client="conclusionDefaultConvertToClient"
      :loading="conclusionLoading"
      :error="conclusionError"
      @submit="submitConclusion"
    />
    <ConfirmActionModal
      v-model:open="cancelModalOpen"
      title="Annuler l’appel découverte ?"
      description="Cette action met fin au rendez-vous et libère le créneau."
      confirm-label="Annuler l’appel"
      :loading="cancelLoading"
      :error="cancelError"
      @confirm="confirmCancel"
    />

    <SystemAlert
      v-if="conversionNotice"
      variant="success"
      :description="conversionNotice"
    />
    <SystemAlert
      v-if="systemError"
      variant="error"
      title="Impossible de mettre à jour"
      :description="systemError"
    />

    <section class="relative flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Appels Découverte
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Planifiez vos sessions, rejoignez vos appels à venir, et gardez une vue claire sur votre historique.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <NuxtLink
          to="/provider/availability"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating"
        >
          <Icon
            name="lucide:calendar-clock"
            size="18"
            aria-hidden="true"
          />
          Disponibilités
        </NuxtLink>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-5 py-3 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled
        >
          <Icon
            name="lucide:refresh-cw"
            size="18"
            aria-hidden="true"
          />
          Synchroniser calendrier
        </button>
      </div>
    </section>

    <section class="grid gap-6 md:grid-cols-3">
      <div class="relative overflow-hidden rounded-blob-b border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/55 p-6 shadow-soft">
        <div class="pointer-events-none absolute right-[-25%] top-[-45%] h-48 w-48 rounded-full bg-[color:var(--color-kaora-100)] opacity-55 blur-[80px]" />
        <div class="relative z-10 flex items-start justify-between gap-4">
          <div class="grid gap-1">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              Aujourd’hui
            </p>
            <p class="font-serif text-4xl italic text-[color:var(--color-brand-primary)]">
              {{ countScheduledToday }}
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              appel(s) planifié(s)
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <Icon
              name="lucide:calendar-days"
              size="22"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-blob-d border border-white/60 bg-gradient-to-br from-white to-[rgba(181,192,163,0.18)] p-6 shadow-soft">
        <div class="pointer-events-none absolute right-[-25%] top-[-45%] h-48 w-48 rounded-full bg-[rgba(181,192,163,0.35)] blur-[90px]" />
        <div class="relative z-10 flex items-start justify-between gap-4">
          <div class="grid gap-1">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              Terminés (7j)
            </p>
            <p class="font-serif text-4xl italic text-[color:var(--color-brand-primary)]">
              {{ countCompletedLast7Days }}
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              sessions clôturées
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <Icon
              name="lucide:badge-check"
              size="22"
              class="text-[color:var(--color-success)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[rgba(212,184,160,0.24)] p-6 shadow-soft">
        <div class="pointer-events-none absolute right-[-25%] top-[-45%] h-48 w-48 rounded-full bg-[rgba(212,184,160,0.45)] blur-[90px]" />
        <div class="relative z-10 flex items-start justify-between gap-4">
          <div class="grid gap-1">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              À venir (14j)
            </p>
            <p class="font-serif text-4xl italic text-[color:var(--color-brand-primary)]">
              {{ countUpcomingNext14Days }}
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              appels programmés
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <Icon
              name="lucide:clock-4"
              size="22"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <section class="space-y-8 lg:col-span-8">
        <div class="rounded-blob-a border border-white/60 bg-white/70 shadow-soft backdrop-blur">
          <div class="flex flex-col gap-4 border-b border-[rgba(231,229,228,0.7)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid gap-1">
              <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Liste des appels
              </p>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Fuseau d’affichage : {{ timezone }}
                <span v-if="isDayFilterActive && selectedDay"> • Jour : {{ formatSelectedDayLabel(selectedDay) }}</span>
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="pending"
              @click="() => refresh()"
            >
              <Icon
                name="lucide:refresh-ccw"
                size="16"
                aria-hidden="true"
              />
              Actualiser
            </button>
          </div>

          <div class="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            <label class="grid gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Période
              <select
                v-model="rangeFilter"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              >
                <option value="all">
                  Tout
                </option>
                <option value="today">
                  Aujourd’hui
                </option>
                <option value="next14">
                  Prochains 14 jours
                </option>
                <option value="past7">
                  7 jours passés
                </option>
              </select>
            </label>

            <label class="grid gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Recherche
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Nom, email, téléphone..."
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base placeholder:text-[color:var(--color-brand-muted)] focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              >
            </label>
          </div>
        </div>

        <div class="px-6 py-6">
          <div class="flex items-start justify-between gap-4">
            <div class="grid gap-1">
              <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Appels filtrés
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Retrouvez les appels planifiés, terminés et annulés.
              </p>
            </div>
          </div>

          <div
            v-if="pending"
            class="pt-8 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Chargement…
          </div>

          <div
            v-else-if="baseFilteredAppointments.length === 0"
            class="pt-8 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun appel discovery ne correspond à ces filtres.
          </div>

          <div
            v-else
            class="space-y-10 pt-8"
          >
            <section
              v-if="scheduledAppointments.length"
              class="space-y-4"
              aria-label="Appels planifiés"
            >
              <div class="flex items-center justify-between gap-4">
                <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                  Planifiés
                </h2>
                <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                  {{ scheduledAppointments.length }}
                </span>
              </div>

              <div class="grid gap-4">
                <article
                  v-for="item in scheduledAppointments"
                  :key="item.id"
                  class="group grid gap-5 rounded-blob-d border border-white/60 border-l-4 bg-white/60 p-5 shadow-soft transition-base hover:shadow-floating md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center"
                  :class="[appointmentBorderClass(item), isPastScheduledAppointment(item) ? 'bg-[rgba(217,119,6,0.04)]' : '']"
                >
                  <div class="flex items-center justify-center">
                    <div
                      class="flex h-16 w-16 items-center justify-center rounded-2xl rounded-bl-xs bg-[color:var(--color-brand-solid)] text-lg font-bold text-[color:var(--color-brand-primary)] shadow-soft"
                      :class="isPastScheduledAppointment(item) ? 'bg-[rgba(217,119,6,0.16)]' : ''"
                    >
                      {{ clientInitials(item) }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-[color:var(--color-brand-primary)]">
                          {{ formatClientName(item) }}
                        </p>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                          {{ formatDateTime(item.scheduledAt) }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-3 text-sm">
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`mailto:${item.client.email}`"
                      >
                        {{ item.client.email }}
                      </a>
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`tel:${item.client.phone}`"
                      >
                        {{ item.client.phone }}
                      </a>
                    </div>
                  </div>

                  <div class="grid justify-items-end gap-3 text-right">
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="appointmentStatusClass(item)"
                      >
                        {{ statusLabel(item.status) }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="stageClass(item.client.stage)"
                      >
                        {{ stageLabel(item.client.stage) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:clock"
                          size="14"
                          aria-hidden="true"
                        />
                        {{ formatShortTime(item.scheduledAt) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:timer"
                          size="14"
                          aria-hidden="true"
                        />
                        15 min
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="updatingId === item.id"
                        @click="openConclusionModal(item)"
                      >
                        <Icon
                          name="lucide:check-circle"
                          size="18"
                          aria-hidden="true"
                        />
                        Conclure l’appel
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="updatingId === item.id"
                        @click="openCancelModal(item)"
                      >
                        <Icon
                          name="lucide:x-circle"
                          size="18"
                          aria-hidden="true"
                        />
                        Annuler
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section
              v-if="completedAppointments.length"
              class="space-y-4"
              aria-label="Appels terminés"
            >
              <div class="flex items-center justify-between gap-4">
                <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                  Terminés
                </h2>
                <span class="rounded-full bg-[rgba(181,192,163,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                  {{ completedAppointments.length }}
                </span>
              </div>

              <div class="grid gap-4">
                <article
                  v-for="item in completedAppointments"
                  :key="item.id"
                  class="grid gap-5 rounded-blob-d border border-white/60 border-l-4 bg-white/60 p-5 shadow-soft md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center"
                  :class="appointmentBorderClass(item)"
                >
                  <div class="flex items-center justify-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl rounded-bl-xs bg-[rgba(181,192,163,0.35)] text-lg font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                      {{ clientInitials(item) }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-[color:var(--color-brand-primary)]">
                          {{ formatClientName(item) }}
                        </p>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                          {{ formatDateTime(item.scheduledAt) }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-3 text-sm">
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`mailto:${item.client.email}`"
                      >
                        {{ item.client.email }}
                      </a>
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`tel:${item.client.phone}`"
                      >
                        {{ item.client.phone }}
                      </a>
                    </div>
                  </div>

                  <div class="grid justify-items-end gap-2 text-right">
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="appointmentStatusClass(item)"
                      >
                        {{ statusLabel(item.status) }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="stageClass(item.client.stage)"
                      >
                        {{ stageLabel(item.client.stage) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:clock"
                          size="14"
                          aria-hidden="true"
                        />
                        {{ formatShortTime(item.scheduledAt) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:timer"
                          size="14"
                          aria-hidden="true"
                        />
                        15 min
                      </span>
                    </div>

                    <button
                      v-if="item.client.stage === 'lead'"
                      type="button"
                      class="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="updatingId === item.id"
                      @click="openConclusionModal(item)"
                    >
                      <Icon
                        name="lucide:sparkles"
                        size="18"
                        aria-hidden="true"
                      />
                      Convertir
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <section
              v-if="cancelledAppointments.length"
              class="space-y-4"
              aria-label="Appels annulés"
            >
              <div class="flex items-center justify-between gap-4">
                <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                  Annulés
                </h2>
                <span class="rounded-full bg-[rgba(239,68,68,0.10)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                  {{ cancelledAppointments.length }}
                </span>
              </div>

              <div class="grid gap-4">
                <article
                  v-for="item in cancelledAppointments"
                  :key="item.id"
                  class="grid gap-5 rounded-blob-d border border-white/60 border-l-4 bg-white/55 p-5 shadow-soft md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center"
                  :class="appointmentBorderClass(item)"
                >
                  <div class="flex items-center justify-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl rounded-bl-xs bg-[rgba(239,68,68,0.08)] text-lg font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                      {{ clientInitials(item) }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-[color:var(--color-brand-primary)]">
                          {{ formatClientName(item) }}
                        </p>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                          {{ formatDateTime(item.scheduledAt) }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-3 text-sm">
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`mailto:${item.client.email}`"
                      >
                        {{ item.client.email }}
                      </a>
                      <a
                        class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                        :href="`tel:${item.client.phone}`"
                      >
                        {{ item.client.phone }}
                      </a>
                    </div>
                  </div>

                  <div class="grid justify-items-end gap-2 text-right">
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="appointmentStatusClass(item)"
                      >
                        {{ statusLabel(item.status) }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold normal-case tracking-normal"
                        :class="stageClass(item.client.stage)"
                      >
                        {{ stageLabel(item.client.stage) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:clock"
                          size="14"
                          aria-hidden="true"
                        />
                        {{ formatShortTime(item.scheduledAt) }}
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                        <Icon
                          name="lucide:timer"
                          size="14"
                          aria-hidden="true"
                        />
                        15 min
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>
      </section>

      <aside class="space-y-8 lg:col-span-4">
        <div class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-6 shadow-soft backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div class="grid gap-1">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Calendrier
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Sélectionnez un jour pour filtrer la liste.
              </p>
            </div>

            <button
              type="button"
              class="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)]"
              :disabled="!isDayFilterActive"
              @click="resetDayFilter"
            >
              <Icon
                name="lucide:rotate-ccw"
                size="16"
                aria-hidden="true"
              />
              Voir tout
            </button>
          </div>

          <div class="mt-6">
            <CalendarMonthView
              v-model="selectedDay"
              v-model:visible-month="visibleMonth"
              :available-dates="appointmentDays"
              :min-date="minDate"
              :max-date="maxDate"
              :timezone-label="timezone"
              :is-loading="pending"
              :allow-unavailable-selection="true"
              @update:model-value="activateDayFilter"
            />
          </div>
        </div>

        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-6 shadow-soft backdrop-blur">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Prochains appels
          </h2>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Les prochaines sessions planifiées, en un coup d’œil.
          </p>

          <div
            v-if="upcomingAppointments.length === 0"
            class="mt-6 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun appel planifié pour le moment.
          </div>

          <ul
            v-else
            class="mt-6 grid gap-3"
          >
            <li
              v-for="item in upcomingAppointments.slice(0, 6)"
              :key="item.id"
            >
              <button
                type="button"
                class="group flex w-full items-center justify-between gap-4 rounded-blob-a border border-white/60 bg-white/70 px-4 py-3 text-left shadow-soft transition-base hover:shadow-floating"
                @click="activateDayFilter(ymdFromIso(item.scheduledAt))"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[color:var(--color-brand-primary)]">
                    {{ formatClientName(item) }}
                  </p>
                  <p class="mt-1 text-xs text-[color:var(--color-brand-secondary)]">
                    {{ formatSelectedDayLabel(ymdFromIso(item.scheduledAt)) }}
                  </p>
                </div>

                <div class="flex flex-none items-center gap-2 rounded-full bg-[rgba(212,184,160,0.22)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                  <Icon
                    name="lucide:clock"
                    size="14"
                    aria-hidden="true"
                  />
                  {{ formatShortTime(item.scheduledAt) }}
                </div>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
