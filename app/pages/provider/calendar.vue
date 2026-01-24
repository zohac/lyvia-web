<script setup lang="ts">
import ProviderCalendarAppointmentDrawer from '../../components/organisms/ProviderCalendarAppointmentDrawer.vue'
import ProviderCalendarCancelAppointmentModal from '../../components/organisms/ProviderCalendarCancelAppointmentModal.vue'
import ProviderCalendarCreateAppointmentModal from '../../components/organisms/ProviderCalendarCreateAppointmentModal.vue'
import ProviderCalendarEditAppointmentModal from '../../components/organisms/ProviderCalendarEditAppointmentModal.vue'
import ProviderCalendarDisplayOptions from '../../components/organisms/ProviderCalendarDisplayOptions.vue'
import ProviderCalendarTopBar from '../../components/organisms/ProviderCalendarTopBar.vue'
import ProviderCalendarMonthView from '../../components/organisms/ProviderCalendarMonthView.vue'
import ProviderCalendarWeekView from '../../components/organisms/ProviderCalendarWeekView.vue'
import { useProviderCalendar } from '../../features/calendar/useProviderCalendar'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import type { ProviderClientListItem } from '../../features/clients/api/clients.contract'
import { deriveStageFromStatus } from '../../features/clients/domain/clients'
import type { ProviderAppointmentListItem, ProviderCalendarAppointmentType, CreateProviderManualAppointmentRequest, UpdateProviderAppointmentRequest } from '../../features/calendar/api/calendar.contract'
import type { ConflictHighlight } from '../../features/calendar/domain/conflict-highlight'
import { buildDay, buildWeekDays } from '../../features/calendar/domain/range'
import { buildConflictHighlight } from '../../features/calendar/domain/conflict-highlight'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { createUuidV4 } from '../../utils/uuid'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Calendrier'
})

const noticeMessage = ref<string | null>(null)
const toast = useToast()

const calendar = await useProviderCalendar()

// Load all provider clients for the create modal dropdown
const allClients = ref<ProviderClientListItem[]>([])

async function loadAllClients() {
  try {
    // Load clients with high limit to get all (pagination can be added if needed)
    const response = await listProviderClients({ limit: 100, sort: 'lastname' })
    allClients.value = response.items
  } catch {
    // Silently fail - knownClients will be empty but modal still works
    allClients.value = []
  }
}

// Handle query params for opening create modal (e.g., ?action=create&type=discovery)
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  // Load clients first (needed for pre-selection in modal)
  await loadAllClients()

  const action = route.query.action
  const typeParam = route.query.type
  const clientProfileIdParam = route.query.clientProfileId

  if (action === 'create') {
    const appointmentType = typeParam === 'discovery' ? 'discovery' : 'consultation'
    const clientProfileId = typeof clientProfileIdParam === 'string' ? clientProfileIdParam : null

    openCreateModal({
      dayKey: getYmdInTimeZone(calendar.anchorDate.value, calendar.timeZone.value),
      minutes: 9 * 60,
      type: appointmentType,
      clientProfileId
    })

    // Clean up query params
    router.replace({ query: {} })
  }
})

type DisplayTypeFilter = 'all' | ProviderCalendarAppointmentType

const displayTypeFilter = ref<DisplayTypeFilter>('all')
const selectedAppointmentId = ref<ProviderAppointmentListItem['id'] | null>(null)
const lastInteractionDayKey = ref<string | null>(null)

const conflictHighlight = ref<ConflictHighlight | null>(null)
let conflictHighlightTimer: ReturnType<typeof setTimeout> | null = null

const monthHighlight = computed(() => {
  if (!conflictHighlight.value) return null
  return {
    dayKey: conflictHighlight.value.dayKey,
    appointmentId: conflictHighlight.value.appointmentId
  }
})

const selectedAppointment = computed(() => {
  const id = selectedAppointmentId.value
  if (!id) return null
  return calendar.sortedAppointments.value.find(appointment => appointment.id === id) ?? null
})

const visibleAppointments = computed(() => {
  if (displayTypeFilter.value === 'all') return calendar.sortedAppointments.value
  return calendar.sortedAppointments.value.filter(appointment => appointment.type === displayTypeFilter.value)
})

const isDrawerOpen = computed(() => Boolean(selectedAppointment.value))

function setDisplayTypeFilter(value: DisplayTypeFilter) {
  displayTypeFilter.value = value
}

async function onRetry() {
  noticeMessage.value = null
  await calendar.refresh({ revalidate: true })
}

function onSelectAppointment(appointment: ProviderAppointmentListItem) {
  selectedAppointmentId.value = appointment.id
  noticeMessage.value = null
  lastInteractionDayKey.value = getYmdInTimeZone(new Date(appointment.startAt), calendar.timeZone.value)
}

const isCreateModalOpen = ref(false)
const createInitialDayKey = ref(getYmdInTimeZone(calendar.anchorDate.value, calendar.timeZone.value))
const createInitialMinutes = ref(9 * 60)
const createInitialType = ref<'discovery' | 'consultation'>('consultation')
const createInitialClientProfileId = ref<string | null>(null)
const createIdempotencyKey = ref<string | null>(null)

const knownClients = computed(() => {
  return allClients.value.map((client) => {
    // Use stage if provided, otherwise derive from computedStatus
    const stage = client.stage ?? deriveStageFromStatus(client.computedStatus)
    return {
      value: client.clientProfileId,
      label: `${client.firstname} ${client.lastname}`.trim(),
      stage,
      // Use API field directly instead of computing from visible calendar appointments (fix [H1])
      hasActiveDiscovery: client.hasScheduledDiscovery
    }
  })
})

const createFieldErrors = computed(() => calendar.actionFieldErrors.value)
const createErrorMessage = computed(() => {
  return Object.keys(createFieldErrors.value).length > 0 ? null : calendar.actionErrorMessage.value
})

function setCreateModalOpen(next: boolean) {
  isCreateModalOpen.value = next
  if (!next) {
    createIdempotencyKey.value = null
    calendar.clearActionErrors()
  }
}

function openCreateModal(input: { dayKey: string, minutes: number, type?: 'discovery' | 'consultation', clientProfileId?: string | null }) {
  noticeMessage.value = null
  closeDrawer()
  calendar.clearActionErrors()

  createInitialDayKey.value = input.dayKey
  createInitialMinutes.value = input.minutes
  createInitialType.value = input.type ?? 'consultation'
  createInitialClientProfileId.value = input.clientProfileId ?? null
  lastInteractionDayKey.value = input.dayKey
  createIdempotencyKey.value = createUuidV4()
  isCreateModalOpen.value = true
}

function onCreateAppointment() {
  openCreateModal({
    dayKey: getYmdInTimeZone(calendar.anchorDate.value, calendar.timeZone.value),
    minutes: 9 * 60
  })
}

function onSelectEmpty(payload: { dayKey: string, minutes: number }) {
  openCreateModal(payload)
}

function onSelectMonthDay(payload: { dayKey: string }) {
  openCreateModal({ dayKey: payload.dayKey, minutes: 9 * 60 })
}

function triggerConflictHighlight(input: { startAt: string, durationMinutes: number }) {
  const dayKey = getYmdInTimeZone(new Date(input.startAt), calendar.timeZone.value)
  const autoScroll = calendar.view.value !== 'month' && lastInteractionDayKey.value === dayKey

  const highlight = buildConflictHighlight({
    appointments: calendar.sortedAppointments.value,
    timeZone: calendar.timeZone.value,
    startAt: input.startAt,
    durationMinutes: input.durationMinutes,
    autoScroll
  })

  conflictHighlight.value = highlight

  if (conflictHighlightTimer) clearTimeout(conflictHighlightTimer)
  conflictHighlightTimer = setTimeout(() => {
    if (conflictHighlight.value === highlight) conflictHighlight.value = null
  }, 2600)
}

onBeforeUnmount(() => {
  if (conflictHighlightTimer) clearTimeout(conflictHighlightTimer)
})

const isRangeEmpty = computed(() => calendar.sortedAppointments.value.length === 0 && !calendar.pending.value && !calendar.errorMessage.value)
const isFilterEmpty = computed(() => {
  if (displayTypeFilter.value === 'all') return false
  if (calendar.pending.value || calendar.errorMessage.value) return false
  return calendar.sortedAppointments.value.length > 0 && visibleAppointments.value.length === 0
})

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

    selectedAppointmentId.value = null
    toast.add({
      title: 'Filtre actif',
      description: 'Rendez-vous masqués — ajustez le filtre pour les afficher.',
      color: 'primary'
    })
  }
)

function closeDrawer() {
  selectedAppointmentId.value = null
}

watch(
  () => selectedAppointment.value,
  (next) => {
    if (!next && selectedAppointmentId.value) {
      selectedAppointmentId.value = null
    }
  }
)

const isEditModalOpen = ref(false)
const editAppointmentId = ref<string | null>(null)

const editAppointment = computed(() => {
  const id = editAppointmentId.value
  if (!id) return null
  return calendar.sortedAppointments.value.find(appointment => appointment.id === id) ?? null
})

const editFieldErrors = computed(() => calendar.actionFieldErrors.value)
const editErrorMessage = computed(() => {
  return Object.keys(editFieldErrors.value).length > 0 ? null : calendar.actionErrorMessage.value
})

function setEditModalOpen(next: boolean) {
  isEditModalOpen.value = next
  if (!next) {
    editAppointmentId.value = null
    calendar.clearActionErrors()
  }
}

function onEditAppointment(payload: { appointmentId: string }) {
  noticeMessage.value = null
  calendar.clearActionErrors()
  closeDrawer()
  editAppointmentId.value = payload.appointmentId
  const appointment = calendar.sortedAppointments.value.find(item => item.id === payload.appointmentId)
  if (appointment) {
    lastInteractionDayKey.value = getYmdInTimeZone(new Date(appointment.startAt), calendar.timeZone.value)
  }
  isEditModalOpen.value = true
}

const isCancelModalOpen = ref(false)
const cancelAppointmentId = ref<string | null>(null)

const cancelAppointment = computed(() => {
  const id = cancelAppointmentId.value
  if (!id) return null
  return calendar.sortedAppointments.value.find(appointment => appointment.id === id) ?? null
})

const cancelFieldErrors = computed(() => calendar.actionFieldErrors.value)
const cancelErrorMessage = computed(() => {
  return Object.keys(cancelFieldErrors.value).length > 0 ? null : calendar.actionErrorMessage.value
})

function setCancelModalOpen(next: boolean) {
  isCancelModalOpen.value = next
  if (!next) {
    cancelAppointmentId.value = null
    calendar.clearActionErrors()
  }
}

function onRequestCancelAppointment(payload: { appointmentId: string }) {
  noticeMessage.value = null
  calendar.clearActionErrors()
  closeDrawer()
  cancelAppointmentId.value = payload.appointmentId
  isCancelModalOpen.value = true
}

async function onCancelAppointmentSubmit(payload: { appointmentId: string, body: { reason: 'PROVIDER_UNAVAILABLE' | 'CLIENT_REQUEST' | 'EMERGENCY' | 'OTHER', reasonText?: string | null } }) {
  const result = await calendar.cancelAppointment({ appointmentId: payload.appointmentId, body: payload.body })

  if (result.ok) {
    toast.add({
      title: 'Rendez-vous annulé',
      description: result.response.alreadyCancelled
        ? 'Ce rendez-vous était déjà annulé.'
        : 'Le rendez-vous a été annulé avec succès.',
      color: 'primary'
    })

    setCancelModalOpen(false)
    return
  }

  if (result.kind === 'validation') return

  if (result.kind === 'forbidden') {
    toast.add({
      title: 'Accès non autorisé',
      description: 'Vous n\'êtes pas autorisé à annuler ce rendez-vous.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: 'Erreur',
    description: result.message,
    color: 'error'
  })
}

async function onCreateAppointmentSubmit(payload: { body: CreateProviderManualAppointmentRequest }) {
  const idempotencyKey = createIdempotencyKey.value ?? undefined
  const result = await calendar.createAppointment(payload.body, { idempotencyKey })
  if (result.ok) {
    toast.add({
      title: 'Rendez-vous créé',
      description: 'Le rendez-vous a été ajouté au calendrier.',
      color: 'primary'
    })
    createIdempotencyKey.value = null
    isCreateModalOpen.value = false
    return
  }

  // US-4: Gérer les erreurs de gate avec actions suggérées
  if (result.kind === 'forbidden' && result.code === 'CLIENT_NOT_CONVERTED') {
    toast.add({
      title: 'Client non converti',
      description: 'Ce client doit d\'abord être converti après son appel découverte.',
      color: 'warning',
      actions: [{
        label: 'Voir les discoveries',
        onClick: () => { void navigateTo('/provider/discovery') }
      }]
    })
    return
  }

  if (result.kind === 'forbidden' && result.code === 'DISCOVERY_NOT_ALLOWED_FOR_STAGE') {
    toast.add({
      title: 'Client déjà actif',
      description: 'Ce client est déjà actif, vous pouvez créer une consultation.',
      color: 'info'
    })
    return
  }

  if (result.kind === 'conflict' && result.code === 'DISCOVERY_ALREADY_EXISTS') {
    toast.add({
      title: 'Discovery déjà planifié',
      description: result.message,
      color: 'warning'
    })
    return
  }

  if (result.kind === 'overlap') {
    toast.add({
      title: 'Créneau déjà pris',
      description: 'Ce créneau vient d\'être réservé. Choisissez-en un autre.',
      color: 'warning'
    })

    // Calculate duration from pricePlanId for consultation
    let durationMinutes = 15 // default for discovery
    if (payload.body.type === 'consultation') {
      const plan = calendar.consultationPricePlansById.value[payload.body.pricePlanId]
      durationMinutes = plan?.durationMinutes ?? 60
    }

    triggerConflictHighlight({
      startAt: payload.body.startAt,
      durationMinutes
    })
    return
  }

  if (result.kind === 'validation') {
    // Erreurs spécifiques au tarif : refresh la liste des plans
    await calendar.refreshConsultationPricing({ revalidate: true })
    return
  }

  if (result.kind === 'unknown') {
    toast.add({
      title: 'Erreur',
      description: result.message,
      color: 'error'
    })
  }
}

async function onEditAppointmentSubmit(payload: { appointmentId: string, body: UpdateProviderAppointmentRequest }) {
  const result = await calendar.updateAppointment(payload.appointmentId, payload.body)
  if (result.ok) {
    toast.add({
      title: 'Rendez-vous mis à jour',
      description: 'Les modifications ont été enregistrées.',
      color: 'primary'
    })
    setEditModalOpen(false)
    return
  }

  if (result.kind === 'overlap') {
    toast.add({
      title: 'Créneau déjà pris',
      description: 'Ce créneau vient d\'être réservé. Choisissez-en un autre.',
      color: 'warning'
    })

    const baseAppointment = editAppointment.value
    const startAt = payload.body.startAt ?? baseAppointment?.startAt
    if (startAt) {
      // Calculate duration: use new pricePlanId if provided, else use appointment's current duration
      let durationMinutes = baseAppointment?.durationMinutes ?? 60
      if (baseAppointment?.type === 'discovery') {
        durationMinutes = 15
      } else if (payload.body.pricePlanId) {
        const plan = calendar.consultationPricePlansById.value[payload.body.pricePlanId]
        durationMinutes = plan?.durationMinutes ?? durationMinutes
      }

      triggerConflictHighlight({
        startAt,
        durationMinutes
      })
    }
    return
  }

  if (result.kind === 'forbidden') {
    toast.add({
      title: 'Accès non autorisé',
      description: 'Vous n\'êtes pas autorisé à modifier ce rendez-vous.',
      color: 'error'
    })
    return
  }

  if (result.kind === 'unknown') {
    toast.add({
      title: 'Erreur',
      description: result.message,
      color: 'error'
    })
  }
}

async function onMarkCompletedAppointment(payload: { appointmentId: string }) {
  const result = await calendar.markAppointmentCompleted(payload.appointmentId)

  if (result.ok) {
    toast.add({
      title: 'Consultation terminée',
      description: 'La consultation a été marquée comme terminée.',
      color: 'primary'
    })
    closeDrawer()
    return
  }

  if (result.kind === 'not_paid') {
    toast.add({
      title: 'Paiement requis',
      description: 'Le paiement doit être effectué avant de marquer la consultation comme terminée.',
      color: 'error'
    })
    return
  }

  if (result.kind === 'forbidden') {
    toast.add({
      title: 'Accès non autorisé',
      description: 'Vous n\'êtes pas autorisé à modifier ce rendez-vous.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: 'Erreur',
    description: result.message,
    color: 'error'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top bar with navigation and actions -->
    <ProviderCalendarTopBar
      :view="calendar.view.value"
      :is-loading="calendar.pending.value"
      :range-label="weekRangeLabel ?? dayLabel ?? monthLabel"
      @prev="calendar.goPrev"
      @today="calendar.goToday"
      @next="calendar.goNext"
      @update:view="calendar.setView"
      @refresh="onRetry"
      @create="onCreateAppointment"
    />

    <!-- Display options -->
    <ProviderCalendarDisplayOptions
      :type-filter="displayTypeFilter"
      :disabled="calendar.pending.value"
      @update:type-filter="setDisplayTypeFilter"
    />

    <!-- Alerts -->
    <UAlert
      v-if="noticeMessage"
      color="info"
      variant="soft"
      :description="noticeMessage"
      icon="i-lucide-info"
    />

    <UAlert
      v-else-if="isFilterEmpty"
      color="info"
      variant="soft"
      title="Filtre actif"
      description="Aucun rendez-vous ne correspond à ce filtre sur la période."
      icon="i-lucide-filter"
    />

    <UAlert
      v-if="calendar.errorMessage.value"
      color="error"
      variant="soft"
      title="Erreur"
      :description="calendar.errorMessage.value"
      icon="i-lucide-alert-circle"
    />

    <!-- Loading state -->
    <UCard
      v-if="calendar.pending.value && !calendar.data.value"
      class="bg-white"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <USkeleton class="h-5 w-5 rounded-full" />
          <USkeleton class="h-5 w-32" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-24 w-full" />
        </div>
      </div>
    </UCard>

    <!-- Empty state (non-bloquant) -->
    <UAlert
      v-if="isRangeEmpty"
      color="neutral"
      variant="soft"
      icon="i-lucide-calendar-x"
      title="Aucun rendez-vous sur cette période"
      description="Cliquez sur un créneau du calendrier pour créer un RDV."
    />

    <!-- Week view -->
    <ProviderCalendarWeekView
      v-if="!calendar.pending.value || calendar.data.value"
      v-show="calendar.view.value === 'week'"
      :time-zone="calendar.timeZone.value"
      :days="weekDays"
      :appointments="visibleAppointments"
      :consultation-price-plans-by-id="calendar.consultationPricePlansById.value"
      :px-per-minute="1"
      :highlight="conflictHighlight"
      @select:appointment="onSelectAppointment"
      @select:empty="onSelectEmpty"
    />

    <!-- Day view -->
    <ProviderCalendarWeekView
      v-if="!calendar.pending.value || calendar.data.value"
      v-show="calendar.view.value === 'day'"
      mode="day"
      :time-zone="calendar.timeZone.value"
      :days="dayDays"
      :appointments="visibleAppointments"
      :consultation-price-plans-by-id="calendar.consultationPricePlansById.value"
      :px-per-minute="1"
      :highlight="conflictHighlight"
      @select:appointment="onSelectAppointment"
      @select:empty="onSelectEmpty"
    />

    <!-- Month view -->
    <ProviderCalendarMonthView
      v-if="!calendar.pending.value || calendar.data.value"
      v-show="calendar.view.value === 'month'"
      :time-zone="calendar.timeZone.value"
      :anchor-date="calendar.anchorDate.value"
      :appointments="visibleAppointments"
      :consultation-price-plans-by-id="calendar.consultationPricePlansById.value"
      :highlight="monthHighlight"
      @select:appointment="onSelectAppointment"
      @select:day="onSelectMonthDay"
    />

    <!-- Drawers and Modals -->
    <ProviderCalendarAppointmentDrawer
      :open="isDrawerOpen"
      :appointment="selectedAppointment"
      :time-zone="calendar.timeZone.value"
      :consultation-price-plans-by-id="calendar.consultationPricePlansById.value"
      :action-pending="calendar.actionPending.value"
      :action-error="calendar.actionErrorMessage.value"
      :action-field-errors="calendar.actionFieldErrors.value"
      @update:open="(open) => { if (!open) closeDrawer() }"
      @edit="onEditAppointment"
      @request-cancel="onRequestCancelAppointment"
      @mark-completed="onMarkCompletedAppointment"
    />

    <ProviderCalendarCreateAppointmentModal
      :open="isCreateModalOpen"
      :time-zone="calendar.timeZone.value"
      :initial-day-key="createInitialDayKey"
      :initial-minutes="createInitialMinutes"
      :initial-type="createInitialType"
      :initial-client-profile-id="createInitialClientProfileId"
      :known-clients="knownClients"
      :consultation-price-plans="Object.values(calendar.consultationPricePlansById.value)"
      :loading="calendar.actionPending.value"
      :error="createErrorMessage"
      :field-errors="createFieldErrors"
      @update:open="setCreateModalOpen"
      @reset="calendar.clearActionErrors"
      @submit="onCreateAppointmentSubmit"
    />

    <ProviderCalendarEditAppointmentModal
      :open="isEditModalOpen"
      :appointment="editAppointment"
      :time-zone="calendar.timeZone.value"
      :consultation-price-plans="Object.values(calendar.consultationPricePlansById.value)"
      :loading="calendar.actionPending.value"
      :error="editErrorMessage"
      :field-errors="editFieldErrors"
      @update:open="setEditModalOpen"
      @submit="onEditAppointmentSubmit"
    />

    <ProviderCalendarCancelAppointmentModal
      :open="isCancelModalOpen"
      :appointment="cancelAppointment"
      :time-zone="calendar.timeZone.value"
      :loading="calendar.actionPending.value"
      :error="cancelErrorMessage"
      :field-errors="cancelFieldErrors"
      @update:open="setCancelModalOpen"
      @submit="onCancelAppointmentSubmit"
    />
  </div>
</template>
