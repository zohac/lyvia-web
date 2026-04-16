<template>
  <div
    class="flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
    :class="cardClasses"
  >
    <!-- Left: Icon + Info -->
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        :class="iconBgClass"
      >
        <UIcon
          :name="iconName"
          class="h-5 w-5"
          :class="iconClass"
        />
      </div>
      <div class="min-w-0">
        <p class="font-medium text-[color:var(--color-text-primary)]">
          {{ typeLabel }}
        </p>
        <p class="text-sm text-[color:var(--color-text-muted)]">
          {{ formattedDate }}
        </p>
      </div>
    </div>

    <!-- Right: Status + Actions -->
    <div class="flex items-center gap-2">
      <!-- Status badge -->
      <UBadge
        :color="statusBadge.color"
        variant="soft"
        size="sm"
      >
        {{ statusBadge.label }}
      </UBadge>

      <!-- US-4: Pending request badge -->
      <UBadge
        v-if="showPendingBadge"
        color="warning"
        variant="soft"
        size="sm"
      >
        <UIcon
          name="lucide:clock"
          class="mr-1 h-3 w-3"
        />
        Demande en cours
      </UBadge>

      <!-- Payment CTA for unpaid consultations -->
      <UButton
        v-if="showPayButton"
        :to="`/client/consultation/pay?appointmentId=${appointment.id}`"
        size="sm"
        color="primary"
      >
        Payer
      </UButton>

      <!-- Meeting link for paid consultations -->
      <UButton
        v-else-if="appointment.meetingLink && appointment.status === 'scheduled'"
        :href="appointment.meetingLink"
        target="_blank"
        size="sm"
        variant="soft"
        color="primary"
      >
        <UIcon
          name="lucide:video"
          class="mr-1 h-4 w-4"
        />
        Rejoindre
      </UButton>

      <!-- US-4: Actions menu for eligible appointments -->
      <UDropdownMenu
        v-if="canShowActionsMenu"
        :items="actionsMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-more-vertical"
          variant="ghost"
          color="neutral"
          size="sm"
          class="shrink-0"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientAppointmentItem } from '../../features/consultation/api/client-appointments.contract'

const props = defineProps<{
  appointment: ClientAppointmentItem
}>()

const emit = defineEmits<{
  /** Triggered when user requests cancellation */
  requestCancel: [appointmentId: string]
  /** Triggered when user requests reschedule */
  requestReschedule: [appointmentId: string]
}>()

// Type labels
const TYPE_LABELS: Record<string, string> = {
  discovery: 'Appel découverte',
  consultation: 'Consultation',
  free_followup: 'Suivi gratuit'
}
const typeLabel = computed(() => TYPE_LABELS[props.appointment.type] ?? 'Rendez-vous')

// Formatted date
const formattedDate = computed(() => {
  const date = new Date(props.appointment.scheduledAt)
  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(date)
  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(date)
  return `${dateStr} à ${timeStr} · ${props.appointment.durationMinutes} min`
})

// Status badge configuration
const statusBadge = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      if (props.appointment.paymentStatus === 'unpaid') {
        return { label: 'À payer', color: 'warning' as const }
      }
      if (props.appointment.paymentStatus === 'covered_by_program') {
        return { label: 'Couvert', color: 'success' as const }
      }
      return { label: 'À venir', color: 'primary' as const }
    case 'completed':
      return { label: 'Terminé', color: 'success' as const }
    case 'cancelled':
      return { label: 'Annulé', color: 'error' as const }
    default:
      return { label: 'Inconnu', color: 'neutral' as const }
  }
})

// Icon based on type and status
const iconName = computed(() => {
  if (props.appointment.status === 'cancelled') return 'lucide:calendar-x'
  if (props.appointment.status === 'completed') return 'lucide:check-circle'
  if (props.appointment.type === 'discovery') return 'lucide:phone'
  if (props.appointment.type === 'free_followup') return 'lucide:heart-handshake'
  return 'lucide:calendar'
})

// Icon styling
const iconBgClass = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'bg-[color:var(--color-sunset-100)]'
        : 'bg-crepuscule-100'
    case 'completed':
      return 'bg-[color:var(--color-success-100)]'
    case 'cancelled':
      return 'bg-[color:var(--color-error-100)]'
    default:
      return 'bg-[color:var(--color-surface-muted)]'
  }
})

const iconClass = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'text-[color:var(--color-sunset-600)]'
        : 'text-crepuscule-600'
    case 'completed':
      return 'text-[color:var(--color-success-600)]'
    case 'cancelled':
      return 'text-[color:var(--color-error-600)]'
    default:
      return 'text-[color:var(--color-text-secondary)]'
  }
})

// Card border styling
const cardClasses = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'border-[color:var(--color-sunset-200)] bg-[color:var(--color-sunset-50)]/50'
        : 'border-crepuscule-100 bg-[color:var(--color-surface-card)]'
    case 'completed':
      return 'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]'
    case 'cancelled':
      return 'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)]'
    default:
      return 'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]'
  }
})

// Show pay button for unpaid scheduled consultations
const showPayButton = computed(() =>
  props.appointment.type === 'consultation'
  && props.appointment.status === 'scheduled'
  && props.appointment.paymentStatus === 'unpaid'
)

/**
 * US-4: Show pending request badge
 */
const showPendingBadge = computed(() => props.appointment.hasPendingRequest)

/**
 * US-4: Check if appointment is eligible for cancel/reschedule actions
 * - consultation type (not discovery)
 * - status = scheduled
 * - paymentStatus = paid
 * - scheduledAt > now + 24h
 * - no pending request
 */
const canShowActionsMenu = computed(() => {
  const apt = props.appointment

  // Bloqué si demande en cours
  if (apt.hasPendingRequest) return false

  // Seulement consultations payées et scheduled
  if (apt.type !== 'consultation') return false
  if (apt.status !== 'scheduled') return false
  if (apt.paymentStatus !== 'paid') return false

  // Seulement si > 24h avant le RDV
  const scheduled = new Date(apt.scheduledAt)
  const hoursRemaining = (scheduled.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursRemaining > 24
})

function handleRequestReschedule() {
  emit('requestReschedule', props.appointment.id)
}

function handleRequestCancel() {
  emit('requestCancel', props.appointment.id)
}

/**
 * US-4: Actions menu items for UDropdownMenu
 */
const actionsMenuItems = computed(() => [
  {
    label: 'Demander un report',
    icon: 'i-lucide-calendar-clock',
    onSelect: handleRequestReschedule
  },
  {
    type: 'separator' as const
  },
  {
    label: 'Demander une annulation',
    icon: 'i-lucide-calendar-x',
    color: 'error' as const,
    onSelect: handleRequestCancel
  }
])
</script>
