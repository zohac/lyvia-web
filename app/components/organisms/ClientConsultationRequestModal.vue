<!--
  ClientConsultationRequestModal.vue

  Modal permettant à la cliente de demander une annulation ou un report de RDV.

  États gérés :
  - 'cancel' : Demande d'annulation
  - 'reschedule' : Demande de report

  Contraintes :
  - Rendez-vous > 24h : formulaire accessible
  - Rendez-vous <= 24h : message "Contactez votre coach"
  - Demande déjà pending : affichage d'un message informatif

  Design: Crépuscule v2.0
  @see Ticket US-2, US-3 - Demandes d'annulation et report
-->
<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'
import {
  type CancellationReason,
  type RescheduleReason,
  CANCELLATION_REASON_LABELS,
  RESCHEDULE_REASON_LABELS
} from '../../features/consultation/api/appointment-request.contract'

export type RequestType = 'cancel' | 'reschedule'

export type RequestReason = CancellationReason | RescheduleReason

const props = withDefaults(
  defineProps<{
    open: boolean
    requestType: RequestType
    scheduledAt: Date | null
    durationMinutes: number | null
    /** Whether the appointment is eligible for request (> 24h) */
    canRequest?: boolean
    /** Whether a request is already pending for this appointment */
    hasPendingRequest?: boolean
    loading?: boolean
    success?: boolean
    error?: string | null
  }>(),
  {
    canRequest: true,
    hasPendingRequest: false,
    loading: false,
    success: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { type: RequestType, reason: RequestReason, details: string | null }): void
}>()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const isFullScreen = computed(() => !isDesktop.value)

const reason = ref<RequestReason>('schedule_conflict')
const details = ref('')

/**
 * Computed reason options based on request type
 */
const reasonOptions = computed(() => {
  if (props.requestType === 'cancel') {
    return Object.entries(CANCELLATION_REASON_LABELS).map(([value, label]) => ({
      label,
      value: value as CancellationReason
    }))
  }
  return Object.entries(RESCHEDULE_REASON_LABELS).map(([value, label]) => ({
    label,
    value: value as RescheduleReason
  }))
})

const title = computed(() => {
  return props.requestType === 'cancel'
    ? 'Demander une annulation'
    : 'Demander un report'
})

const description = computed(() => {
  return props.requestType === 'cancel'
    ? 'Votre demande sera transmise à votre coach pour validation.'
    : 'Votre coach vous proposera un nouveau créneau.'
})

const confirmLabel = computed(() => {
  return props.requestType === 'cancel'
    ? 'Envoyer ma demande d\'annulation'
    : 'Envoyer ma demande de report'
})

const successTitle = computed(() => {
  return props.requestType === 'cancel'
    ? 'Demande envoyée'
    : 'Demande de report envoyée'
})

const successMessage = computed(() => {
  return props.requestType === 'cancel'
    ? 'Votre demande d\'annulation a bien été transmise. Votre coach vous contactera sous peu.'
    : 'Votre demande de report a bien été transmise. Votre coach vous proposera un nouveau créneau rapidement.'
})

/**
 * Format date for display (Europe/Paris timezone)
 */
function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(date)
}

/**
 * Format time range for display
 */
function formatTimeRange(date: Date, durationMinutes: number): string {
  const startFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
  const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000)
  const endFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
  return `${startFormatter.format(date)} – ${endFormatter.format(endDate)}`
}

const appointmentDisplay = computed(() => {
  if (!props.scheduledAt || !props.durationMinutes) return null
  return {
    date: formatAppointmentDate(props.scheduledAt),
    timeRange: formatTimeRange(props.scheduledAt, props.durationMinutes),
    duration: `${props.durationMinutes} min`
  }
})

/**
 * Check if appointment is in the future
 */
const isUpcoming = computed(() => {
  if (!props.scheduledAt) return false
  return props.scheduledAt.getTime() > Date.now()
})

/**
 * Check if form can be submitted (all conditions met)
 */
const canSubmit = computed(() => {
  return isUpcoming.value && props.canRequest && !props.hasPendingRequest
})

function updateOpen(value: boolean) {
  if (props.loading) return
  emit('update:open', value)
}

function resetForm() {
  reason.value = 'schedule_conflict'
  details.value = ''
}

watch(
  () => props.open,
  (next) => {
    if (next) {
      resetForm()
    }
  }
)

function submit() {
  if (props.loading || props.success) return
  if (!canSubmit.value) return

  const trimmedDetails = details.value.trim()

  emit('submit', {
    type: props.requestType,
    reason: reason.value,
    details: trimmedDetails.length > 0 ? trimmedDetails.slice(0, 500) : null
  })
}

function close() {
  updateOpen(false)
}
</script>

<template>
  <UModal
    :open="open"
    :fullscreen="isFullScreen"
    :dismissible="!loading"
    :ui="{
      content: isFullScreen
        ? 'bg-[var(--color-surface-elevated)]'
        : 'rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg max-w-lg',
      header: isFullScreen ? 'px-6 pt-6 pb-4 border-b border-[var(--color-border-subtle)]' : 'px-8 pt-8 pb-4',
      body: isFullScreen ? 'px-6 pb-6 pt-4' : 'px-8 pb-6',
      footer: isFullScreen ? 'px-6 pb-6 pt-4 border-t border-[var(--color-border-subtle)]' : 'px-8 pb-8 pt-6',
      title: 'font-serif text-2xl text-[var(--color-text-primary)]',
      description: 'text-sm text-[var(--color-text-secondary)]'
    }"
    :close="{ class: 'rounded-full' }"
    @update:open="updateOpen"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl"
          :class="requestType === 'cancel'
            ? 'bg-[var(--color-error-100)] text-[var(--color-error-500)]'
            : 'bg-[rgba(91,123,158,0.1)] text-[var(--color-info)]'"
        >
          <UIcon
            :name="requestType === 'cancel' ? 'lucide:calendar-x' : 'lucide:calendar-clock'"
            class="h-5 w-5"
          />
        </span>
        <span>{{ title }}</span>
      </div>
    </template>

    <template #description>
      {{ description }}
    </template>

    <template #body>
      <div class="grid gap-6">
        <!-- Success State -->
        <div
          v-if="success"
          class="grid gap-4"
        >
          <div class="flex items-start gap-4 rounded-xl border border-[var(--color-success-200)] bg-[var(--color-success-50)] p-5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-100)]">
              <UIcon
                name="lucide:check"
                class="h-5 w-5 text-[var(--color-success-600)]"
              />
            </span>
            <div class="grid gap-1">
              <p class="font-semibold text-[var(--color-text-primary)]">
                {{ successTitle }}
              </p>
              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ successMessage }}
              </p>
            </div>
          </div>

          <p class="text-center text-xs text-[var(--color-text-muted)]">
            <UIcon
              name="lucide:mail"
              class="mr-1 inline-block h-3.5 w-3.5"
            />
            Vous recevrez un email de confirmation.
          </p>
        </div>

        <!-- Error State -->
        <SystemAlert
          v-else-if="error"
          variant="error"
          title="Action impossible"
          :description="error"
        />

        <!-- Not Upcoming Warning -->
        <SystemAlert
          v-else-if="!isUpcoming"
          variant="warning"
          title="Rendez-vous passé"
          description="Ce rendez-vous est déjà passé ou en cours. Vous ne pouvez pas demander de modification."
        />

        <!-- Pending Request Warning -->
        <SystemAlert
          v-else-if="hasPendingRequest"
          variant="info"
          title="Demande en cours"
          description="Une demande est déjà en attente de traitement pour ce rendez-vous. Votre coach vous contactera prochainement."
        />

        <!-- Too Close to Appointment Warning (H-24) -->
        <SystemAlert
          v-else-if="!canRequest"
          variant="warning"
          title="Délai dépassé"
          description="Les demandes d'annulation ou de report doivent être effectuées au moins 24 heures avant le rendez-vous. Contactez directement votre coach."
        />

        <!-- Form -->
        <template v-else>
          <!-- Appointment Summary -->
          <div
            v-if="appointmentDisplay"
            class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] p-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] shadow-sm">
                <UIcon
                  name="lucide:calendar"
                  class="h-4.5 w-4.5 text-[var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                  {{ appointmentDisplay.date }}
                </p>
                <p class="text-xs text-[var(--color-text-muted)]">
                  {{ appointmentDisplay.timeRange }} ({{ appointmentDisplay.duration }})
                </p>
              </div>
            </div>
          </div>

          <!-- Reason Selection -->
          <div class="grid gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5 shadow-sm">
            <div class="grid gap-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Motif de votre demande
              </label>
              <USelect
                v-model="reason"
                :items="reasonOptions"
                :disabled="loading"
                class="w-full"
              />
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Précisions (optionnel)
              </label>
              <UTextarea
                v-model="details"
                :rows="3"
                :placeholder="requestType === 'cancel'
                  ? 'Ajoutez des informations utiles pour votre coach...'
                  : 'Précisez vos disponibilités pour un nouveau créneau...'"
                :disabled="loading"
              />
              <p class="text-right text-xs text-[var(--color-text-muted)]">
                {{ details.length }}/500
              </p>
            </div>
          </div>

          <!-- Info Notice -->
          <div class="flex items-start gap-3 rounded-xl bg-[rgba(91,123,158,0.08)] p-4">
            <UIcon
              name="lucide:info"
              class="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--color-info)]"
            />
            <p class="text-sm text-[var(--color-text-secondary)]">
              <template v-if="requestType === 'cancel'">
                L'annulation définitive sera confirmée par votre coach.
                Les conditions de remboursement s'appliquent selon les délais prévus.
              </template>
              <template v-else>
                Votre coach vous contactera pour convenir d'un nouveau créneau qui vous convient.
              </template>
            </p>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <template v-if="success">
          <UButton
            color="primary"
            class="rounded-full"
            @click="close"
          >
            Fermer
          </UButton>
        </template>

        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            class="rounded-full"
            :disabled="loading"
            @click="close"
          >
            Annuler
          </UButton>

          <UButton
            :color="requestType === 'cancel' ? 'error' : 'primary'"
            class="rounded-full"
            :disabled="loading || !canSubmit"
            :loading="loading"
            @click="submit"
          >
            <UIcon
              v-if="!loading"
              :name="requestType === 'cancel' ? 'lucide:send' : 'lucide:calendar-clock'"
              class="mr-1.5 h-4 w-4"
            />
            {{ confirmLabel }}
          </UButton>
        </template>
      </div>
    </template>
  </UModal>
</template>
