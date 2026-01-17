<template>
  <div>
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Mes rendez-vous
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Consultez vos consultations programmées avec votre coach.
        </p>
      </div>

      <ULink
        to="/client/dashboard"
        class="group inline-flex items-center gap-2 text-sm text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-primary)]"
      >
        <UIcon
          name="lucide:arrow-left"
          size="16"
          class="transition-transform group-hover:-translate-x-1"
        />
        Retour au tableau de bord
      </ULink>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <!-- Main Content -->
      <div class="space-y-8 lg:col-span-8">
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
        <section class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface-highlight)]">
              <UIcon
                name="lucide:history"
                size="24"
                class="text-[color:var(--color-brand-muted)]"
              />
            </div>
            <div>
              <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Historique des consultations
              </h3>
              <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
                L'historique complet de vos consultations passées sera disponible prochainement.
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-8 lg:col-span-4">
        <!-- Info card -->
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Comment ça marche
          </p>
          <div class="mt-4 space-y-4 text-sm text-[color:var(--color-brand-secondary)]">
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
        </div>

        <!-- Support card -->
        <div class="rounded-blob-a border border-white/60 bg-gradient-to-br from-[color:var(--color-kaora-50)] to-white p-8 shadow-soft">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <UIcon
              name="lucide:message-circle"
              size="24"
              class="text-[color:var(--color-brand-accent)]"
            />
          </div>
          <h3 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Besoin d'aide ?
          </h3>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Contactez votre coach directement pour toute question concernant vos rendez-vous.
          </p>
        </div>
      </aside>
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
