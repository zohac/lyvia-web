<!--
  ClientConsultationRequestModal.vue

  Modal permettant à la cliente de demander une annulation ou un report de RDV.

  États gérés :
  - 'cancel' : Demande d'annulation
  - 'reschedule' : Demande de report

  En V0, sans endpoint backend, affiche une confirmation que la demande sera traitée.

  @see Ticket RF5 - Front : demande annulation / report (client)
-->
<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'

export type RequestType = 'cancel' | 'reschedule'

export type RequestReason = 'personal' | 'health' | 'other'

const props = withDefaults(
  defineProps<{
    open: boolean
    requestType: RequestType
    scheduledAt: Date | null
    durationMinutes: number | null
    loading?: boolean
    success?: boolean
    error?: string | null
  }>(),
  {
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

const reason = ref<RequestReason>('personal')
const details = ref('')

const reasonOptions = [
  { label: 'Empêchement personnel', value: 'personal' as const },
  { label: 'Problème de santé', value: 'health' as const },
  { label: 'Autre motif', value: 'other' as const }
]

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
    ? `Envoyer ma demande d'annulation`
    : `Envoyer ma demande de report`
})

const successTitle = computed(() => {
  return props.requestType === 'cancel'
    ? 'Demande envoyée'
    : 'Demande de report envoyée'
})

const successMessage = computed(() => {
  return props.requestType === 'cancel'
    ? `Votre demande d'annulation a bien été transmise. Votre coach vous contactera sous peu.`
    : `Votre demande de report a bien été transmise. Votre coach vous proposera un nouveau créneau rapidement.`
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

function updateOpen(value: boolean) {
  if (props.loading) return
  emit('update:open', value)
}

function resetForm() {
  reason.value = 'personal'
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
  if (!isUpcoming.value) return

  const trimmedDetails = details.value.trim()

  emit('submit', {
    type: props.requestType,
    reason: reason.value,
    details: trimmedDetails || null
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
        ? 'bg-white/95 backdrop-blur-md'
        : 'rounded-blob-c border border-white/70 bg-white/90 shadow-floating backdrop-blur-md max-w-lg',
      header: isFullScreen ? 'px-6 pt-6 pb-4 border-b border-[rgba(231,229,228,0.7)]' : 'px-8 pt-8 pb-4',
      body: isFullScreen ? 'px-6 pb-6 pt-4' : 'px-8 pb-6',
      footer: isFullScreen ? 'px-6 pb-6 pt-4 border-t border-[rgba(231,229,228,0.7)]' : 'px-8 pb-8 pt-6',
      title:
        'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
      description: 'text-sm text-[color:var(--color-brand-secondary)]'
    }"
    :close="{ class: 'rounded-full' }"
    @update:open="updateOpen"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl"
          :class="requestType === 'cancel'
            ? 'bg-[rgba(239,68,68,0.1)] text-[color:var(--color-error)]'
            : 'bg-[rgba(59,130,246,0.1)] text-[color:rgb(59,130,246)]'"
        >
          <Icon
            :name="requestType === 'cancel' ? 'lucide:calendar-x' : 'lucide:calendar-clock'"
            size="20"
            aria-hidden="true"
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
          <div class="flex items-start gap-4 rounded-blob-d border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] p-5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)]">
              <Icon
                name="lucide:check"
                size="20"
                class="text-[color:var(--color-success)]"
                aria-hidden="true"
              />
            </span>
            <div class="grid gap-1">
              <p class="font-semibold text-[color:var(--color-brand-primary)]">
                {{ successTitle }}
              </p>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                {{ successMessage }}
              </p>
            </div>
          </div>

          <p class="text-center text-xs text-[color:var(--color-brand-muted)]">
            <Icon
              name="lucide:mail"
              size="14"
              class="mr-1 inline-block"
              aria-hidden="true"
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

        <!-- Form -->
        <template v-else>
          <!-- Appointment Summary -->
          <div
            v-if="appointmentDisplay"
            class="rounded-blob-d border border-[color:var(--color-brand-subtle)]/60 bg-[color:var(--color-surface-highlight)] p-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon
                  name="lucide:calendar"
                  size="18"
                  class="text-[color:var(--color-brand-accent)]"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p class="text-sm font-semibold capitalize text-[color:var(--color-brand-primary)]">
                  {{ appointmentDisplay.date }}
                </p>
                <p class="text-xs text-[color:var(--color-brand-muted)]">
                  {{ appointmentDisplay.timeRange }} ({{ appointmentDisplay.duration }})
                </p>
              </div>
            </div>
          </div>

          <!-- Reason Selection -->
          <div class="grid gap-4 rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
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
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Précisions (optionnel)
              </label>
              <UTextarea
                v-model="details"
                :rows="3"
                variant="none"
                :placeholder="requestType === 'cancel'
                  ? 'Ajoutez des informations utiles pour votre coach...'
                  : 'Précisez vos disponibilités pour un nouveau créneau...'"
                class="w-full rounded-input border border-[rgba(231,229,228,0.9)] bg-[color:var(--color-surface-highlight)] p-3 text-sm text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-muted)] focus:ring-2 focus:ring-[color:var(--color-brand-solid)]"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Info Notice -->
          <div class="flex items-start gap-3 rounded-blob-d bg-[rgba(59,130,246,0.06)] p-4">
            <Icon
              name="lucide:info"
              size="18"
              class="mt-0.5 shrink-0 text-[color:rgb(59,130,246)]"
              aria-hidden="true"
            />
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
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
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating"
            @click="close"
          >
            Fermer
          </button>
        </template>

        <template v-else>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="close"
          >
            Annuler
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
            :class="requestType === 'cancel'
              ? 'bg-[color:var(--color-error)] hover:bg-[rgba(239,68,68,0.9)]'
              : 'bg-[color:var(--color-brand-primary)]'"
            :disabled="loading || !isUpcoming"
            @click="submit"
          >
            <Icon
              v-if="loading"
              name="lucide:loader-2"
              size="16"
              class="animate-spin"
              aria-hidden="true"
            />
            <Icon
              v-else
              :name="requestType === 'cancel' ? 'lucide:send' : 'lucide:calendar-clock'"
              size="16"
              aria-hidden="true"
            />
            {{ confirmLabel }}
          </button>
        </template>
      </div>
    </template>
  </UModal>
</template>
