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
  formatTime,
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
    time: formatTime(scheduledAt),
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
  const { scheduledAt, durationMinutes } = props.displayState
  return {
    date: formatDateLong(scheduledAt),
    time: formatTime(scheduledAt),
    timeRange: formatTimeRange(scheduledAt, durationMinutes),
    duration: `${durationMinutes} min`
  }
})
</script>

<template>
  <section
    class="consultation-card relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/50 p-8 shadow-soft"
    aria-labelledby="consultation-card-title"
  >
    <!-- Decorative blob background -->
    <div
      class="pointer-events-none absolute right-[-10%] top-[-30%] h-[22rem] w-[22rem] rounded-full bg-[color:var(--color-kaora-100)] opacity-45 blur-[90px] transition-opacity duration-500"
      :class="{ 'opacity-60': displayState?.kind === 'awaiting_payment' }"
      aria-hidden="true"
    />

    <!-- Loading State (Skeleton) -->
    <div
      v-if="pending"
      class="relative z-10 grid gap-4"
      aria-busy="true"
      aria-label="Chargement de votre prochaine consultation"
    >
      <div class="grid gap-2">
        <div class="h-7 w-48 animate-pulse rounded-lg bg-[color:var(--color-brand-subtle)]" />
        <div class="h-4 w-72 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
      </div>
      <div class="mt-2 flex gap-3">
        <div class="h-10 w-10 animate-pulse rounded-xl bg-[color:var(--color-brand-subtle)]" />
        <div class="grid gap-1">
          <div class="h-4 w-32 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
          <div class="h-3 w-24 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="relative z-10 grid gap-4"
      role="alert"
      aria-live="assertive"
    >
      <div class="grid gap-2">
        <h2
          id="consultation-card-title"
          class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
        >
          Oups !
        </h2>
        <p class="text-sm text-[color:var(--color-error)]">
          {{ errorMessage }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:shadow-floating focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
        @click="emit('retry')"
      >
        <Icon
          name="lucide:refresh-cw"
          size="16"
          aria-hidden="true"
        />
        Réessayer
      </button>
    </div>

    <!-- Onboarding Required State -->
    <div
      v-else-if="displayState?.kind === 'onboarding_required'"
      class="relative z-10 grid gap-4"
    >
      <div class="grid gap-2">
        <h2
          id="consultation-card-title"
          class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
        >
          Première étape
        </h2>
        <p class="max-w-md text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
          Avant de réserver une consultation payante, faisons connaissance lors d'un appel découverte gratuit.
        </p>
      </div>

      <ULink
        to="/client/onboarding/discovery"
        class="cta-button inline-flex w-fit items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgba(28,25,23,0.25)]"
      >
        <Icon
          name="lucide:calendar-heart"
          size="18"
          aria-hidden="true"
        />
        Réserver l'appel découverte
      </ULink>
    </div>

    <!-- No Consultation State -->
    <div
      v-else-if="displayState?.kind === 'no_consultation'"
      class="relative z-10 grid gap-4"
    >
      <div class="grid gap-2">
        <h2
          id="consultation-card-title"
          class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
        >
          Prochain rendez-vous
        </h2>
        <p class="max-w-md text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
          Aucune consultation en attente. Votre prochaine séance apparaîtra ici dès qu'elle sera planifiée.
        </p>
      </div>

      <div class="flex items-center gap-3 text-[color:var(--color-brand-muted)]">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)]">
          <Icon
            name="lucide:calendar-check"
            size="20"
            aria-hidden="true"
          />
        </div>
        <span class="text-sm">
          En attendant, consultez vos ressources ou contactez votre coach.
        </span>
      </div>
    </div>

    <!-- Awaiting Payment State -->
    <div
      v-else-if="displayState?.kind === 'awaiting_payment' && awaitingPaymentDisplay"
      class="relative z-10 grid gap-5"
    >
      <!-- Glow effect for attention -->
      <div
        class="pointer-events-none absolute -inset-4 rounded-blob-a bg-gradient-to-br from-[color:var(--color-kaora-200)]/20 to-transparent opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div class="grid gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-warning)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-warning)]">
            <span
              class="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-warning)]"
              aria-hidden="true"
            />
            En attente de paiement
          </span>
        </div>
        <h2
          id="consultation-card-title"
          class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
        >
          Votre consultation vous attend
        </h2>
      </div>

      <!-- Appointment details -->
      <div class="grid gap-3 rounded-blob-d border border-[color:var(--color-brand-subtle)]/60 bg-white/60 p-4 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)] shadow-sm">
            <Icon
              name="lucide:calendar"
              size="20"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <p class="text-sm font-semibold capitalize text-[color:var(--color-brand-primary)]">
              {{ awaitingPaymentDisplay.date }}
            </p>
            <p class="text-xs text-[color:var(--color-brand-muted)]">
              {{ awaitingPaymentDisplay.timeRange }} ({{ awaitingPaymentDisplay.duration }})
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-[color:var(--color-brand-subtle)]/50 pt-3">
          <span class="text-sm text-[color:var(--color-brand-secondary)]">
            Montant à régler
          </span>
          <span class="font-serif text-lg font-semibold text-[color:var(--color-brand-primary)]">
            {{ awaitingPaymentDisplay.price }}
          </span>
        </div>
      </div>

      <!-- Primary CTA -->
      <ULink
        :to="paymentUrl!"
        class="cta-payment group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-floating transition-base hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgba(28,25,23,0.25)] sm:w-fit"
        aria-describedby="consultation-card-title"
      >
        <Icon
          name="lucide:lock"
          size="16"
          class="transition-transform group-hover:scale-110"
          aria-hidden="true"
        />
        Payer {{ awaitingPaymentDisplay.price }} & confirmer
        <Icon
          name="lucide:arrow-right"
          size="16"
          class="transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </ULink>

      <p class="text-xs text-[color:var(--color-brand-muted)]">
        <Icon
          name="lucide:shield-check"
          size="14"
          class="mr-1 inline-block"
          aria-hidden="true"
        />
        Paiement sécurisé par Stripe. Votre RDV sera confirmé immédiatement.
      </p>
    </div>

    <!-- Payment Confirmed State -->
    <div
      v-else-if="displayState?.kind === 'payment_confirmed' && confirmedDisplay"
      class="relative z-10 grid gap-4"
    >
      <div class="grid gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-success)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-success)]">
            <Icon
              name="lucide:check-circle"
              size="14"
              aria-hidden="true"
            />
            Confirmé
          </span>
        </div>
        <h2
          id="consultation-card-title"
          class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
        >
          Prochain rendez-vous
        </h2>
      </div>

      <!-- Confirmed appointment details -->
      <div class="flex items-center gap-4 rounded-blob-d border border-[color:var(--color-success)]/20 bg-[color:var(--color-success)]/5 p-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-success)]/15 shadow-sm">
          <Icon
            name="lucide:video"
            size="24"
            class="text-[color:var(--color-success)]"
            aria-hidden="true"
          />
        </div>
        <div>
          <p class="text-base font-semibold capitalize text-[color:var(--color-brand-primary)]">
            {{ confirmedDisplay.date }}
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            {{ confirmedDisplay.timeRange }} ({{ confirmedDisplay.duration }})
          </p>
        </div>
      </div>

      <p class="text-sm text-[color:var(--color-brand-secondary)]">
        Un email de confirmation avec le lien de visio vous a été envoyé.
      </p>

      <!-- RF5: Actions annulation / report -->
      <div class="flex flex-wrap items-center gap-2 border-t border-[color:var(--color-brand-subtle)]/40 pt-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[color:var(--color-brand-secondary)] ring-1 ring-[color:var(--color-brand-subtle)]/60 transition-base hover:bg-[color:var(--color-surface-highlight)] hover:text-[color:var(--color-brand-primary)]"
          @click="emit('requestReschedule', displayState.appointmentId)"
        >
          <Icon
            name="lucide:calendar-clock"
            size="14"
            aria-hidden="true"
          />
          Demander un report
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[color:var(--color-brand-muted)] transition-base hover:bg-[rgba(239,68,68,0.08)] hover:text-[color:var(--color-error)]"
          @click="emit('requestCancel', displayState.appointmentId)"
        >
          <Icon
            name="lucide:calendar-x"
            size="14"
            aria-hidden="true"
          />
          Demander une annulation
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.consultation-card {
  /* Smooth entrance animation */
  animation: card-fade-in 0.5s ease-out;
}

@keyframes card-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* CTA button subtle glow on hover for awaiting payment state */
.cta-payment {
  position: relative;
}

.cta-payment::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  background: linear-gradient(
    135deg,
    var(--color-kaora-300) 0%,
    var(--color-kaora-200) 50%,
    var(--color-kaora-300) 100%
  );
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.cta-payment:hover::before {
  opacity: 0.5;
}

/* Skeleton pulse animation refinement */
.animate-pulse {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
