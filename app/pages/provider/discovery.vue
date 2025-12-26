<script setup lang="ts">
import type {
  DiscoveryAppointmentListItem,
  ListDiscoveryAppointmentsResponse,
  UpdateAppointmentStatusResponse
} from '../../features/appointments/api/appointments.contract'
import { mapAppointmentErrorCodeToUserMessage } from '../../features/appointments/api/appointments-error'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import CalendarMonthView from '../../components/molecules/CalendarMonthView.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Appels discovery'
})

type ActionKind = 'complete' | 'cancel'
type StatusFilter = 'all' | DiscoveryAppointmentListItem['status']
type RangeFilter = 'all' | 'today' | 'next14' | 'past7'
type SortFilter = 'upcoming' | 'recent'

const systemError = ref<string | null>(null)
const updatingId = ref<string | null>(null)

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

const statusFilter = ref<StatusFilter>('all')
const rangeFilter = ref<RangeFilter>('all')
const sortFilter = ref<SortFilter>('upcoming')
const searchQuery = ref('')

const selectedDay = ref<string | null>(null)
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

const filteredAppointments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const now = new Date()
  const todayYmd = getYmdInTimeZone(now, timezone.value)
  const fourteenDaysFromNow = new Date(now)
  fourteenDaysFromNow.setUTCDate(fourteenDaysFromNow.getUTCDate() + 14)
  const fourteenYmd = getYmdInTimeZone(fourteenDaysFromNow, timezone.value)

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const sevenDaysAgoYmd = getYmdInTimeZone(sevenDaysAgo, timezone.value)

  const items = appointments.value.filter((item) => {
    if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false

    if (selectedDay.value) {
      if (ymdFromIso(item.scheduledAt) !== selectedDay.value) return false
    }

    const ymd = ymdFromIso(item.scheduledAt)
    if (rangeFilter.value === 'today' && ymd !== todayYmd) return false
    if (rangeFilter.value === 'next14' && (ymd < todayYmd || ymd > fourteenYmd)) return false
    if (rangeFilter.value === 'past7' && (ymd < sevenDaysAgoYmd || ymd > todayYmd)) return false

    if (!query) return true
    const fullName = `${item.client.firstname} ${item.client.lastname}`.toLowerCase()
    return (
      fullName.includes(query)
      || item.client.email.toLowerCase().includes(query)
      || item.client.phone.toLowerCase().includes(query)
    )
  })

  return items.toSorted((a, b) => {
    const aTime = new Date(a.scheduledAt).getTime()
    const bTime = new Date(b.scheduledAt).getTime()
    return sortFilter.value === 'upcoming' ? aTime - bTime : bTime - aTime
  })
})

const upcomingAppointments = computed(() => {
  const now = Date.now()
  return appointments.value
    .filter(item => item.status === 'scheduled' && new Date(item.scheduledAt).getTime() >= now)
    .toSorted((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
})

const countScheduledToday = computed(() => {
  const today = getYmdInTimeZone(new Date(), timezone.value)
  return appointments.value.filter(item => item.status === 'scheduled' && ymdFromIso(item.scheduledAt) === today).length
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

async function updateAppointmentStatus(appointmentId: string, kind: ActionKind) {
  systemError.value = null
  if (updatingId.value) return
  updatingId.value = appointmentId

  try {
    if (kind === 'cancel') {
      const confirmed = confirm('Annuler cet appel découverte ?')
      if (!confirmed) return
    }

    const body
      = kind === 'complete'
        ? { status: 'completed' as const }
        : { status: 'cancelled' as const, cancelledByRole: 'PROVIDER' as const }

    await apiFetch<UpdateAppointmentStatusResponse>(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body
    })

    await refresh()
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'INVALID_STATUS_TRANSITION') {
        await refresh()
        const updatedStatus = data.value?.appointments?.find(a => a.id === appointmentId)?.status
        if (
          (kind === 'complete' && updatedStatus === 'completed')
          || (kind === 'cancel' && updatedStatus === 'cancelled')
        ) {
          return
        }
      }

      systemError.value = mapAppointmentErrorCodeToUserMessage(err.apiError.code)
      return
    }
    systemError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div class="grid gap-10">
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
                <span v-if="selectedDay"> • Jour : {{ formatSelectedDayLabel(selectedDay) }}</span>
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

          <div class="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
            <label class="grid gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Statut
              <select
                v-model="statusFilter"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              >
                <option value="all">
                  Tous
                </option>
                <option value="scheduled">
                  Planifié
                </option>
                <option value="completed">
                  Terminé
                </option>
                <option value="cancelled">
                  Annulé
                </option>
              </select>
            </label>

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
              Tri
              <select
                v-model="sortFilter"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              >
                <option value="upcoming">
                  À venir
                </option>
                <option value="recent">
                  Plus récent
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

          <div
            v-if="pending"
            class="px-6 py-10 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Chargement…
          </div>

          <div
            v-else-if="filteredAppointments.length === 0"
            class="px-6 py-12 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun appel discovery ne correspond à ces filtres.
          </div>

          <ul
            v-else
            class="divide-y divide-[rgba(231,229,228,0.6)]"
          >
            <li
              v-for="item in filteredAppointments"
              :key="item.id"
              class="px-6 py-6"
            >
              <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_120px_140px_auto] lg:items-center">
                <div class="flex min-w-0 items-start gap-4">
                  <div class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[color:var(--color-brand-solid)] text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                    {{ clientInitials(item) }}
                  </div>

                  <div class="min-w-0">
                    <p class="truncate font-semibold text-[color:var(--color-brand-primary)]">
                      {{ formatClientName(item) }}
                    </p>
                    <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                      {{ formatDateTime(item.scheduledAt) }}
                    </p>
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
                </div>

                <div class="grid gap-1 text-sm text-[color:var(--color-brand-secondary)]">
                  <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                    Heure
                  </p>
                  <p class="font-semibold text-[color:var(--color-brand-primary)]">
                    {{ formatShortTime(item.scheduledAt) }}
                  </p>
                </div>

                <div class="grid gap-1 text-sm text-[color:var(--color-brand-secondary)]">
                  <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                    Durée
                  </p>
                  <p class="font-semibold text-[color:var(--color-brand-primary)]">
                    15 min
                  </p>
                </div>

                <div class="flex items-center">
                  <span
                    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                    :class="statusClass(item.status)"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-3 lg:justify-end">
                  <button
                    v-if="item.status === 'scheduled'"
                    type="button"
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="updatingId === item.id"
                    @click="updateAppointmentStatus(item.id, 'complete')"
                  >
                    <Icon
                      name="lucide:check-circle"
                      size="18"
                      aria-hidden="true"
                    />
                    Terminer
                  </button>

                  <button
                    v-if="item.status === 'scheduled'"
                    type="button"
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="updatingId === item.id"
                    @click="updateAppointmentStatus(item.id, 'cancel')"
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
            </li>
          </ul>
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
              :disabled="!selectedDay"
              @click="selectedDay = null"
            >
              <Icon
                name="lucide:rotate-ccw"
                size="16"
                aria-hidden="true"
              />
              Réinitialiser
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
                @click="selectedDay = ymdFromIso(item.scheduledAt)"
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
