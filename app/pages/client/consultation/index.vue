<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Mes rendez-vous
        </h1>
        <p class="mt-1 text-stone-500">
          Consultez vos consultations programmées avec votre coach.
        </p>
      </div>

      <UButton
        to="/client/dashboard"
        variant="ghost"
        color="neutral"
        leading-icon="i-lucide-arrow-left"
      >
        Retour
      </UButton>
    </header>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Next consultation card -->
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

        <!-- History placeholder -->
        <UCard class="bg-white">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100">
              <UIcon
                name="lucide:history"
                class="h-6 w-6 text-stone-500"
              />
            </div>
            <div>
              <h3 class="font-semibold text-stone-900">
                Historique des consultations
              </h3>
              <p class="mt-1 text-sm text-stone-500">
                L'historique complet de vos consultations passées sera disponible prochainement.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Info card -->
        <UCard class="bg-white">
          <template #header>
            <h2 class="font-semibold text-stone-900">
              Comment ça marche
            </h2>
          </template>

          <div class="space-y-3 text-sm text-stone-600">
            <p>
              Votre coach planifie vos consultations selon vos disponibilités et vos besoins.
            </p>
            <p>
              Vous recevrez une notification dès qu'un rendez-vous vous est assigné.
            </p>
            <p>
              Pour toute demande de modification, utilisez les boutons disponibles sur votre consultation.
            </p>
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
            Contactez votre coach directement pour toute question concernant vos rendez-vous.
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RequestType, RequestReason } from '../../../components/organisms/ClientConsultationRequestModal.vue'
import { useClientNextConsultation } from '../../../features/consultation/useClientNextConsultation'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Mes rendez-vous'
})

const toast = useToast()

/**
 * Consultation state (same as dashboard)
 */
const {
  pending: consultationPending,
  errorMessage: consultationError,
  displayState: consultationState,
  refresh: refreshConsultation
} = await useClientNextConsultation()

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
 */
async function handleRequestSubmit(payload: {
  type: RequestType
  reason: RequestReason
  details: string | null
}) {
  requestModalLoading.value = true
  requestModalError.value = null

  try {
    // V0: Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    requestModalSuccess.value = true

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
