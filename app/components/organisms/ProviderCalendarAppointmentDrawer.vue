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
  <USlideover
    :open="open"
    :dismissible="!actionPending"
    :title="clientName"
    :ui="{
      content: 'w-full sm:max-w-[460px]',
      body: 'bg-[color:var(--color-surface-page)]'
    }"
    @update:open="updateOpen"
  >
    <template
      v-if="appointment"
      #title
    >
      <span class="mb-3 flex flex-wrap items-center gap-2 not-italic">
        <span
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
          :style="headerBadgeStyle"
        >
          <UIcon
            :name="headerIcon"
            class="size-3.5"
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
      </span>
      <span class="block font-[family-name:var(--font-serif)] text-2xl font-bold italic text-[color:var(--color-text-primary)]">
        {{ clientName }}
      </span>
    </template>

    <template
      v-if="appointment"
      #description
    >
      <span class="mt-2 flex flex-col gap-1 text-sm not-italic">
        <span
          v-if="appointment.clientEmail || appointment.clientPhone"
          class="flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <a
            v-if="appointment.clientEmail"
            :href="`mailto:${appointment.clientEmail}`"
            class="inline-flex items-center gap-1.5 text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
          >
            <UIcon
              name="lucide:mail"
              class="size-3.5"
            />
            {{ appointment.clientEmail }}
          </a>
          <a
            v-if="appointment.clientPhone"
            :href="`tel:${appointment.clientPhone}`"
            class="inline-flex items-center gap-1.5 text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
          >
            <UIcon
              name="lucide:phone"
              class="size-3.5"
            />
            {{ appointment.clientPhone }}
          </a>
        </span>
        <span class="capitalize text-[color:var(--color-text-secondary)]">{{ dateTimeSummary }}</span>
        <span class="text-xs text-[color:var(--color-text-muted)]">Source : <span class="font-mono">{{ appointment.source }}</span></span>
      </span>
    </template>

    <template #body>
      <div
        v-if="appointment"
        class="flex flex-col gap-4"
      >
        <UAlert
          v-if="actionError"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="actionError"
          icon="i-lucide-alert-circle"
        />

        <!-- Tarif -->
        <section
          v-if="appointment.type === 'consultation' && consultationPricingSummary"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Tarif
            </h3>
            <span
              v-if="consultationPricingDetails?.isActive === false"
              class="inline-flex items-center rounded-full bg-[color:var(--color-sunset-100)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-sunset-700)]"
            >
              Inactif
            </span>
          </div>

          <div class="mt-3 grid gap-1 text-sm text-[color:var(--color-text-muted)]">
            <p class="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {{ consultationPricingSummary.title }}
            </p>
            <p v-if="consultationPricingSummary.subtitle">
              {{ consultationPricingSummary.subtitle }}
            </p>
            <p v-if="paymentLabel">
              {{ appointment.paymentStatus === 'paid' ? 'Réglé · virement Stripe à venir' : 'Paiement en attente' }}
            </p>
          </div>
        </section>

        <!-- Lien visio -->
        <section
          v-if="(appointment.type === 'consultation' || appointment.type === 'free_followup') && appointment.meetingLink"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Lien visio
            </h3>
            <div class="flex items-center gap-2">
              <UButton
                :to="appointment.meetingLink"
                target="_blank"
                external
                color="primary"
                variant="soft"
                size="xs"
                icon="lucide:video"
              >
                Rejoindre
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="meetingLinkCopied ? 'lucide:check' : 'lucide:copy'"
                :disabled="actionPending"
                aria-label="Copier le lien"
                @click="copyMeetingLink"
              />
            </div>
          </div>
          <p class="mt-3 break-all text-sm text-[color:var(--color-text-secondary)]">
            {{ appointment.meetingLink }}
          </p>
        </section>

        <!-- Notes -->
        <section class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5">
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Notes
          </h3>
          <div class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            <p
              v-if="appointment.notes"
              class="whitespace-pre-line text-[color:var(--color-text-secondary)]"
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

        <!-- Clôture (consultation) -->
        <section
          v-if="appointment.type === 'consultation'"
          class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Clôture
            </h3>
            <UTooltip
              v-if="!canMarkCompleted"
              :text="markCompletedDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <UButton
                  color="success"
                  variant="soft"
                  size="xs"
                  icon="lucide:check-circle"
                  disabled
                >
                  Marquer terminée
                </UButton>
              </span>
            </UTooltip>
            <UButton
              v-else
              color="success"
              variant="soft"
              size="xs"
              icon="lucide:check-circle"
              :disabled="actionPending"
              @click="requestMarkCompleted"
            >
              Marquer terminée
            </UButton>
          </div>
          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            Marque cette consultation comme terminée une fois la séance effectuée.
          </p>
        </section>

        <!-- Annulation -->
        <section class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Annulation
            </h3>
            <UTooltip
              v-if="!canCancel"
              :text="cancelDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <UButton
                  color="error"
                  variant="soft"
                  size="xs"
                  icon="lucide:ban"
                  disabled
                >
                  Annuler
                </UButton>
              </span>
            </UTooltip>
            <UButton
              v-else
              color="error"
              variant="soft"
              size="xs"
              icon="lucide:ban"
              :disabled="actionPending"
              @click="requestCancelAppointment"
            >
              Annuler
            </UButton>
          </div>
          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            L'annulation envoie une notification et libère le créneau (si applicable).
          </p>
        </section>

        <!-- Remboursement (RDV annulé et payé uniquement) -->
        <section
          v-if="showRefundButton"
          class="rounded-2xl border border-[color:var(--color-sunset-200)] bg-[color:var(--color-sunset-50)] p-5"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-sunset-700)]">
              Remboursement
            </h3>
            <UButton
              :to="stripeRefundUrl"
              target="_blank"
              external
              variant="soft"
              color="warning"
              size="xs"
              icon="lucide:external-link"
            >
              Rembourser via Stripe
            </UButton>
          </div>
          <p class="mt-3 text-sm text-[color:var(--color-sunset-700)]">
            Ce rendez-vous a été annulé après paiement. Vous pouvez effectuer un remboursement total ou partiel via Stripe.
          </p>
        </section>
      </div>

      <div
        v-else
        class="grid gap-2"
      >
        <p class="font-[family-name:var(--font-serif)] text-xl font-bold italic text-[color:var(--color-text-primary)]">
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
  </USlideover>
</template>
