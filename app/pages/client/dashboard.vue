<template>
  <div class="space-y-8">
    <!-- Page header -->
    <MoleculesDashboardGreeting :subtitle="greetingSubtitle">
      <template #actions>
        <UButton
          to="/client/consultation"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
        >
          Mes rendez-vous
        </UButton>
      </template>
    </MoleculesDashboardGreeting>

    <!-- Payment action banner (story 0.21 AC-3) -->
    <UAlert
      v-if="paymentBanner"
      color="warning"
      variant="subtle"
      icon="lucide:credit-card"
      :title="paymentBanner.title"
      class="mb-6"
    >
      <template #actions>
        <UButton
          :to="paymentBanner.url"
          color="primary"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        >
          Payer et confirmer
        </UButton>
      </template>
    </UAlert>

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main column -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Dynamic consultation card (RF6) -->
        <OrganismsConsultationDashboardCard
          :pending="consultationPending"
          :error-message="consultationError"
          :display-state="consultationState"
          @retry="refreshConsultation"
          @request-cancel="openCancelModal"
          @request-reschedule="openRescheduleModal"
        />

        <!-- US-2/US-3: Modal demande annulation/report -->
        <OrganismsClientConsultationRequestModal
          :open="requestModalOpen"
          :request-type="requestModalType"
          :scheduled-at="requestModalScheduledAt"
          :duration-minutes="requestModalDurationMinutes"
          :can-request="requestModalCanRequest"
          :has-pending-request="requestModalHasPendingRequest"
          :loading="requestModalLoading"
          :success="requestModalSuccess"
          :error="requestModalError"
          @update:open="requestModalOpen = $event"
          @submit="handleRequestSubmit"
        />

        <!-- Cards grid -->
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Ressources card -->
          <UCard class="bg-[color:var(--color-surface-card)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-crepuscule-100">
                <UIcon
                  name="lucide:book-open"
                  class="h-6 w-6 text-crepuscule-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                  Ressources
                </h3>
                <p class="text-sm text-[color:var(--color-text-muted)]">
                  Bientôt disponible
                </p>
              </div>
            </div>

            <p class="mt-4 text-sm text-[color:var(--color-text-secondary)]">
              Vos contenus arrivent bientôt : guides, exercices et recommandations.
            </p>
          </UCard>

          <!-- Paiements card -->
          <UCard class="bg-[color:var(--color-surface-card)]">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sunset-100">
                    <UIcon
                      name="lucide:credit-card"
                      class="h-5 w-5 text-sunset-600"
                    />
                  </div>
                  <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                    Paiements
                  </h3>
                </div>
                <UButton
                  v-if="payments.length > 0"
                  to="/client/account?tab=paiements"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  trailing-icon="i-lucide-arrow-right"
                >
                  Voir tout
                </UButton>
              </div>
            </template>

            <!-- Loading state -->
            <div
              v-if="paymentsPending"
              class="space-y-3"
            >
              <USkeleton class="h-10 w-full rounded-lg" />
              <USkeleton class="h-10 w-full rounded-lg" />
            </div>

            <!-- Error state -->
            <UAlert
              v-else-if="paymentsError"
              color="error"
              variant="soft"
              :title="paymentsError"
              icon="i-lucide-alert-circle"
            >
              <template #actions>
                <UButton
                  variant="link"
                  color="error"
                  size="sm"
                  @click="refreshPayments"
                >
                  Réessayer
                </UButton>
              </template>
            </UAlert>

            <!-- Empty state -->
            <div
              v-else-if="!payments.length"
              class="py-4 text-center"
            >
              <p class="text-sm text-[color:var(--color-text-muted)]">
                Aucun paiement pour le moment
              </p>
            </div>

            <!-- Payments list -->
            <div
              v-else
              class="divide-y divide-[color:var(--color-border-subtle)]"
            >
              <div
                v-for="payment in payments.slice(0, 3)"
                :key="payment.id"
                class="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="{
                      'bg-[color:var(--color-success-500)]': payment.status === 'succeeded',
                      'bg-[color:var(--color-warning)]': payment.status === 'pending',
                      'bg-[color:var(--color-error-500)]': payment.status === 'failed'
                    }"
                  />
                  <span class="text-sm text-[color:var(--color-text-secondary)]">
                    {{ formatPaymentDate(payment.createdAt) }}
                  </span>
                </div>
                <span class="text-sm font-medium text-[color:var(--color-text-primary)]">
                  {{ formatPrice(payment.amountCents) }}
                </span>
              </div>

              <p
                v-if="payments.length > 3"
                class="pt-2 text-center text-xs text-[color:var(--color-brand-muted)]"
              >
                + {{ payments.length - 3 }} autre{{ payments.length - 3 > 1 ? 's' : '' }}
              </p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Aperçu card -->
        <UCard class="bg-[color:var(--color-surface-card)]">
          <template #header>
            <h2 class="font-semibold text-[color:var(--color-text-primary)]">
              Aperçu
            </h2>
          </template>

          <div class="space-y-4">
            <!-- Next appointment summary -->
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crepuscule-100">
                <UIcon
                  name="lucide:calendar-check"
                  class="h-5 w-5 text-crepuscule-600"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Prochain RDV
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-text-primary)]">
                  {{ nextAppointmentLabel }}
                </p>
              </div>
            </div>

            <!-- Payments summary -->
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunset-100">
                <UIcon
                  name="lucide:receipt"
                  class="h-5 w-5 text-sunset-600"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Paiements
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-text-primary)]">
                  {{ paymentsSummaryLabel }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Support card -->
        <UCard class="bg-gradient-to-br from-crepuscule-50 to-white">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-surface-card)] shadow-sm">
              <UIcon
                name="lucide:message-circle"
                class="h-6 w-6 text-crepuscule-600"
              />
            </div>
            <div>
              <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                Besoin d'aide ?
              </h3>
            </div>
          </div>

          <p class="mt-4 text-sm text-[color:var(--color-text-secondary)]">
            Contactez votre coach directement pour toute question concernant vos rendez-vous ou votre accompagnement.
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RequestType, RequestReason } from '../../components/organisms/ClientConsultationRequestModal.vue'
import type { ClientPaymentListItem } from '../../features/payments/api/client-payments.contract'
import type { CancellationReason, RescheduleReason } from '../../features/consultation/api/appointment-request.contract'
import { useClientNextConsultation, formatDateLong, formatPrice } from '../../features/consultation/useClientNextConsultation'
import { resolvePaymentBanner, resolveGreetingSubtitle } from '../../features/consultation/domain/dashboard-banner'
import { listClientPayments } from '../../features/payments/services/client-payments.service'
import { requestCancellation, requestReschedule } from '../../features/consultation/services/appointment-request.service'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Tableau de bord'
})

const toast = useToast()

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
 * Story 0.21 AC-3: Banner paiement urgent affiché en haut du dashboard quand
 * le state est `awaiting_payment`. Renvoie null sinon (banner caché).
 */
const paymentBanner = computed(() => resolvePaymentBanner(consultationState.value))

/**
 * Story 0.21 AC-4: Greeting personnalisé "Bienvenue dans votre espace —
 * {providerDisplayName} vous accompagne" en première visite (aucun paiement
 * historique) quand une consultation attend un paiement. Fallback sur le
 * subtitle neutre sinon.
 */
const greetingSubtitle = computed(() => resolveGreetingSubtitle({
  state: consultationState.value,
  paymentsCount: payments.value.length,
  paymentsPending: paymentsPending.value
}))

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
    return 'En attente de paiement'
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
 * Whether the appointment is eligible for request (> 24h)
 */
const requestModalCanRequest = computed(() => {
  if (consultationState.value?.kind !== 'payment_confirmed') return false
  return consultationState.value.canRequest
})

/**
 * Whether a request is already pending
 */
const requestModalHasPendingRequest = computed(() => {
  if (consultationState.value?.kind !== 'payment_confirmed') return false
  return consultationState.value.hasPendingRequest
})

/**
 * Current appointment ID for API calls
 */
const currentAppointmentId = computed(() => {
  if (consultationState.value?.kind !== 'payment_confirmed') return null
  return consultationState.value.appointmentId
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
 * Map API error codes to user-friendly messages
 */
function mapRequestErrorToMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { code?: string } }).data
    switch (data?.code) {
      case 'REQUEST_ALREADY_EXISTS':
        return 'Une demande est déjà en cours pour ce rendez-vous.'
      case 'TOO_CLOSE_TO_APPOINTMENT':
        return 'Impossible : moins de 24h avant le rendez-vous. Contactez directement votre coach.'
      case 'APPOINTMENT_NOT_CANCELLABLE':
        return 'Ce rendez-vous ne peut pas faire l\'objet d\'une demande.'
      case 'APPOINTMENT_NOT_FOUND':
        return 'Rendez-vous introuvable.'
      case 'APPOINTMENT_NOT_OWNED':
        return 'Vous n\'êtes pas autorisé à modifier ce rendez-vous.'
      default:
        break
    }
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

/**
 * Handle request submission (US-2 cancel, US-3 reschedule)
 */
async function handleRequestSubmit(payload: {
  type: RequestType
  reason: RequestReason
  details: string | null
}) {
  const appointmentId = currentAppointmentId.value
  if (!appointmentId) {
    requestModalError.value = 'Rendez-vous non trouvé.'
    return
  }

  requestModalLoading.value = true
  requestModalError.value = null

  try {
    if (payload.type === 'cancel') {
      await requestCancellation(appointmentId, {
        reason: payload.reason as CancellationReason,
        details: payload.details
      })
    } else {
      await requestReschedule(appointmentId, {
        reason: payload.reason as RescheduleReason,
        details: payload.details
      })
    }

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

    // Refresh consultation state to update hasPendingRequest
    await refreshConsultation()
  } catch (error) {
    requestModalError.value = mapRequestErrorToMessage(error)
  } finally {
    requestModalLoading.value = false
  }
}
</script>
