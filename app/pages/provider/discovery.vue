<template>
  <div class="space-y-6">
    <!-- Modals -->
    <CallConclusionModal
      v-model:open="conclusionModalOpen"
      :client-name="conclusionClientName"
      :loading="conclusionLoading"
      :error="conclusionError"
      @submit="submitConclusion"
    />
    <ConfirmActionModal
      v-model:open="cancelModalOpen"
      title="Annuler l'appel découverte ?"
      description="Cette action met fin au rendez-vous et libère le créneau."
      confirm-label="Annuler l'appel"
      :loading="cancelLoading"
      :error="cancelError"
      @confirm="confirmCancel"
    />

    <!-- Notifications -->
    <UAlert
      v-if="conversionNotice"
      color="success"
      variant="soft"
      :title="conversionNotice"
      icon="i-lucide-check-circle"
      :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
      @close="conversionNotice = null"
    />
    <UAlert
      v-if="systemError"
      color="error"
      variant="soft"
      title="Impossible de mettre à jour"
      :description="systemError"
      icon="i-lucide-alert-circle"
    />

    <!-- Header — titre + KPIs inline + CTA unique -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-heading text-2xl font-bold text-[color:var(--color-text-primary)]">
          Appels découverte
        </h1>
        <div class="mt-1 flex items-center gap-3 text-sm text-[color:var(--color-text-muted)]">
          <span class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-phone"
              class="h-3.5 w-3.5 text-crepuscule-500"
            />
            <span class="font-medium text-[color:var(--color-text-primary)]">{{ pending ? '–' : countScheduledToday }}</span> aujourd'hui
          </span>
          <span class="text-[color:var(--color-border-default)]">·</span>
          <span class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-check-circle"
              class="h-3.5 w-3.5 text-[color:var(--color-success-500)]"
            />
            <span class="font-medium text-[color:var(--color-text-primary)]">{{ pending ? '–' : countCompletedLast7Days }}</span> terminés (7j)
          </span>
          <span class="text-[color:var(--color-border-default)]">·</span>
          <span class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-calendar-days"
              class="h-3.5 w-3.5 text-sunset-500"
            />
            <span class="font-medium text-[color:var(--color-text-primary)]">{{ pending ? '–' : countUpcomingNext14Days }}</span> à venir
          </span>
        </div>
      </div>
      <UButton
        to="/provider/calendar?action=create&type=discovery"
        color="primary"
        icon="i-lucide-plus"
      >
        Créer un appel
      </UButton>
    </div>

    <!-- Main content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Liste des appels -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Toolbar: Tabs + Recherche + Filtre période -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <UTabs
              v-model="activeTab"
              :items="tabItems"
              variant="link"
              class="w-auto"
              :ui="{ list: 'gap-0' }"
            />
          </div>
          <div class="flex items-center gap-2">
            <UInput
              v-model="searchQuery"
              placeholder="Rechercher..."
              icon="i-lucide-search"
              size="sm"
              class="flex-1"
            />
            <USelect
              v-model="rangeFilter"
              :items="rangeOptions"
              size="sm"
              class="w-44 shrink-0"
            />
          </div>
        </div>

        <!-- Active day filter badge -->
        <div
          v-if="isDayFilterActive && selectedDay"
          class="flex items-center gap-2"
        >
          <UBadge
            color="primary"
            variant="soft"
            size="md"
          >
            <UIcon
              name="i-lucide-calendar"
              class="mr-1 h-3 w-3"
            />
            {{ formatSelectedDayLabel(selectedDay) }}
          </UBadge>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-x"
            aria-label="Retirer le filtre jour"
            @click="resetDayFilter"
          />
        </div>

        <!-- Loading -->
        <template v-if="pending">
          <UCard
            v-for="i in 3"
            :key="i"
            class="bg-[color:var(--color-surface-card)]"
          >
            <div class="flex items-center gap-4">
              <USkeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-1/3" />
                <USkeleton class="h-3 w-1/2" />
              </div>
              <USkeleton class="h-8 w-20 rounded-full" />
            </div>
          </UCard>
        </template>

        <!-- Empty state -->
        <div
          v-else-if="getAppointmentsForTab(activeTab).length === 0"
          class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] py-12 text-center"
        >
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]">
            <UIcon
              :name="getEmptyStateIcon(activeTab)"
              class="h-6 w-6 text-[color:var(--color-brand-muted)]"
            />
          </div>
          <p class="font-medium text-[color:var(--color-text-primary)]">
            {{ getEmptyStateTitle(activeTab) }}
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {{ getEmptyStateDescription(activeTab) }}
          </p>
        </div>

        <!-- Appointments list -->
        <template v-else>
          <AppointmentCard
            v-for="appointment in getAppointmentsForTab(activeTab)"
            :key="appointment.id"
            :appointment="appointment"
            :updating-id="updatingId"
            :timezone="timezone"
            @conclude="openConclusionModal"
            @cancel="openCancelModal"
            @convert="openConclusionModal"
          />
        </template>
      </div>

      <!-- Sidebar — calendrier uniquement, hidden on mobile -->
      <aside class="hidden lg:block">
        <UCard class="sticky top-6 overflow-hidden bg-[color:var(--color-surface-card)]">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-[color:var(--color-text-primary)]">
                Calendrier
              </h2>
              <UButton
                v-if="isDayFilterActive"
                variant="link"
                color="neutral"
                size="xs"
                @click="resetDayFilter"
              >
                Voir tout
              </UButton>
            </div>
          </template>

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
        </UCard>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  DiscoveryAppointmentListItem,
  ListDiscoveryAppointmentsResponse,
  UpdateAppointmentStatusResponse
} from '../../features/appointments/api/appointments.contract'
import { mapAppointmentErrorCodeToUserMessage } from '../../features/appointments/api/appointments-error'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import CalendarMonthView from '../../components/molecules/CalendarMonthView.vue'
import ConfirmActionModal from '../../components/molecules/ConfirmActionModal.vue'
import CallConclusionModal from '../../components/organisms/CallConclusionModal.vue'
import AppointmentCard from '../../components/molecules/AppointmentCard.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Appels découverte'
})

type RangeFilter = 'all' | 'today' | 'next14' | 'past7'
type TabValue = 'scheduled' | 'completed' | 'cancelled'

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

// Filters
const rangeFilter = ref<RangeFilter>('all')
const searchQuery = ref('')
const activeTab = ref<TabValue>('scheduled')

const rangeOptions = [
  { label: 'Toutes les périodes', value: 'all' },
  { label: 'Aujourd\'hui', value: 'today' },
  { label: 'Prochains 14 jours', value: 'next14' },
  { label: '7 derniers jours', value: 'past7' }
]

// Calendar state
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

// Filtered appointments
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

// Stats
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

// Tabs
const scheduledAppointments = computed(() =>
  baseFilteredAppointments.value
    .filter(item => item.status === 'scheduled')
    .toSorted((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
)

const completedAppointments = computed(() =>
  baseFilteredAppointments.value
    .filter(item => item.status === 'completed')
    .toSorted((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
)

const cancelledAppointments = computed(() =>
  baseFilteredAppointments.value
    .filter(item => item.status === 'cancelled')
    .toSorted((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
)

const tabItems = computed(() => [
  {
    label: `Planifiés (${scheduledAppointments.value.length})`,
    value: 'scheduled' as const
  },
  {
    label: `Terminés (${completedAppointments.value.length})`,
    value: 'completed' as const
  },
  {
    label: `Annulés (${cancelledAppointments.value.length})`,
    value: 'cancelled' as const
  }
])

function getAppointmentsForTab(tab: TabValue): DiscoveryAppointmentListItem[] {
  switch (tab) {
    case 'scheduled':
      return scheduledAppointments.value
    case 'completed':
      return completedAppointments.value
    case 'cancelled':
      return cancelledAppointments.value
    default:
      return []
  }
}

function getEmptyStateIcon(tab: TabValue): string {
  switch (tab) {
    case 'scheduled':
      return 'lucide:calendar-x'
    case 'completed':
      return 'lucide:check-circle'
    case 'cancelled':
      return 'lucide:x-circle'
    default:
      return 'lucide:inbox'
  }
}

function getEmptyStateTitle(tab: TabValue): string {
  switch (tab) {
    case 'scheduled':
      return 'Aucun appel planifié'
    case 'completed':
      return 'Aucun appel terminé'
    case 'cancelled':
      return 'Aucun appel annulé'
    default:
      return 'Aucun appel'
  }
}

function getEmptyStateDescription(tab: TabValue): string {
  switch (tab) {
    case 'scheduled':
      return 'Les nouveaux appels découverte apparaîtront ici.'
    case 'completed':
      return 'Les appels terminés apparaîtront ici.'
    case 'cancelled':
      return 'Les appels annulés apparaîtront ici.'
    default:
      return ''
  }
}

// Formatting
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

// Modal handlers
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

const conclusionLoading = computed(() => {
  const targetId = conclusionTarget.value?.id
  return !!targetId && updatingId.value === targetId
})

const cancelLoading = computed(() => {
  const targetId = cancelTarget.value?.id
  return !!targetId && updatingId.value === targetId
})

// API calls
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

type BilanTargetStage = 'active' | 'lead' | 'paused'

/**
 * US-8: Appel au nouvel endpoint /bilan pour transition de stage.
 */
async function requestDiscoveryBilan(
  appointmentId: string,
  targetStage: BilanTargetStage,
  note?: string
): Promise<{ ok: true } | { ok: false, message: string }> {
  try {
    await apiFetch(
      `/appointments/${appointmentId}/bilan`,
      {
        method: 'POST',
        body: { targetStage, note }
      }
    )
    return { ok: true }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      return { ok: false, message: mapAppointmentErrorCodeToUserMessage(err.apiError.code) }
    }
    return { ok: false, message: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}

/**
 * US-8: Handler pour le submit de la modal bilan à 3 options.
 */
async function submitConclusion(payload: { targetStage: BilanTargetStage, note?: string }) {
  const appointment = conclusionTarget.value
  if (!appointment) return

  conversionNotice.value = null
  systemError.value = null
  conclusionError.value = null

  if (updatingId.value) return
  updatingId.value = appointment.id

  try {
    // Appeler le nouvel endpoint /bilan
    const bilanResult = await requestDiscoveryBilan(
      appointment.id,
      payload.targetStage,
      payload.note
    )

    if (!bilanResult.ok) {
      conclusionError.value = bilanResult.message
      return
    }

    // Messages de succès selon l'option choisie
    const messages: Record<BilanTargetStage, string> = {
      active: 'Cliente activée avec succès.',
      lead: 'Cliente en attente de décision.',
      paused: 'Cliente archivée.'
    }
    conversionNotice.value = messages[payload.targetStage]

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
