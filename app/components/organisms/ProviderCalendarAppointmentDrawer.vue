<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { getAppointmentTypeConfig, getAppointmentDisplayStatus, STATUS_CONFIG } from '../../features/calendar/presentation/appointment-style'
import type { ConsultationPricePlanById } from '../../features/calendar/presentation/appointment-pricing'
import { formatConsultationDrawerSummary, formatCurrency, getConsultationPricePlan } from '../../features/calendar/presentation/appointment-pricing'
import { useStripeLinks } from '../../features/stripe/useStripeLinks'

const TYPE_ICON: Record<ProviderAppointmentListItem['type'], string> = {
  discovery: 'lucide:phone',
  consultation: 'lucide:video',
  free_followup: 'lucide:heart-handshake'
}
const TYPE_LABEL: Record<ProviderAppointmentListItem['type'], string> = {
  discovery: 'Découverte',
  consultation: 'Consultation',
  free_followup: 'Suivi'
}

const props = withDefaults(
  defineProps<{
    open: boolean
    appointment: ProviderAppointmentListItem | null
    timeZone: string
    consultationPricePlansById?: ConsultationPricePlanById
    actionPending?: boolean
    actionError?: string | null
    actionFieldErrors?: Record<string, string>
  }>(),
  {
    consultationPricePlansById: () => ({}),
    actionPending: false,
    actionError: null,
    actionFieldErrors: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'edit' | 'request-cancel' | 'mark-completed', payload: { appointmentId: string }): void
}>()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })

const direction = computed(() => (isDesktop.value ? 'right' : 'bottom'))
const inset = computed(() => !isDesktop.value)
const showHandle = computed(() => !isDesktop.value)

const clientName = computed(() => {
  const a = props.appointment
  if (!a) return 'Rendez-vous'
  return `${a.firstname} ${a.lastname}`.trim() || 'Rendez-vous'
})

const headerBadgeStyle = computed(() => {
  const config = getAppointmentTypeConfig(props.appointment?.type ?? 'consultation')
  return { background: config.soft, color: config.softText, borderColor: config.fill }
})
const headerIcon = computed(() => TYPE_ICON[props.appointment?.type ?? 'consultation'])
const headerLabel = computed(() => TYPE_LABEL[props.appointment?.type ?? 'consultation'])

const statusConfig = computed(() => {
  if (!props.appointment) return STATUS_CONFIG.planned
  return STATUS_CONFIG[getAppointmentDisplayStatus(props.appointment)]
})
const statusPillStyle = computed(() => ({
  background: statusConfig.value.chipBg,
  color: statusConfig.value.chipText,
  borderColor: statusConfig.value.chipBorder
}))

const paymentLabel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  if (appointment.paymentStatus === 'paid') return 'Payé'
  if (appointment.paymentStatus === 'unpaid') return 'À payer'
  return null
})

const canEdit = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus === 'paid') return false
  return true
})

const canCancel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus === 'paid') return false
  return true
})

const editDisabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.paymentStatus === 'paid') return 'Impossible de modifier un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible de modifier un rendez-vous déjà clôturé.'
  return null
})

const cancelDisabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.paymentStatus === 'paid') return 'Impossible d\'annuler un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible d\'annuler un rendez-vous déjà clôturé.'
  return null
})

/**
 * Can mark a consultation as completed when:
 * - type = 'consultation'
 * - status = 'scheduled'
 * - paymentStatus = 'paid'
 * - startAt < now (date passée)
 */
const canMarkCompleted = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.type !== 'consultation') return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus !== 'paid') return false
  // Check if appointment is in the past
  const now = new Date()
  const appointmentStart = new Date(appointment.startAt)
  return appointmentStart < now
})

const markCompletedDisabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.type !== 'consultation') return 'Seules les consultations peuvent être marquées terminées.'
  if (appointment.status !== 'scheduled') return 'Ce rendez-vous est déjà clôturé.'
  if (appointment.paymentStatus !== 'paid') return 'Le paiement doit être effectué avant de marquer terminé.'
  const now = new Date()
  const appointmentStart = new Date(appointment.startAt)
  if (appointmentStart >= now) return 'Le rendez-vous doit être passé pour être marqué terminé.'
  return null
})

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(iso))
}

const dateTimeSummary = computed(() => {
  const appointment = props.appointment
  if (!appointment) return ''
  const longDate = new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    dateStyle: 'full'
  }).format(new Date(appointment.startAt))
  return `${longDate} à ${formatTime(appointment.startAt)} · ${formatTime(appointment.endAt)} (${appointment.durationMinutes} min)`
})

function updateOpen(value: boolean) {
  if (props.actionPending) return
  emit('update:open', value)
}

function startEditAppointment() {
  const appointment = props.appointment
  if (!appointment) return
  if (!canEdit.value) return
  emit('edit', { appointmentId: appointment.id })
}

function requestCancelAppointment() {
  const appointment = props.appointment
  if (!appointment) return
  if (!canCancel.value) return
  emit('request-cancel', { appointmentId: appointment.id })
}

function requestMarkCompleted() {
  const appointment = props.appointment
  if (!appointment) return
  if (!canMarkCompleted.value) return
  emit('mark-completed', { appointmentId: appointment.id })
}

const consultationPricingSummary = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  return formatConsultationDrawerSummary(appointment, props.consultationPricePlansById)
})

const consultationPricingDetails = computed(() => {
  const appointment = props.appointment
  if (!appointment || appointment.type !== 'consultation') return null
  const plan = getConsultationPricePlan(appointment, props.consultationPricePlansById)
  return plan
    ? { price: formatCurrency(plan.amountCents), isActive: plan.isActive }
    : { price: null, isActive: null }
})

const toast = useToast()
const meetingLinkCopied = ref(false)
const stripeLinks = useStripeLinks()

/**
 * Show refund button for cancelled + paid appointments
 */
const showRefundButton = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  return stripeLinks.canRefund(appointment)
})

/**
 * Stripe refund URL
 */
const stripeRefundUrl = computed(() => {
  const appointment = props.appointment
  if (!appointment) return stripeLinks.paymentsUrl
  return stripeLinks.getPaymentUrl(appointment.stripePaymentIntentId)
})

// Reset meetingLinkCopied when drawer closes or appointment changes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      meetingLinkCopied.value = false
    }
  }
)

watch(
  () => props.appointment?.id,
  () => {
    meetingLinkCopied.value = false
  }
)

async function copyMeetingLink() {
  const link = props.appointment?.meetingLink
  if (!link) return

  try {
    await navigator.clipboard.writeText(link)
    meetingLinkCopied.value = true
    toast.add({
      title: 'Lien copié',
      color: 'success',
      icon: 'i-lucide-check'
    })
    setTimeout(() => {
      meetingLinkCopied.value = false
    }, 2000)
  } catch {
    toast.add({
      title: 'Impossible de copier le lien',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <UDrawer
    :open="open"
    :direction="direction"
    :dismissible="!actionPending"
    :overlay="true"
    :inset="inset"
    :handle="showHandle"
    :ui="{
      overlay: 'fixed inset-0 bg-black/25 backdrop-blur-sm',
      content: 'bg-[color:var(--color-surface-page)] shadow-lg',
      handle: '!bg-[color:var(--color-neutral-300)]',
      container: 'w-full flex flex-col gap-6 px-6 pb-6 pt-4 overflow-y-auto',
      header: 'pb-4 border-b border-[color:var(--color-brand-subtle)]',
      body: 'flex-1',
      footer: 'border-t border-[color:var(--color-brand-subtle)] pt-4'
    }"
    @update:open="updateOpen"
  >
    <template
      v-if="appointment"
      #header
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid min-w-0 gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              :style="headerBadgeStyle"
            >
              <Icon
                :name="headerIcon"
                size="14"
                aria-hidden="true"
              />
              {{ headerLabel }}
            </span>

            <span
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
              :style="statusPillStyle"
            >
              <span
                class="size-1.5 rounded-full"
                :style="{ background: statusConfig.dot }"
                aria-hidden="true"
              />
              {{ statusConfig.label }}
            </span>
          </div>

          <h2 class="font-[family-name:var(--font-serif)] text-2xl font-bold italic text-[color:var(--color-text-primary)]">
            {{ clientName }}
          </h2>
          <div
            v-if="appointment.clientEmail || appointment.clientPhone"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
          >
            <a
              v-if="appointment.clientEmail"
              :href="`mailto:${appointment.clientEmail}`"
              :aria-label="`Envoyer un email à ${appointment.firstname}`"
              class="inline-flex items-center gap-1.5 text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
            >
              <Icon
                name="lucide:mail"
                size="13"
                aria-hidden="true"
              />
              {{ appointment.clientEmail }}
            </a>
            <a
              v-if="appointment.clientPhone"
              :href="`tel:${appointment.clientPhone}`"
              :aria-label="`Appeler ${appointment.firstname}`"
              class="inline-flex items-center gap-1.5 text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
            >
              <Icon
                name="lucide:phone"
                size="13"
                aria-hidden="true"
              />
              {{ appointment.clientPhone }}
            </a>
          </div>
          <p class="text-sm capitalize text-[color:var(--color-text-secondary)]">
            {{ dateTimeSummary }}
          </p>
          <p class="text-xs text-[color:var(--color-text-muted)]">
            Source : <span class="font-mono">{{ appointment.source }}</span>
          </p>
        </div>

        <button
          type="button"
          class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-card)] text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-brand-subtle)] transition-all hover:bg-[color:var(--color-surface-page)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionPending"
          @click="updateOpen(false)"
        >
          <Icon
            name="lucide:x"
            size="18"
            aria-hidden="true"
          />
          <span class="sr-only">Fermer</span>
        </button>
      </div>
    </template>

    <template
      v-if="appointment"
      #body
    >
      <div class="grid gap-6">
        <UAlert
          v-if="actionError"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="actionError"
          icon="i-lucide-alert-circle"
        />

        <section
          v-if="appointment.type === 'consultation' && consultationPricingSummary"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Tarif
            </h3>

            <span
              v-if="consultationPricingDetails?.isActive === false"
              class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-card)] px-3 py-1 text-xs font-bold text-[color:var(--color-text-muted)] ring-1 ring-[color:var(--color-brand-subtle)]"
            >
              Inactif
            </span>
          </div>

          <div class="mt-4 grid gap-2 text-sm text-[color:var(--color-text-muted)]">
            <p class="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {{ consultationPricingSummary.title }}
            </p>
            <p v-if="consultationPricingSummary.subtitle">
              {{ consultationPricingSummary.subtitle }}
            </p>
            <p
              v-if="consultationPricingDetails?.price"
              class="font-semibold text-[color:var(--color-text-primary)]"
            >
              {{ consultationPricingDetails.price }}
            </p>
            <p v-if="paymentLabel">
              {{ appointment.paymentStatus === 'paid' ? 'Réglé · virement Stripe à venir' : 'Paiement en attente' }}
            </p>
          </div>
        </section>

        <!-- Lien visio (consultation + suivi gratuit) -->
        <section
          v-if="(appointment.type === 'consultation' || appointment.type === 'free_followup') && appointment.meetingLink"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Lien visio
            </h3>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <Icon
              name="lucide:video"
              size="18"
              class="shrink-0 text-keova-600"
              aria-hidden="true"
            />
            <a
              :href="appointment.meetingLink"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-keova-600 hover:underline"
            >
              Rejoindre la visio
            </a>
            <button
              type="button"
              class="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--color-surface-card)] text-[color:var(--color-text-muted)] ring-1 ring-[color:var(--color-brand-subtle)] transition-all hover:bg-[color:var(--color-surface-page)] hover:text-[color:var(--color-text-secondary)]"
              :disabled="actionPending"
              @click="copyMeetingLink"
            >
              <Icon
                :name="meetingLinkCopied ? 'lucide:check' : 'lucide:copy'"
                size="14"
                aria-hidden="true"
              />
              <span class="sr-only">Copier le lien</span>
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Notes
          </h3>

          <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            <p
              v-if="appointment.notes"
              class="whitespace-pre-line"
            >
              {{ appointment.notes }}
            </p>
            <p
              v-else
              class="italic opacity-80"
            >
              Aucune note pour le moment.
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Annulation
            </h3>

            <UTooltip
              v-if="!canCancel"
              :text="cancelDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-card)] px-4 py-2 text-xs font-bold text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-brand-subtle)] transition-all hover:bg-[color:var(--color-surface-page)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Annuler
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-card)] px-4 py-2 text-xs font-bold text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-brand-subtle)] transition-all hover:bg-[color:var(--color-surface-page)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="actionPending"
              @click="requestCancelAppointment"
            >
              <Icon
                name="lucide:ban"
                size="16"
                aria-hidden="true"
              />
              Annuler
            </button>
          </div>

          <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            <p class="opacity-90">
              L'annulation envoie une notification et libère le créneau (si applicable).
            </p>
          </div>
        </section>

        <!-- Remboursement (RDV annulé et payé uniquement) -->
        <section
          v-if="showRefundButton"
          class="rounded-lg border border-[color:var(--color-sunset-200)] bg-[color:var(--color-sunset-50)] p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-sunset-700)]">
              Remboursement
            </h3>

            <UButton
              :to="stripeRefundUrl"
              target="_blank"
              external
              variant="soft"
              color="warning"
              size="sm"
            >
              <Icon
                name="lucide:external-link"
                size="14"
                class="mr-1.5"
                aria-hidden="true"
              />
              Rembourser via Stripe
            </UButton>
          </div>

          <div class="mt-4 text-sm text-[color:var(--color-sunset-700)]">
            <p class="opacity-90">
              Ce rendez-vous a été annulé après paiement. Vous pouvez effectuer un remboursement total ou partiel via Stripe.
            </p>
          </div>
        </section>

        <!-- Marquer terminée (consultation payée passée uniquement) -->
        <section
          v-if="appointment.type === 'consultation'"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Clôture
            </h3>

            <UTooltip
              v-if="!canMarkCompleted"
              :text="markCompletedDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-card)] px-4 py-2 text-xs font-bold text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-brand-subtle)] transition-all hover:bg-[color:var(--color-surface-page)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Marquer terminée
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-success-50)] px-4 py-2 text-xs font-bold text-[color:var(--color-success-700)] ring-1 ring-[color:var(--color-success-200)] transition-all hover:bg-[color:var(--color-success-100)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="actionPending"
              @click="requestMarkCompleted"
            >
              <Icon
                name="lucide:check-circle"
                size="16"
                aria-hidden="true"
              />
              Marquer terminée
            </button>
          </div>

          <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            <p class="opacity-90">
              Marque cette consultation comme terminée une fois la séance effectuée.
            </p>
          </div>
        </section>
      </div>
    </template>

    <template
      v-else
      #body
    >
      <div class="grid gap-4">
        <p class="text-2xl font-semibold text-[color:var(--color-text-primary)]">
          Aucun rendez-vous sélectionné
        </p>
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Sélectionnez un RDV dans le calendrier pour afficher ses détails.
        </p>
      </div>
    </template>

    <template
      v-if="appointment"
      #footer
    >
      <UTooltip
        v-if="!canEdit"
        :text="editDisabledReason ?? ''"
      >
        <span class="block w-full">
          <UButton
            block
            color="neutral"
            variant="outline"
            icon="lucide:pencil"
            disabled
          >
            Modifier le rendez-vous
          </UButton>
        </span>
      </UTooltip>
      <UButton
        v-else
        block
        color="neutral"
        variant="outline"
        icon="lucide:pencil"
        :disabled="actionPending"
        @click="startEditAppointment"
      >
        Modifier le rendez-vous
      </UButton>
    </template>
  </UDrawer>
</template>
