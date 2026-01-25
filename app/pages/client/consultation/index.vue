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

        <!-- Appointments History section -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold text-stone-900">
              <UIcon
                name="lucide:calendar"
                class="h-5 w-5 text-stone-500"
              />
              Tous mes rendez-vous
            </h2>
            <UButton
              v-if="!historyPending"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="refreshHistory"
            >
              <UIcon
                name="lucide:refresh-cw"
                class="h-3.5 w-3.5"
              />
            </UButton>
          </div>

          <!-- Loading state -->
          <div
            v-if="historyPending"
            class="space-y-3"
          >
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-20 rounded-xl"
            />
          </div>

          <!-- Error state -->
          <UAlert
            v-else-if="historyError"
            color="error"
            variant="soft"
            :description="historyError"
            icon="i-lucide-alert-circle"
          />

          <!-- Empty state -->
          <UCard
            v-else-if="allAppointments.length === 0"
            class="bg-white"
          >
            <div class="py-6 text-center">
              <UIcon
                name="lucide:calendar-check"
                class="mx-auto h-10 w-10 text-stone-300"
              />
              <p class="mt-3 text-sm text-stone-500">
                Aucun rendez-vous pour le moment.
              </p>
            </div>
          </UCard>

          <!-- Appointments list -->
          <template v-else>
            <!-- Upcoming appointments -->
            <div
              v-if="upcomingAppointments.length > 0"
              class="space-y-3"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-stone-400">
                À venir ({{ upcomingAppointments.length }})
              </p>
              <ClientAppointmentCard
                v-for="appointment in upcomingAppointments"
                :key="appointment.id"
                :appointment="appointment"
                @request-cancel="openCancelModal($event, true)"
                @request-reschedule="openRescheduleModal($event, true)"
              />
            </div>

            <!-- Past appointments -->
            <div
              v-if="pastAppointments.length > 0"
              class="space-y-3"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-stone-400">
                Passés ({{ pastAppointments.length }})
              </p>
              <ClientAppointmentCard
                v-for="appointment in pastAppointments"
                :key="appointment.id"
                :appointment="appointment"
                @request-cancel="openCancelModal($event, true)"
                @request-reschedule="openRescheduleModal($event, true)"
              />
            </div>
          </template>
        </section>
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
import type { CancellationReason, RescheduleReason } from '../../../features/consultation/api/appointment-request.contract'
import { useClientNextConsultation } from '../../../features/consultation/useClientNextConsultation'
import { useClientAppointments } from '../../../features/consultation/useClientAppointments'
import { requestCancellation, requestReschedule } from '../../../features/consultation/services/appointment-request.service'
import ClientAppointmentCard from '../../../components/molecules/ClientAppointmentCard.vue'

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
 * Appointments history (all appointments)
 */
const {
  pending: historyPending,
  errorMessage: historyError,
  appointments: allAppointments,
  upcoming: upcomingAppointments,
  past: pastAppointments,
  refresh: refreshHistory
} = await useClientAppointments()

/**
 * US-2/US-3/US-4: Modal state for cancellation/reschedule requests
 */
const requestModalOpen = ref(false)
const requestModalType = ref<RequestType>('cancel')
const requestModalLoading = ref(false)
const requestModalSuccess = ref(false)
const requestModalError = ref<string | null>(null)

/**
 * US-4: Selected appointment from the list (null = use "Prochain RDV" from consultationState)
 */
const selectedAppointmentId = ref<string | null>(null)

/**
 * Find appointment by ID in the list
 */
function findAppointmentById(id: string) {
  return allAppointments.value.find(apt => apt.id === id)
}

/**
 * Computed: Current appointment for the modal (either from list or from consultationState)
 */
const currentAppointmentId = computed(() => {
  if (selectedAppointmentId.value) return selectedAppointmentId.value
  if (consultationState.value?.kind === 'payment_confirmed') {
    return consultationState.value.appointmentId
  }
  return null
})

/**
 * Computed appointment details for modal
 */
const requestModalScheduledAt = computed(() => {
  if (selectedAppointmentId.value) {
    const apt = findAppointmentById(selectedAppointmentId.value)
    return apt ? new Date(apt.scheduledAt) : null
  }
  if (consultationState.value?.kind === 'payment_confirmed') {
    return consultationState.value.scheduledAt
  }
  return null
})

const requestModalDurationMinutes = computed(() => {
  if (selectedAppointmentId.value) {
    const apt = findAppointmentById(selectedAppointmentId.value)
    return apt?.durationMinutes ?? null
  }
  if (consultationState.value?.kind === 'payment_confirmed') {
    return consultationState.value.durationMinutes
  }
  return null
})

/**
 * Whether the appointment is eligible for request (> 24h)
 */
const requestModalCanRequest = computed(() => {
  if (selectedAppointmentId.value) {
    const apt = findAppointmentById(selectedAppointmentId.value)
    if (!apt) return false
    const hoursRemaining = (new Date(apt.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursRemaining > 24
  }
  if (consultationState.value?.kind === 'payment_confirmed') {
    return consultationState.value.canRequest
  }
  return false
})

/**
 * Whether a request is already pending
 */
const requestModalHasPendingRequest = computed(() => {
  if (selectedAppointmentId.value) {
    const apt = findAppointmentById(selectedAppointmentId.value)
    return apt?.hasPendingRequest ?? false
  }
  if (consultationState.value?.kind === 'payment_confirmed') {
    return consultationState.value.hasPendingRequest
  }
  return false
})

/**
 * Open cancel request modal
 * @param appointmentId - Appointment ID (from card or list)
 * @param fromList - Whether opened from the appointments list (US-4)
 */
function openCancelModal(appointmentId: string, fromList = false) {
  selectedAppointmentId.value = fromList ? appointmentId : null
  requestModalType.value = 'cancel'
  requestModalSuccess.value = false
  requestModalError.value = null
  requestModalOpen.value = true
}

/**
 * Open reschedule request modal
 * @param appointmentId - Appointment ID (from card or list)
 * @param fromList - Whether opened from the appointments list (US-4)
 */
function openRescheduleModal(appointmentId: string, fromList = false) {
  selectedAppointmentId.value = fromList ? appointmentId : null
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

    toast.add({
      title: payload.type === 'cancel'
        ? `Demande d'annulation envoyée`
        : `Demande de report envoyée`,
      description: 'Votre coach vous contactera prochainement.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    // Refresh consultation state and appointments list to update hasPendingRequest
    await Promise.all([
      refreshConsultation(),
      refreshHistory()
    ])
  } catch (error) {
    requestModalError.value = mapRequestErrorToMessage(error)
  } finally {
    requestModalLoading.value = false
  }
}
</script>
