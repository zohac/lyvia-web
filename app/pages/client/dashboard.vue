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
        class="inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-floating transition-base hover:brightness-110"
      >
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
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Ressources
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Vos contenus arrivent bientôt : guides, exercices et recommandations.
            </p>
          </div>

          <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Paiements
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Historique et factures seront disponibles prochainement.
            </p>
          </div>
        </section>
      </div>

      <aside class="space-y-8 lg:col-span-4">
        <div class="cursor-pointer rounded-blob-a border border-white/60 bg-gradient-to-br from-[color:var(--color-kaora-50)] to-white p-8 text-center shadow-soft transition-base hover:shadow-floating">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
            <Icon
              name="lucide:sparkles"
              size="28"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
          </div>
          <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
            Actions rapides
          </h3>
          <p class="mt-2 text-sm text-[color:var(--color-brand-muted)]">
            Retrouver vos prochains rendez-vous en un clic.
          </p>
          <ULink
            to="/client/consultation"
            class="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:shadow-floating"
          >
            Ouvrir
          </ULink>
        </div>

        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Aperçu
          </p>
          <p class="mt-4 text-sm text-[color:var(--color-brand-secondary)]">
            Vos informations essentielles s’afficheront ici (rendez-vous, contenus, paiements).
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RequestType, RequestReason } from '../../components/organisms/ClientConsultationRequestModal.vue'
import { useClientNextConsultation } from '../../features/consultation/useClientNextConsultation'

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
