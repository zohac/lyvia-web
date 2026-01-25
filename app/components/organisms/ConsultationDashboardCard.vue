<!--
  ConsultationDashboardCard.vue

  Organisme : Carte dashboard affichant l'état de la prochaine consultation cliente.

  États gérés :
  - loading: Skeleton pulsant pendant le chargement
  - error: Message d'erreur avec retry
  - onboarding_required: CTA "Réserver l'appel découverte"
  - no_consultation: État neutre informatif
  - awaiting_payment: CTA "Payer ma consultation"
  - payment_confirmed: État succès avec résumé RDV

  @see Ticket RF6 - Front : dashboard cliente (CTA paiement RDV assigné)
-->
<script setup lang="ts">
import type { ConsultationDashboardState } from '../../features/consultation/api/next-consultation.contract'
import {
  formatDateLong,
  formatTimeRange,
  formatPrice
} from '../../features/consultation/useClientNextConsultation'

/**
 * Props interface for ConsultationDashboardCard
 */
interface Props {
  /** Current loading state */
  pending: boolean
  /** Error message to display, if any */
  errorMessage: string | null
  /** Derived display state from composable */
  displayState: ConsultationDashboardState | null
}

const props = defineProps<Props>()

/**
 * Emits for parent component interaction
 */
const emit = defineEmits<{
  /** Triggered when user clicks retry on error state */
  retry: []
  /** Triggered when user requests cancellation (RF5) */
  requestCancel: [appointmentId: string]
  /** Triggered when user requests reschedule (RF5) */
  requestReschedule: [appointmentId: string]
}>()

/**
 * Computed payment URL with appointmentId
 */
const paymentUrl = computed(() => {
  if (props.displayState?.kind !== 'awaiting_payment') return null
  return `/client/consultation/pay?appointmentId=${props.displayState.appointmentId}`
})

/**
 * Formatted display values for awaiting_payment state
 */
const awaitingPaymentDisplay = computed(() => {
  if (props.displayState?.kind !== 'awaiting_payment') return null
  const { scheduledAt, durationMinutes, amountCents } = props.displayState
  return {
    date: formatDateLong(scheduledAt),
    timeRange: formatTimeRange(scheduledAt, durationMinutes),
    duration: `${durationMinutes} min`,
    price: formatPrice(amountCents)
  }
})

/**
 * Formatted display values for payment_confirmed state
 */
const confirmedDisplay = computed(() => {
  if (props.displayState?.kind !== 'payment_confirmed') return null
  const { scheduledAt, durationMinutes, meetingLink } = props.displayState
  return {
    date: formatDateLong(scheduledAt),
    timeRange: formatTimeRange(scheduledAt, durationMinutes),
    duration: `${durationMinutes} min`,
    meetingLink
  }
})
</script>

<template>
  <UCard
    class="bg-white"
    aria-labelledby="consultation-card-title"
  >
    <!-- Loading State -->
    <div
      v-if="pending"
      class="space-y-4"
      aria-busy="true"
      aria-label="Chargement de votre prochaine consultation"
    >
      <div class="space-y-2">
        <USkeleton class="h-7 w-48" />
        <USkeleton class="h-4 w-72" />
      </div>
      <div class="flex items-center gap-3">
        <USkeleton class="h-12 w-12 rounded-xl" />
        <div class="space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-3 w-24" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="space-y-4"
      role="alert"
      aria-live="assertive"
    >
      <UAlert
        color="error"
        variant="soft"
        :title="errorMessage"
        icon="i-lucide-alert-circle"
      >
        <template #actions>
          <UButton
            variant="link"
            color="error"
            size="sm"
            leading-icon="i-lucide-refresh-cw"
            @click="emit('retry')"
          >
            Réessayer
          </UButton>
        </template>
      </UAlert>
    </div>

    <!-- Onboarding Required State -->
    <div
      v-else-if="displayState?.kind === 'onboarding_required'"
      class="space-y-4"
    >
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-crepuscule-100">
          <UIcon
            name="lucide:calendar-heart"
            class="h-6 w-6 text-crepuscule-600"
          />
        </div>
        <div>
          <h2
            id="consultation-card-title"
            class="font-semibold text-stone-900"
          >
            Première étape
          </h2>
          <p class="mt-1 text-sm text-stone-500">
            Avant de réserver une consultation payante, faisons connaissance lors d'un appel découverte gratuit.
          </p>
        </div>
      </div>

      <UButton
        to="/client/onboarding/discovery"
        color="primary"
        leading-icon="i-lucide-calendar-heart"
      >
        Réserver l'appel découverte
      </UButton>
    </div>

    <!-- No Consultation State -->
    <div
      v-else-if="displayState?.kind === 'no_consultation'"
      class="space-y-4"
    >
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100">
          <UIcon
            name="lucide:calendar-check"
            class="h-6 w-6 text-stone-500"
          />
        </div>
        <div>
          <h2
            id="consultation-card-title"
            class="font-semibold text-stone-900"
          >
            Prochain rendez-vous
          </h2>
          <p class="mt-1 text-sm text-stone-500">
            Aucune consultation en attente. Votre prochaine séance apparaîtra ici dès qu'elle sera planifiée.
          </p>
        </div>
      </div>

      <p class="text-sm text-stone-400">
        En attendant, consultez vos ressources ou contactez votre coach.
      </p>
    </div>

    <!-- Awaiting Payment State -->
    <div
      v-else-if="displayState?.kind === 'awaiting_payment' && awaitingPaymentDisplay"
      class="space-y-5"
    >
      <div class="space-y-3">
        <UBadge
          color="warning"
          variant="subtle"
          size="sm"
        >
          <span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
          En attente de paiement
        </UBadge>

        <h2
          id="consultation-card-title"
          class="text-lg font-semibold text-stone-900"
        >
          Votre consultation vous attend
        </h2>
      </div>

      <!-- Appointment details -->
      <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <UIcon
              name="lucide:calendar"
              class="h-5 w-5 text-sunset-600"
            />
          </div>
          <div>
            <p class="text-sm font-semibold capitalize text-stone-900">
              {{ awaitingPaymentDisplay.date }}
            </p>
            <p class="text-xs text-stone-500">
              {{ awaitingPaymentDisplay.timeRange }} ({{ awaitingPaymentDisplay.duration }})
            </p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
          <span class="text-sm text-stone-600">
            Montant à régler
          </span>
          <span class="text-lg font-semibold text-stone-900">
            {{ awaitingPaymentDisplay.price }}
          </span>
        </div>
      </div>

      <!-- Primary CTA -->
      <UButton
        :to="paymentUrl!"
        color="primary"
        size="lg"
        block
        leading-icon="i-lucide-lock"
        trailing-icon="i-lucide-arrow-right"
        aria-describedby="consultation-card-title"
      >
        Payer {{ awaitingPaymentDisplay.price }} & confirmer
      </UButton>

      <p class="flex items-center gap-1 text-xs text-stone-400">
        <UIcon
          name="lucide:shield-check"
          class="h-3.5 w-3.5"
        />
        Paiement sécurisé par Stripe. Votre RDV sera confirmé immédiatement.
      </p>
    </div>

    <!-- Payment Confirmed State -->
    <div
      v-else-if="displayState?.kind === 'payment_confirmed' && confirmedDisplay"
      class="space-y-4"
    >
      <div class="space-y-3">
        <UBadge
          color="success"
          variant="subtle"
          size="sm"
        >
          <UIcon
            name="lucide:check-circle"
            class="mr-1 h-3.5 w-3.5"
          />
          Confirmé
        </UBadge>

        <h2
          id="consultation-card-title"
          class="text-lg font-semibold text-stone-900"
        >
          Prochain rendez-vous
        </h2>
      </div>

      <!-- Confirmed appointment details -->
      <div class="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
          <UIcon
            name="lucide:video"
            class="h-6 w-6 text-green-600"
          />
        </div>
        <div>
          <p class="font-semibold capitalize text-stone-900">
            {{ confirmedDisplay.date }}
          </p>
          <p class="text-sm text-stone-600">
            {{ confirmedDisplay.timeRange }} ({{ confirmedDisplay.duration }})
          </p>
        </div>
      </div>

      <!-- Meeting link CTA or fallback message -->
      <UButton
        v-if="confirmedDisplay.meetingLink"
        :href="confirmedDisplay.meetingLink"
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
        variant="soft"
        leading-icon="i-lucide-video"
        trailing-icon="i-lucide-external-link"
      >
        Rejoindre la visio
      </UButton>
      <p
        v-else
        class="text-sm text-stone-500"
      >
        Le lien de visio vous sera envoyé par email.
      </p>

      <!-- RF5: Actions annulation / report -->
      <div class="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        <UButton
          variant="outline"
          color="neutral"
          size="xs"
          leading-icon="i-lucide-calendar-clock"
          @click="emit('requestReschedule', displayState.appointmentId)"
        >
          Demander un report
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          leading-icon="i-lucide-calendar-x"
          class="text-stone-400 hover:text-red-600"
          @click="emit('requestCancel', displayState.appointmentId)"
        >
          Demander une annulation
        </UButton>
      </div>
    </div>
  </UCard>
</template>
