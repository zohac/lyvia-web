<template>
  <div
    class="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4 transition-colors"
    :class="lineClasses"
  >
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <!-- Temporal icon -->
      <span
        class="mt-0.5 h-5 w-5 shrink-0"
        :class="iconClasses"
      >
        <svg
          v-if="temporalContext === 'upcoming'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <svg
          v-else-if="appointment.status === 'cancelled'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>

      <div class="min-w-0 flex-1">
        <!-- Type + Date/Time -->
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span class="font-medium text-[color:var(--color-brand-primary)]">
            {{ typeLabel }}
          </span>
          <span class="text-sm text-[color:var(--color-brand-secondary)]">
            {{ dateTime.full }}
          </span>
        </div>

        <!-- Duration + Payment status -->
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
          <span>{{ appointment.durationMinutes }} min</span>
          <span
            v-if="appointment.paymentStatus !== 'not_required'"
            :class="paymentStatusClass"
          >
            {{ paymentStatusLabel }}
          </span>
        </div>

        <!-- Cancellation info -->
        <div
          v-if="appointment.status === 'cancelled' && cancellationInfo"
          class="mt-2 text-xs text-[color:var(--color-error)]"
        >
          {{ cancellationInfo }}
        </div>

        <!-- Notes -->
        <div
          v-if="appointment.notes"
          class="mt-2 flex items-start gap-1.5 text-xs text-[color:var(--color-brand-secondary)]"
        >
          <UIcon
            name="i-lucide-file-text"
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand-muted)]"
          />
          <span class="line-clamp-2 italic">{{ appointment.notes }}</span>
        </div>

        <!-- Notification indicator (H4) -->
        <div
          v-if="notificationSummary && appointment.status !== 'cancelled'"
          class="mt-2 flex flex-wrap items-center gap-2 text-xs"
        >
          <!-- Confirmation status -->
          <span
            v-if="notificationSummary.confirmationSent"
            class="inline-flex items-center gap-1 text-[color:var(--color-success)]"
          >
            <UIcon
              name="i-lucide-mail-check"
              class="h-3.5 w-3.5"
            />
            <span>Confirmé</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 text-[color:var(--color-warning)]"
          >
            <UIcon
              name="i-lucide-mail"
              class="h-3.5 w-3.5"
            />
            <span>En attente</span>
          </span>

          <!-- Reminders sent -->
          <span
            v-if="notificationSummary.remindersSent.length > 0"
            class="inline-flex items-center gap-1 text-[color:var(--color-brand-muted)]"
          >
            <UIcon
              name="i-lucide-bell-ring"
              class="h-3.5 w-3.5"
            />
            <span>Rappels: {{ notificationSummary.remindersSent.join(', ') }}</span>
          </span>

          <!-- Upcoming reminders indicator -->
          <span
            v-else-if="temporalContext === 'upcoming' && notificationSummary.confirmationSent"
            class="inline-flex items-center gap-1 text-[color:var(--color-brand-muted)]"
          >
            <UIcon
              name="i-lucide-bell"
              class="h-3.5 w-3.5"
            />
            <span>Rappels programmés</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Actions + Status badge -->
    <div class="flex shrink-0 items-center gap-2">
      <!-- Mark completed button -->
      <UButton
        v-if="canMarkCompleted"
        size="xs"
        color="primary"
        variant="soft"
        :loading="actionPending"
        :disabled="actionPending"
        @click.stop="handleMarkCompleted"
      >
        <UIcon
          name="lucide:check-circle"
          class="mr-1 h-3.5 w-3.5"
        />
        Terminée
      </UButton>

      <!-- Status badge -->
      <UBadge
        :color="statusMeta.color"
        variant="soft"
      >
        {{ statusMeta.label }}
      </UBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppointmentDisplayItem } from '../../features/clients/api/clients.contract'
import {
  formatAppointmentDateTime,
  getAppointmentNotificationSummary,
  getAppointmentPaymentStatusLabel,
  getAppointmentStatusMeta,
  getAppointmentTypeLabel,
  getCancellationReasonLabel
} from '../../features/clients/domain/clients'

const props = withDefaults(
  defineProps<{
    /**
     * Appointment data to display.
     * Accepts both detailed and list item formats.
     */
    appointment: AppointmentDisplayItem
    /**
     * Timezone for date formatting.
     */
    timezone?: string
    /**
     * Temporal context for visual distinction.
     */
    temporalContext: 'past' | 'upcoming'
    /**
     * Show action buttons (mark completed, etc.)
     */
    showActions?: boolean
    /**
     * Disable actions (e.g. during API call)
     */
    actionPending?: boolean
  }>(),
  {
    timezone: 'Europe/Paris',
    showActions: true,
    actionPending: false
  }
)

const emit = defineEmits<{
  (e: 'mark-completed', payload: { appointmentId: string }): void
}>()

const typeLabel = computed(() => getAppointmentTypeLabel(props.appointment.type))
const statusMeta = computed(() => getAppointmentStatusMeta(props.appointment.status))
const dateTime = computed(() => formatAppointmentDateTime(props.appointment.scheduledAt, props.timezone))
const paymentStatusLabel = computed(() => getAppointmentPaymentStatusLabel(props.appointment.paymentStatus))
const notificationSummary = computed(() => {
  if (!props.appointment.notifications) return null
  return getAppointmentNotificationSummary(props.appointment)
})

const paymentStatusClass = computed(() => {
  if (props.appointment.paymentStatus === 'paid') {
    return 'text-[color:var(--color-success)]'
  }
  if (props.appointment.paymentStatus === 'unpaid') {
    return 'text-[color:var(--color-warning)]'
  }
  return ''
})

const lineClasses = computed(() => {
  if (props.appointment.status === 'cancelled') {
    return 'border-[color:var(--color-error)]/20 bg-[color:var(--color-error)]/5'
  }
  if (props.temporalContext === 'upcoming') {
    return 'border-[color:var(--color-brand-subtle)] bg-white/80 shadow-soft'
  }
  return 'border-white/70 bg-white/60'
})

const iconClasses = computed(() => {
  if (props.appointment.status === 'cancelled') {
    return 'text-[color:var(--color-error)]'
  }
  if (props.temporalContext === 'upcoming') {
    return 'text-[color:var(--color-brand-primary)]'
  }
  return 'text-[color:var(--color-success)]'
})

const cancellationInfo = computed(() => {
  if (props.appointment.status !== 'cancelled') return null

  const parts: string[] = []

  if (props.appointment.cancellationReason) {
    parts.push(getCancellationReasonLabel(props.appointment.cancellationReason))
  }

  if (props.appointment.cancellationReasonText) {
    parts.push(`"${props.appointment.cancellationReasonText}"`)
  }

  return parts.length > 0 ? parts.join(' — ') : 'Annulé'
})

/**
 * Can mark a consultation as completed when:
 * - type = 'consultation'
 * - status = 'scheduled'
 * - paymentStatus = 'paid'
 * - scheduledAt < now (date passée)
 */
const canMarkCompleted = computed(() => {
  if (!props.showActions) return false
  const apt = props.appointment
  if (apt.type !== 'consultation') return false
  if (apt.status !== 'scheduled') return false
  if (apt.paymentStatus !== 'paid') return false
  // Must be in the past
  return new Date(apt.scheduledAt) < new Date()
})

function handleMarkCompleted() {
  if (!canMarkCompleted.value || props.actionPending) return
  emit('mark-completed', { appointmentId: props.appointment.id })
}
</script>
