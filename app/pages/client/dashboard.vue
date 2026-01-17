<template>
  <div>
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Bonjour, <span class="text-[color:var(--color-brand-accent)]">{{ displayName }}</span>
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Votre espace client, conçu pour rester simple et rassurant.
        </p>
      </div>

      <ULink
        to="/client/consultation"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-floating transition-base hover:brightness-110"
      >
        <UIcon
          name="lucide:calendar"
          class="h-4 w-4"
        />
        Voir mes rendez-vous
      </ULink>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div class="space-y-8 lg:col-span-8">
        <!-- Dynamic consultation card (RF6) -->
        <OrganismsConsultationDashboardCard
          :pending="consultationPending"
          :error-message="consultationError"
          :display-state="consultationState"
          @retry="refreshConsultation"
          @request-cancel="openCancelModal"
          @request-reschedule="openRescheduleModal"
        />

        <!-- RF5: Modal demande annulation/report -->
        <OrganismsClientConsultationRequestModal
          :open="requestModalOpen"
          :request-type="requestModalType"
          :scheduled-at="requestModalScheduledAt"
          :duration-minutes="requestModalDurationMinutes"
          :loading="requestModalLoading"
          :success="requestModalSuccess"
          :error="requestModalError"
          @update:open="requestModalOpen = $event"
          @submit="handleRequestSubmit"
        />

        <section class="grid gap-6 md:grid-cols-2">
          <div class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)]">
              <UIcon
                name="lucide:book-open"
                class="h-5 w-5 text-[color:var(--color-brand-muted)]"
              />
            </div>
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Ressources
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Vos contenus arrivent bientôt : guides, exercices et recommandations.
            </p>
          </div>

          <!-- Paiements card -->
          <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)]">
              <UIcon
                name="lucide:credit-card"
                class="h-5 w-5 text-[color:var(--color-brand-muted)]"
              />
            </div>
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Paiements
            </h3>

            <!-- Loading state -->
            <div
              v-if="paymentsPending"
              class="mt-4 space-y-2"
            >
              <div class="h-4 w-3/4 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
              <div class="h-4 w-1/2 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
            </div>

            <!-- Error state -->
            <div
              v-else-if="paymentsError"
              class="mt-3"
            >
              <p class="text-sm text-red-600">
                {{ paymentsError }}
              </p>
              <button
                class="mt-2 text-sm font-medium text-[color:var(--color-brand-accent)] hover:underline"
                @click="refreshPayments"
              >
                Réessayer
              </button>
            </div>

            <!-- Empty state -->
            <p
              v-else-if="!payments.length"
              class="mt-3 text-sm text-[color:var(--color-brand-secondary)]"
            >
              Aucun paiement pour le moment.
            </p>

            <!-- Payments list -->
            <div
              v-else
              class="mt-4 space-y-3"
            >
              <div
                v-for="payment in payments.slice(0, 3)"
                :key="payment.id"
                class="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-highlight)]/50 px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="{
                      'bg-green-500': payment.status === 'succeeded',
                      'bg-yellow-500': payment.status === 'pending',
                      'bg-red-500': payment.status === 'failed'
                    }"
                  />
                  <span class="text-sm text-[color:var(--color-brand-secondary)]">
                    {{ formatPaymentDate(payment.createdAt) }}
                  </span>
                </div>
                <span class="text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ formatPrice(payment.amountCents) }}
                </span>
              </div>

              <p
                v-if="payments.length > 3"
                class="text-xs text-[color:var(--color-brand-muted)]"
              >
                + {{ payments.length - 3 }} autre{{ payments.length - 3 > 1 ? 's' : '' }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <aside class="space-y-8 lg:col-span-4">
        <!-- Aperçu card with real data -->
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Aperçu
          </p>

          <div class="mt-5 space-y-4">
            <!-- Next appointment summary -->
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:calendar-check"
                  class="h-4 w-4 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Prochain RDV
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ nextAppointmentLabel }}
                </p>
              </div>
            </div>

            <!-- Payments summary -->
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:receipt"
                  class="h-4 w-4 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Paiements
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ paymentsSummaryLabel }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Support card -->
        <div class="rounded-blob-a border border-white/60 bg-gradient-to-br from-[color:var(--color-kaora-50)] to-white p-8 shadow-soft">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <UIcon
              name="lucide:message-circle"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <h3 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Besoin d'aide ?
          </h3>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Contactez votre coach directement pour toute question concernant vos rendez-vous ou votre accompagnement.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RequestType, RequestReason } from '../../components/organisms/ClientConsultationRequestModal.vue'
import type { ClientPaymentListItem } from '../../features/payments/api/client-payments.contract'
import { useClientNextConsultation, formatDateLong, formatPrice } from '../../features/consultation/useClientNextConsultation'
import { listClientPayments } from '../../features/payments/services/client-payments.service'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Tableau de bord'
})

const auth = useAuth()
const toast = useToast()

const displayName = computed(() => {
  const email = auth.user.value?.email
  if (!email) return 'cliente'
  const local = email.split('@')[0]
  return local?.trim() || 'cliente'
})

/**
 * Consultation state for dashboard card (RF6)
 */
const {
  pending: consultationPending,
  errorMessage: consultationError,
  displayState: consultationState,
  refresh: refreshConsultation
} = await useClientNextConsultation()

/**
 * Payments state
 */
const paymentsPending = ref(true)
const paymentsError = ref<string | null>(null)
const payments = ref<ClientPaymentListItem[]>([])

async function refreshPayments() {
  paymentsPending.value = true
  paymentsError.value = null
  try {
    const response = await listClientPayments({ limit: 10 })
    payments.value = response.payments
  } catch {
    paymentsError.value = 'Impossible de charger les paiements.'
  } finally {
    paymentsPending.value = false
  }
}

// Initial fetch
refreshPayments()

/**
 * Format payment date for display
 */
function formatPaymentDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  }).format(date)
}

/**
 * Computed label for next appointment in Aperçu sidebar
 */
const nextAppointmentLabel = computed(() => {
  if (consultationPending.value) return 'Chargement...'
  if (consultationError.value) return 'Erreur'

  const state = consultationState.value
  if (!state) return 'Aucun'

  if (state.kind === 'onboarding_required') {
    return 'Découverte à réserver'
  }
  if (state.kind === 'no_consultation') {
    return 'Aucun rendez-vous'
  }
  if (state.kind === 'awaiting_payment') {
    return `En attente de paiement`
  }
  if (state.kind === 'payment_confirmed') {
    return formatDateLong(state.scheduledAt)
  }
  return 'Aucun'
})

/**
 * Computed label for payments summary in Aperçu sidebar
 */
const paymentsSummaryLabel = computed(() => {
  if (paymentsPending.value) return 'Chargement...'
  if (paymentsError.value) return 'Erreur'
  if (!payments.value.length) return 'Aucun paiement'

  const succeeded = payments.value.filter(p => p.status === 'succeeded')
  if (!succeeded.length) return 'Aucun paiement effectué'

  const total = succeeded.reduce((sum, p) => sum + p.amountCents, 0)
  return `${succeeded.length} paiement${succeeded.length > 1 ? 's' : ''} · ${formatPrice(total)}`
})

/**
 * RF5: Modal state for cancellation/reschedule requests
 */
const requestModalOpen = ref(false)
const requestModalType = ref<RequestType>('cancel')
const requestModalLoading = ref(false)
const requestModalSuccess = ref(false)
const requestModalError = ref<string | null>(null)

/**
 * Computed appointment details for modal
 */
const requestModalScheduledAt = computed(() => {
  if (consultationState.value?.kind !== 'payment_confirmed') return null
  return consultationState.value.scheduledAt
})

const requestModalDurationMinutes = computed(() => {
  if (consultationState.value?.kind !== 'payment_confirmed') return null
  return consultationState.value.durationMinutes
})

/**
 * Open cancel request modal
 */
function openCancelModal(_appointmentId: string) {
  requestModalType.value = 'cancel'
  requestModalSuccess.value = false
  requestModalError.value = null
  requestModalOpen.value = true
}

/**
 * Open reschedule request modal
 */
function openRescheduleModal(_appointmentId: string) {
  requestModalType.value = 'reschedule'
  requestModalSuccess.value = false
  requestModalError.value = null
  requestModalOpen.value = true
}

/**
 * Handle request submission
 *
 * V0: No backend endpoint - simulate success and show confirmation.
 * The request will be handled manually by the provider.
 */
async function handleRequestSubmit(payload: {
  type: RequestType
  reason: RequestReason
  details: string | null
}) {
  requestModalLoading.value = true
  requestModalError.value = null

  try {
    // V0: Simulate API delay (backend endpoint to be implemented)
    await new Promise(resolve => setTimeout(resolve, 800))

    // V0: Always succeed - in future, call backend API
    // await requestAppointmentChange(appointmentId, payload)

    requestModalSuccess.value = true

    // Show toast notification
    toast.add({
      title: payload.type === 'cancel'
        ? `Demande d'annulation envoyée`
        : `Demande de report envoyée`,
      description: 'Votre coach vous contactera prochainement.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch {
    requestModalError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    requestModalLoading.value = false
  }
}
</script>
