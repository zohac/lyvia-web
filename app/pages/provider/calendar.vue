<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import ProviderCalendarAppointmentDrawer from '../../components/organisms/ProviderCalendarAppointmentDrawer.vue'
import ProviderCalendarCancelAppointmentModal from '../../components/organisms/ProviderCalendarCancelAppointmentModal.vue'
import ProviderCalendarCreateAppointmentModal from '../../components/organisms/ProviderCalendarCreateAppointmentModal.vue'
import ProviderCalendarEditAppointmentModal from '../../components/organisms/ProviderCalendarEditAppointmentModal.vue'
import ProviderCalendarDisplayOptions from '../../components/organisms/ProviderCalendarDisplayOptions.vue'
import ProviderCalendarTopBar from '../../components/organisms/ProviderCalendarTopBar.vue'
import ProviderCalendarMonthView from '../../components/organisms/ProviderCalendarMonthView.vue'
import ProviderCalendarWeekView from '../../components/organisms/ProviderCalendarWeekView.vue'
import { useProviderCalendar } from '../../features/calendar/useProviderCalendar'
import type { ProviderAppointmentListItem, ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
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
const createIdempotencyKey = ref<string | null>(null)

const knownClients = computed(() => {
  const byId = new Map<string, { label: string, value: string }>()
  for (const appointment of calendar.sortedAppointments.value) {
    if (!appointment.clientProfileId) continue
    if (byId.has(appointment.clientProfileId)) continue
    byId.set(appointment.clientProfileId, {
      value: appointment.clientProfileId,
      label: `${appointment.firstname} ${appointment.lastname}`.trim()
    })
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr-FR'))
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

function openCreateModal(input: { dayKey: string, minutes: number }) {
  noticeMessage.value = null
  closeDrawer()
  calendar.clearActionErrors()

  createInitialDayKey.value = input.dayKey
  createInitialMinutes.value = input.minutes
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
      description: 'Vous n’êtes pas autorisé à annuler ce rendez-vous.',
      color: 'primary'
    })
    return
  }

  toast.add({
    title: 'Erreur',
    description: result.message,
    color: 'primary'
  })
}

async function onCreateAppointmentSubmit(payload: { body: { type: 'discovery' | 'consultation', startAt: string, durationMinutes?: number, clientProfileId: string, notes?: string | null } }) {
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

  if (result.kind === 'overlap') {
    toast.add({
      title: 'Créneau déjà pris',
      description: 'Ce créneau vient d’être réservé. Choisissez-en un autre.',
      color: 'primary'
    })
    triggerConflictHighlight({
      startAt: payload.body.startAt,
      durationMinutes: payload.body.type === 'discovery' ? 15 : (payload.body.durationMinutes ?? 60)
    })
    return
  }

  if (result.kind === 'unknown') {
    toast.add({
      title: 'Erreur',
      description: result.message,
      color: 'primary'
    })
  }
}

async function onEditAppointmentSubmit(payload: { appointmentId: string, body: { startAt?: string, durationMinutes?: number, notes?: string | null } }) {
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
      description: 'Ce créneau vient d’être réservé. Choisissez-en un autre.',
      color: 'primary'
    })

    const baseAppointment = editAppointment.value
    const startAt = payload.body.startAt ?? baseAppointment?.startAt
    if (startAt) {
      triggerConflictHighlight({
        startAt,
        durationMinutes: baseAppointment?.type === 'discovery' ? 15 : (payload.body.durationMinutes ?? baseAppointment?.durationMinutes ?? 60)
      })
    }
    return
  }

  if (result.kind === 'forbidden') {
    toast.add({
      title: 'Accès non autorisé',
      description: 'Vous n’êtes pas autorisé à modifier ce rendez-vous.',
      color: 'primary'
    })
    return
  }

  if (result.kind === 'unknown') {
    toast.add({
      title: 'Erreur',
      description: result.message,
      color: 'primary'
    })
  }
}
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
      v-else-if="isFilterEmpty"
      variant="info"
      title="Filtre actif"
      description="Aucun rendez-vous ne correspond à ce filtre sur la période."
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
      v-else-if="isRangeEmpty"
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
      :highlight="conflictHighlight"
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
      :highlight="conflictHighlight"
      @select:appointment="onSelectAppointment"
      @select:empty="onSelectEmpty"
    />

    <ProviderCalendarMonthView
      v-else-if="calendar.view.value === 'month'"
      :time-zone="calendar.timeZone.value"
      :anchor-date="calendar.anchorDate.value"
      :appointments="visibleAppointments"
      :highlight="monthHighlight"
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

    <ProviderCalendarAppointmentDrawer
      :open="isDrawerOpen"
      :appointment="selectedAppointment"
      :time-zone="calendar.timeZone.value"
      :action-pending="calendar.actionPending.value"
      :action-error="calendar.actionErrorMessage.value"
      :action-field-errors="calendar.actionFieldErrors.value"
      @update:open="(open) => { if (!open) closeDrawer() }"
      @edit="onEditAppointment"
      @request-cancel="onRequestCancelAppointment"
    />

    <ProviderCalendarCreateAppointmentModal
      :open="isCreateModalOpen"
      :time-zone="calendar.timeZone.value"
      :initial-day-key="createInitialDayKey"
      :initial-minutes="createInitialMinutes"
      :known-clients="knownClients"
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
