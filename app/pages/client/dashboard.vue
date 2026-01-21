<template>
  <div class="space-y-8">
    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Bonjour, {{ displayName }}
        </h1>
        <p class="mt-1 text-stone-500">
          Votre espace accompagnement
        </p>
      </div>

      <UButton
        to="/client/consultation"
        color="primary"
        trailing-icon="i-lucide-arrow-right"
      >
        Mes rendez-vous
      </UButton>
    </header>

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

        <!-- Cards grid -->
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Ressources card -->
          <UCard class="bg-white">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-crepuscule-100">
                <UIcon
                  name="lucide:book-open"
                  class="h-6 w-6 text-crepuscule-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-stone-900">
                  Ressources
                </h3>
                <p class="text-sm text-stone-500">
                  Bientôt disponible
                </p>
              </div>
            </div>

            <p class="mt-4 text-sm text-stone-600">
              Vos contenus arrivent bientôt : guides, exercices et recommandations.
            </p>
          </UCard>

          <!-- Paiements card -->
          <UCard class="bg-white">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sunset-100">
                    <UIcon
                      name="lucide:credit-card"
                      class="h-5 w-5 text-sunset-600"
                    />
                  </div>
                  <h3 class="font-semibold text-stone-900">
                    Paiements
                  </h3>
                </div>
                <UButton
                  v-if="payments.length > 0"
                  to="/client/payments"
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
              <p class="text-sm text-stone-500">
                Aucun paiement pour le moment
              </p>
            </div>

            <!-- Payments list -->
            <div
              v-else
              class="divide-y divide-stone-100"
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
                      'bg-green-500': payment.status === 'succeeded',
                      'bg-yellow-500': payment.status === 'pending',
                      'bg-red-500': payment.status === 'failed'
                    }"
                  />
                  <span class="text-sm text-stone-600">
                    {{ formatPaymentDate(payment.createdAt) }}
                  </span>
                </div>
                <span class="text-sm font-medium text-stone-900">
                  {{ formatPrice(payment.amountCents) }}
                </span>
              </div>

              <p
                v-if="payments.length > 3"
                class="pt-2 text-center text-xs text-stone-400"
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
        <UCard class="bg-white">
          <template #header>
            <h2 class="font-semibold text-stone-900">
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
                <p class="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Prochain RDV
                </p>
                <p class="mt-0.5 text-sm font-medium text-stone-900">
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
                <p class="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Paiements
                </p>
                <p class="mt-0.5 text-sm font-medium text-stone-900">
                  {{ paymentsSummaryLabel }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Support card -->
        <UCard class="bg-gradient-to-br from-crepuscule-50 to-white">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <UIcon
                name="lucide:message-circle"
                class="h-6 w-6 text-crepuscule-600"
              />
            </div>
            <div>
              <h3 class="font-semibold text-stone-900">
                Besoin d'aide ?
              </h3>
            </div>
          </div>

          <p class="mt-4 text-sm text-stone-600">
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
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import { useClientNextConsultation, formatDateLong, formatPrice } from '../../features/consultation/useClientNextConsultation'
import { listClientPayments } from '../../features/payments/services/client-payments.service'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Tableau de bord'
})

const toast = useToast()
const currentUser = useCurrentUser()

const displayName = computed(() => currentUser.displayName.value)

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
