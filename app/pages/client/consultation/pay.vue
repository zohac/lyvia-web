<!--
  pay.vue - Page de paiement pour consultation assignée (RF1)

  Flow:
  1. Récupère appointmentId depuis query params
  2. Charge le contexte de paiement via GET /client/appointments/:id/payment-context
  3. Affiche récap RDV (date, heure, durée, prix)
  4. CTA "Payer {price}" → POST /payments/consultation-session
  5. Redirect vers Stripe Checkout

  États:
  - loading: Skeleton pendant chargement
  - missing_appointment_id: Erreur si pas d'appointmentId
  - not_found / error: Message d'erreur + retour dashboard
  - already_paid: Message + retour dashboard
  - ready: Récap + CTA paiement
  - action loading: Overlay "Redirection sécurisée"

  @see Ticket RF1 - Front : page paiement consultation (créneau assigné)
  @see Ticket RF2 - Front : création checkout (RDV assigné) + redirection Stripe
-->
<script setup lang="ts">
import { useAssignedConsultationPayment } from '../../../features/consultation/useAssignedConsultationPayment'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Payer ma consultation'
})

const route = useRoute()

/**
 * Extract and validate appointmentId from query params.
 */
const appointmentId = computed(() => {
  const raw = route.query.appointmentId
  if (typeof raw !== 'string') return null
  // Basic UUID validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(raw) ? raw : null
})

/**
 * Payment composable with all state and actions.
 */
const payment = useAssignedConsultationPayment(appointmentId)

/**
 * Load context on mount.
 */
onMounted(async () => {
  await payment.loadContext()
})

/**
 * Handle primary CTA click.
 */
async function handlePayment() {
  await payment.startCheckout()
}

/**
 * Handle resume pending payment.
 */
async function handleResume() {
  await payment.resumePendingPayment()
}
</script>

<template>
  <div class="pay-page relative min-h-[60vh]">
    <!-- Background gradient decoration -->
    <div
      class="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div class="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[color:var(--color-crepuscule-100)] to-transparent opacity-30 blur-[100px]" />
    </div>

    <!-- Loading State -->
    <section
      v-if="payment.pageState.value.kind === 'loading'"
      class="relative z-10 mx-auto max-w-lg"
      aria-busy="true"
      aria-label="Chargement des informations de paiement"
    >
      <div class="grid gap-6">
        <!-- Header skeleton -->
        <div class="grid gap-2 text-center">
          <div class="mx-auto h-4 w-32 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
          <div class="mx-auto h-8 w-64 animate-pulse rounded-lg bg-[color:var(--color-brand-subtle)]" />
          <div class="mx-auto h-4 w-48 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
        </div>

        <!-- Card skeleton -->
        <div class="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft backdrop-blur-sm">
          <div class="grid gap-6">
            <div class="grid gap-4">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 animate-pulse rounded-xl bg-[color:var(--color-brand-subtle)]" />
                <div class="grid gap-2">
                  <div class="h-5 w-40 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
                  <div class="h-4 w-32 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
                </div>
              </div>
              <div class="h-px bg-[color:var(--color-brand-subtle)]" />
              <div class="flex items-center justify-between">
                <div class="h-4 w-24 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
                <div class="h-6 w-20 animate-pulse rounded bg-[color:var(--color-brand-subtle)]" />
              </div>
            </div>
            <div class="h-12 w-full animate-pulse rounded-full bg-[color:var(--color-brand-subtle)]" />
          </div>
        </div>
      </div>
    </section>

    <!-- Missing Appointment ID State -->
    <section
      v-else-if="payment.pageState.value.kind === 'missing_appointment_id'"
      class="relative z-10 mx-auto max-w-lg text-center"
    >
      <div class="rounded-3xl border border-[color:var(--color-error)]/20 bg-white/80 p-8 shadow-soft backdrop-blur-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-error)]/10">
          <Icon
            name="lucide:alert-circle"
            size="28"
            class="text-[color:var(--color-error)]"
            aria-hidden="true"
          />
        </div>
        <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Rendez-vous introuvable
        </h1>
        <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
          Le lien de paiement est invalide ou incomplet. Retournez à votre tableau de bord pour accéder à vos consultations.
        </p>
        <ULink
          to="/client/dashboard"
          class="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating hover:brightness-110 focus-visible:text-white"
        >
          <Icon
            name="lucide:arrow-left"
            size="16"
            aria-hidden="true"
          />
          Retour au tableau de bord
        </ULink>
      </div>
    </section>

    <!-- Already Paid State -->
    <section
      v-else-if="payment.pageState.value.kind === 'already_paid'"
      class="relative z-10 mx-auto max-w-lg text-center"
    >
      <div class="rounded-3xl border border-[color:var(--color-success)]/20 bg-white/80 p-8 shadow-soft backdrop-blur-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-success)]/15">
          <Icon
            name="lucide:check-circle"
            size="28"
            class="text-[color:var(--color-success)]"
            aria-hidden="true"
          />
        </div>
        <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Consultation confirmée
        </h1>
        <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
          {{ payment.pageState.value.message }}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
          Un email de confirmation vous a été envoyé avec les détails de votre rendez-vous.
        </p>
        <ULink
          to="/client/dashboard"
          class="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating hover:brightness-110 focus-visible:text-white"
        >
          Retour au tableau de bord
        </ULink>
      </div>
    </section>

    <!-- Error State -->
    <section
      v-else-if="payment.pageState.value.kind === 'error' || payment.pageState.value.kind === 'not_found'"
      class="relative z-10 mx-auto max-w-lg text-center"
      role="alert"
      aria-live="assertive"
    >
      <div class="rounded-3xl border border-[color:var(--color-error)]/20 bg-white/80 p-8 shadow-soft backdrop-blur-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-error)]/10">
          <Icon
            name="lucide:alert-triangle"
            size="28"
            class="text-[color:var(--color-error)]"
            aria-hidden="true"
          />
        </div>
        <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Oups !
        </h1>
        <p class="mt-2 text-sm text-[color:var(--color-error)]">
          {{ payment.pageState.value.message }}
        </p>
        <div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-surface-card)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:shadow-floating"
            @click="payment.loadContext()"
          >
            <Icon
              name="lucide:refresh-cw"
              size="16"
              aria-hidden="true"
            />
            Réessayer
          </button>
          <ULink
            to="/client/dashboard"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating hover:brightness-110 focus-visible:text-white"
          >
            Retour au tableau de bord
          </ULink>
        </div>
      </div>
    </section>

    <!-- Ready State - Payment Card -->
    <section
      v-else-if="payment.pageState.value.kind === 'ready' && payment.displayValues.value"
      class="relative z-10 mx-auto max-w-lg"
    >
      <!-- Header -->
      <header class="mb-8 text-center">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
          Finaliser votre réservation
        </p>
        <h1 class="mt-2 font-serif text-3xl italic text-[color:var(--color-brand-primary)] sm:text-4xl">
          Payer ma consultation
        </h1>
        <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
          Votre rendez-vous est réservé. Il ne reste plus qu'à confirmer le paiement.
        </p>
      </header>

      <!-- Payment Card -->
      <div class="payment-card rounded-3xl border border-white/60 bg-white/90 p-8 shadow-floating backdrop-blur-sm">
        <!-- Pending Payment Notice -->
        <div
          v-if="payment.pageState.value.hasPendingPayment"
          class="mb-6 flex items-start gap-3 rounded-xl border border-[color:var(--color-warning)]/20 bg-[color:var(--color-warning)]/5 p-4"
        >
          <Icon
            name="lucide:info"
            size="20"
            class="mt-0.5 shrink-0 text-[color:var(--color-warning)]"
            aria-hidden="true"
          />
          <div>
            <p class="text-sm font-medium text-[color:var(--color-brand-primary)]">
              Paiement en attente
            </p>
            <p class="mt-0.5 text-xs text-[color:var(--color-brand-secondary)]">
              Vous avez déjà initié un paiement pour ce rendez-vous. Vous pouvez le reprendre ou en créer un nouveau.
            </p>
          </div>
        </div>

        <!-- Appointment Details -->
        <div class="grid gap-5">
          <!-- Label & Type -->
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-crepuscule-100)]/50 px-3 py-1 text-xs font-semibold text-[color:var(--color-brand-accent)]">
              <Icon
                name="lucide:video"
                size="14"
                aria-hidden="true"
              />
              {{ payment.displayValues.value.label }}
            </span>
            <span class="text-xs text-[color:var(--color-brand-muted)]">
              {{ payment.displayValues.value.duration }}
            </span>
          </div>

          <!-- Date & Time -->
          <div class="flex items-center gap-4 rounded-xl border border-[color:var(--color-brand-subtle)]/60 bg-[color:var(--color-surface-highlight)]/50 p-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface-card)] shadow-sm">
              <Icon
                name="lucide:calendar"
                size="24"
                class="text-[color:var(--color-brand-accent)]"
                aria-hidden="true"
              />
            </div>
            <div>
              <p class="text-base font-semibold capitalize text-[color:var(--color-brand-primary)]">
                {{ payment.displayValues.value.date }}
              </p>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                {{ payment.displayValues.value.timeRange }}
                <span class="text-[color:var(--color-brand-muted)]">
                  ({{ payment.displayValues.value.timezone }})
                </span>
              </p>
            </div>
          </div>

          <!-- Price -->
          <div class="flex items-center justify-between border-t border-[color:var(--color-brand-subtle)]/50 pt-5">
            <span class="text-sm text-[color:var(--color-brand-secondary)]">
              Montant à régler
            </span>
            <span class="font-serif text-2xl font-semibold text-[color:var(--color-brand-primary)]">
              {{ payment.displayValues.value.price }}
            </span>
          </div>
        </div>

        <!-- Action Error -->
        <div
          v-if="payment.actionErrorMessage.value"
          class="mt-6 flex items-start gap-3 rounded-xl border border-[color:var(--color-error)]/20 bg-[color:var(--color-error)]/5 p-4"
          role="alert"
          aria-live="assertive"
        >
          <Icon
            name="lucide:alert-circle"
            size="20"
            class="mt-0.5 shrink-0 text-[color:var(--color-error)]"
            aria-hidden="true"
          />
          <p class="text-sm text-[color:var(--color-error)]">
            {{ payment.actionErrorMessage.value }}
          </p>
        </div>

        <!-- CTA Buttons -->
        <div class="mt-6 grid gap-3">
          <!-- Primary CTA -->
          <button
            type="button"
            class="cta-payment group relative flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-4 text-base font-bold text-white shadow-floating transition-base hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgba(28,25,23,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="payment.actionPending.value"
            @click="handlePayment"
          >
            <template v-if="payment.actionPending.value">
              <Icon
                name="lucide:loader-2"
                size="20"
                class="animate-spin"
                aria-hidden="true"
              />
              Redirection sécurisée...
            </template>
            <template v-else>
              <Icon
                name="lucide:lock"
                size="18"
                class="transition-transform group-hover:scale-110"
                aria-hidden="true"
              />
              Payer {{ payment.displayValues.value.price }}
              <Icon
                name="lucide:arrow-right"
                size="18"
                class="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </template>
          </button>

          <!-- Resume CTA (if pending payment) -->
          <button
            v-if="payment.pageState.value.hasPendingPayment && !payment.actionPending.value"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:shadow-floating"
            @click="handleResume"
          >
            <Icon
              name="lucide:rotate-ccw"
              size="16"
              aria-hidden="true"
            />
            Relancer le paiement
          </button>
        </div>

        <!-- Security Notice -->
        <p class="mt-4 text-center text-xs text-[color:var(--color-brand-muted)]">
          <Icon
            name="lucide:shield-check"
            size="14"
            class="mr-1 inline-block"
            aria-hidden="true"
          />
          Paiement sécurisé par Stripe. Vos données bancaires ne sont jamais stockées sur nos serveurs.
        </p>
      </div>

      <!-- Back Link -->
      <div class="mt-6 text-center">
        <ULink
          to="/client/dashboard"
          class="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-primary)]"
        >
          <Icon
            name="lucide:arrow-left"
            size="14"
            aria-hidden="true"
          />
          Retour au tableau de bord
        </ULink>
      </div>
    </section>

    <!-- Loading Overlay (during checkout creation) - RF2 -->
    <Teleport to="body">
      <Transition name="overlay-fade">
        <div
          v-if="payment.actionPending.value"
          class="checkout-overlay fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Redirection vers le paiement sécurisé"
        >
          <!-- Gradient backdrop -->
          <div class="absolute inset-0 bg-gradient-to-br from-[color:var(--color-surface-page)] via-[color:var(--color-crepuscule-50)] to-[color:var(--color-surface-page)]" />
          <div class="absolute inset-0 backdrop-blur-md" />

          <!-- Content -->
          <div class="relative z-10 px-6 text-center">
            <!-- Animated shield icon with pulse ring -->
            <div class="checkout-icon-wrapper relative mx-auto mb-6">
              <div class="absolute inset-0 animate-pulse-ring rounded-3xl bg-[color:var(--color-crepuscule-200)]/50" />
              <div class="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--color-surface-card)] shadow-floating">
                <Icon
                  name="lucide:shield-check"
                  size="36"
                  class="checkout-lock-icon text-[color:var(--color-brand-accent)]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Title -->
            <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)] sm:text-3xl">
              Redirection sécurisée
            </h2>

            <!-- Subtitle with animated dots -->
            <p class="mt-3 text-base text-[color:var(--color-brand-secondary)]">
              Connexion à Stripe en cours<span class="loading-dots" />
            </p>

            <!-- Stripe badge -->
            <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-brand-subtle)] bg-white/80 px-4 py-2 shadow-sm">
              <Icon
                name="lucide:lock"
                size="14"
                class="text-[color:var(--color-brand-muted)]"
                aria-hidden="true"
              />
              <span class="text-xs font-medium text-[color:var(--color-brand-secondary)]">
                Paiement sécurisé par
              </span>
              <span class="text-sm font-bold text-[color:var(--color-brand-primary)]">
                Stripe
              </span>
            </div>

            <!-- Security indicators -->
            <div class="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[color:var(--color-brand-muted)]">
              <span class="flex items-center gap-1.5">
                <Icon
                  name="lucide:shield"
                  size="14"
                  aria-hidden="true"
                />
                Chiffrement SSL
              </span>
              <span
                class="hidden h-3 w-px bg-[color:var(--color-brand-subtle)] sm:block"
                aria-hidden="true"
              />
              <span class="flex items-center gap-1.5">
                <Icon
                  name="lucide:credit-card"
                  size="14"
                  aria-hidden="true"
                />
                PCI DSS
              </span>
              <span
                class="hidden h-3 w-px bg-[color:var(--color-brand-subtle)] sm:block"
                aria-hidden="true"
              />
              <span class="flex items-center gap-1.5">
                <Icon
                  name="lucide:check-circle"
                  size="14"
                  aria-hidden="true"
                />
                3D Secure
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pay-page {
  animation: page-fade-in 0.4s ease-out;
}

@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.payment-card {
  animation: card-float-in 0.5s ease-out 0.1s both;
}

@keyframes card-float-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* CTA button glow effect */
.cta-payment {
  position: relative;
}

.cta-payment::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 9999px;
  background: linear-gradient(
    135deg,
    var(--color-crepuscule-300) 0%,
    var(--color-crepuscule-200) 50%,
    var(--color-crepuscule-300) 100%
  );
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.cta-payment:not(:disabled):hover::before {
  opacity: 0.6;
}

/* Overlay fade transition - RF2 */
.overlay-fade-enter-active {
  transition: opacity 0.3s var(--ease-smooth);
}

.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Checkout overlay animations - RF2 */
.checkout-overlay .checkout-icon-wrapper {
  animation: icon-float 2s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.checkout-lock-icon {
  animation: icon-pulse 1.5s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}

/* Pulse ring animation */
.animate-pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1.15);
  }
}

/* Loading dots animation */
.loading-dots::after {
  content: '';
  animation: loading-dots 1.5s steps(4, end) infinite;
}

@keyframes loading-dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: ''; }
}

/* Skeleton pulse animation */
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
