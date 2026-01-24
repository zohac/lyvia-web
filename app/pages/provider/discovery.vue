<template>
  <div class="space-y-8">
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

    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Appels Discovery
        </h1>
        <p class="mt-1 text-stone-500">
          Gérez vos appels découverte et convertissez vos leads en clientes.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          to="/provider/calendar?action=create&type=discovery"
          color="primary"
        >
          <UIcon
            name="lucide:plus"
            class="mr-2 h-4 w-4"
          />
          Créer un appel
        </UButton>
        <UButton
          to="/provider/availability"
          variant="soft"
          color="neutral"
        >
          <UIcon
            name="lucide:calendar-clock"
            class="mr-2 h-4 w-4"
          />
          Disponibilités
        </UButton>
        <UButton
          :loading="pending"
          variant="outline"
          color="neutral"
          @click="() => refresh()"
        >
          <UIcon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
          />
          Actualiser
        </UButton>
      </div>
    </header>

    <!-- Stats row -->
    <div class="grid gap-4 sm:grid-cols-3">
      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-crepuscule-100">
            <UIcon
              name="lucide:phone"
              class="h-6 w-6 text-crepuscule-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              Aujourd'hui
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : countScheduledToday }}
            </p>
            <p class="text-xs text-stone-400">
              appel(s) planifié(s)
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <UIcon
              name="lucide:check-circle"
              class="h-6 w-6 text-green-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              Terminés (7j)
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : countCompletedLast7Days }}
            </p>
            <p class="text-xs text-stone-400">
              sessions clôturées
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-sunset-100">
            <UIcon
              name="lucide:calendar-days"
              class="h-6 w-6 text-sunset-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              À venir (14j)
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : countUpcomingNext14Days }}
            </p>
            <p class="text-xs text-stone-400">
              appels programmés
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Main content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Liste des appels -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Filters -->
        <UCard class="bg-white">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div class="flex-1">
              <label class="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
                Recherche
              </label>
              <UInput
                v-model="searchQuery"
                placeholder="Nom, email, téléphone..."
                icon="i-lucide-search"
              />
            </div>
            <div class="sm:w-48">
              <label class="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
                Période
              </label>
              <USelect
                v-model="rangeFilter"
                :items="rangeOptions"
              />
            </div>
          </div>

          <div
            v-if="isDayFilterActive && selectedDay"
            class="mt-4 flex items-center gap-2"
          >
            <UBadge
              color="primary"
              variant="soft"
              size="lg"
            >
              <UIcon
                name="lucide:calendar"
                class="mr-1.5 h-3.5 w-3.5"
              />
              {{ formatSelectedDayLabel(selectedDay) }}
            </UBadge>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              @click="resetDayFilter"
            >
              <UIcon
                name="lucide:x"
                class="h-4 w-4"
              />
            </UButton>
          </div>
        </UCard>

        <!-- Tabs par statut -->
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          class="w-full"
        >
          <template #content="{ item }">
            <div class="mt-4 space-y-4">
              <!-- Loading -->
              <template v-if="pending">
                <UCard
                  v-for="i in 3"
                  :key="i"
                  class="bg-white"
                >
                  <div class="flex items-center gap-4">
                    <USkeleton class="h-12 w-12 rounded-full" />
                    <div class="flex-1 space-y-2">
                      <USkeleton class="h-4 w-1/3" />
                      <USkeleton class="h-3 w-1/2" />
                    </div>
                    <USkeleton class="h-8 w-24 rounded-full" />
                  </div>
                </UCard>
              </template>

              <!-- Empty state -->
              <UCard
                v-else-if="getAppointmentsForTab(item.value).length === 0"
                class="bg-white"
              >
                <div class="py-8 text-center">
                  <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                    <UIcon
                      :name="getEmptyStateIcon(item.value)"
                      class="h-7 w-7 text-stone-400"
                    />
                  </div>
                  <p class="font-medium text-stone-900">
                    {{ getEmptyStateTitle(item.value) }}
                  </p>
                  <p class="mt-1 text-sm text-stone-500">
                    {{ getEmptyStateDescription(item.value) }}
                  </p>
                </div>
              </UCard>

              <!-- Appointments list -->
              <template v-else>
                <AppointmentCard
                  v-for="appointment in getAppointmentsForTab(item.value)"
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
          </template>
        </UTabs>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-6">
        <!-- Calendrier -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-stone-900">
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

        <!-- Prochains appels -->
        <UCard class="bg-white">
          <template #header>
            <h2 class="font-semibold text-stone-900">
              Prochains appels
            </h2>
          </template>

          <div
            v-if="pending"
            class="space-y-3"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3"
            >
              <USkeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <USkeleton class="h-3 w-2/3" />
                <USkeleton class="h-2.5 w-1/2" />
              </div>
            </div>
          </div>

          <div
            v-else-if="upcomingAppointments.length === 0"
            class="py-4 text-center text-sm text-stone-500"
          >
            Aucun appel planifié
          </div>

          <div
            v-else
            class="divide-y divide-stone-100"
          >
            <button
              v-for="item in upcomingAppointments.slice(0, 5)"
              :key="item.id"
              type="button"
              class="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-stone-50"
              @click="activateDayFilter(ymdFromIso(item.scheduledAt))"
            >
              <UAvatar
                :text="clientInitials(item)"
                size="sm"
                class="bg-crepuscule-100 text-crepuscule-700"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-stone-900">
                  {{ formatClientName(item) }}
                </p>
                <p class="text-xs text-stone-500">
                  {{ formatSelectedDayLabel(ymdFromIso(item.scheduledAt)) }}
                </p>
              </div>
              <span class="text-sm font-medium text-crepuscule-600">
                {{ formatShortTime(item.scheduledAt) }}
              </span>
            </button>
          </div>
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
  pageTitle: 'Appels discovery'
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

const upcomingAppointments = computed(() => {
  const now = Date.now()
  return appointments.value
    .filter(item => item.status === 'scheduled' && new Date(item.scheduledAt).getTime() >= now)
    .toSorted((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
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
      return 'Les nouveaux appels discovery apparaîtront ici.'
    case 'completed':
      return 'Les appels terminés apparaîtront ici.'
    case 'cancelled':
      return 'Les appels annulés apparaîtront ici.'
    default:
      return ''
  }
}

// Formatting
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
