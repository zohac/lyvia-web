<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <!-- Main content area -->
    <div class="grid gap-6">
      <!-- Header card with client identity -->
      <UCard
        variant="organic"
        class="rounded-blob-a"
      >
        <div
          v-if="pending"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="h-14 w-14 rounded-full" />
            <div class="grid gap-2">
              <USkeleton class="h-4 w-40" />
              <USkeleton class="h-3 w-56" />
            </div>
          </div>
          <USkeleton class="h-10 w-40 rounded-full" />
        </div>

        <div
          v-else-if="client"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <UAvatar
              :text="getClientInitials(client)"
              size="lg"
              class="bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)]"
            />
            <div class="grid gap-1">
              <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                {{ formatClientName(client) }}
              </h1>
              <p class="text-xs text-[color:var(--color-brand-secondary)]">
                {{ client.email }} · {{ client.phone }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-calendar"
            variant="solid"
            color="primary"
            class="rounded-full"
            to="/provider/calendar"
          >
            Planifier un RDV
          </UButton>
        </div>
      </UCard>

      <!-- Error alert -->
      <SystemAlert
        v-if="errorMessage"
        variant="error"
        title="Chargement impossible"
        :description="errorMessage"
      />

      <!-- Appointments history section -->
      <ClientAppointmentHistorySection
        v-if="clientProfileId"
        :client-profile-id="clientProfileId"
        :timezone="timezoneLabel"
      />

      <!-- Payments history section -->
      <ClientPaymentHistorySection
        v-if="clientProfileId"
        :client-profile-id="clientProfileId"
        :timezone="timezoneLabel"
      />
    </div>

    <!-- Synthesis sidebar (sticky on desktop, first on mobile) -->
    <UCard
      variant="glass"
      class="order-first w-full self-start rounded-blob-b lg:order-last lg:sticky lg:top-6"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
          Synthèse
        </h2>
        <UBadge
          v-if="currentStatusMeta"
          :color="currentStatusMeta.color"
          variant="soft"
        >
          {{ currentStatusMeta.label }}
        </UBadge>
      </div>

      <!-- Loading state -->
      <div
        v-if="pending"
        class="mt-4 grid gap-3"
      >
        <USkeleton class="h-3 w-full" />
        <USkeleton class="h-3 w-4/5" />
        <USkeleton class="h-10 w-32 rounded-full" />
      </div>

      <!-- Synthesis content -->
      <div
        v-else-if="detail"
        class="mt-4 grid min-w-0 gap-5 text-sm text-[color:var(--color-brand-secondary)]"
      >
        <!-- Status microcopy (P0.1 requirement) -->
        <p class="text-[color:var(--color-brand-primary)] [word-break:break-word]">
          {{ currentStatusMicrocopy }}
        </p>

        <!-- Program month stepper (D5-b) -->
        <ProgramMonthStepper
          :model-value="currentProgramMonth"
          :pending="updatePending"
          @update:model-value="handleProgramMonthUpdate"
        />

        <!-- Success confirmation (inline feedback) -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="updateSuccessMessage"
            class="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[color:var(--color-success-100)] px-3 py-2 text-xs text-[color:var(--color-success-700)]"
            role="status"
            aria-live="polite"
          >
            <svg
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {{ updateSuccessMessage }}
          </div>
        </Transition>

        <!-- Warning: onboarding not completed -->
        <SystemAlert
          v-if="showOnboardingWarning"
          variant="warning"
          description="Onboarding non terminé — certaines données peuvent être incomplètes."
        />

        <!-- Update error -->
        <SystemAlert
          v-if="updateErrorMessage"
          variant="error"
          :description="updateErrorMessage"
        />

        <!-- Next appointment -->
        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Prochain RDV
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            {{ nextAppointmentLabel }}
          </p>
        </div>

        <!-- Consultations completed -->
        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Consultations terminées
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            {{ detail.stats.consultationsCompleted }}
          </p>
        </div>

        <!-- Timezone explicit display -->
        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Fuseau horaire
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            Heure France ({{ timezoneLabel }})
          </p>
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import ProgramMonthStepper from '../../../components/molecules/ProgramMonthStepper.vue'
import ClientAppointmentHistorySection from '../../../components/organisms/ClientAppointmentHistorySection.vue'
import ClientPaymentHistorySection from '../../../components/organisms/ClientPaymentHistorySection.vue'
import type { ProviderClientStatus } from '../../../features/clients/api/clients.contract'
import { useProviderClientDetail } from '../../../features/clients/useProviderClientDetail'
import { updateProviderClientProgram } from '../../../features/clients/services/provider-client-detail.service'
import {
  formatClientName,
  formatNextAppointment,
  formatProgramMonth,
  getClientInitials,
  getClientStatusMeta,
  getClientStatusMicrocopy
} from '../../../features/clients/domain/clients'
import { mapUpdateProgramErrorToMessage } from '../../../features/clients/api/clients-error'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Fiche cliente'
})

const route = useRoute()
const clientProfileId = computed(() => {
  const value = route.params.clientProfileId
  return typeof value === 'string' ? value : value?.[0]
})

if (!clientProfileId.value) {
  throw createError({ statusCode: 404, statusMessage: 'Cliente introuvable.' })
}

const { pending, errorMessage, detail } = await useProviderClientDetail(clientProfileId.value)

const client = computed(() => detail.value?.client ?? null)
const timezoneLabel = computed(() => detail.value?.timezone ?? 'Europe/Paris')

// ============================================================================
// Program Month Update (D5-b)
// ============================================================================

/** Local state for optimistic UI and feedback */
const currentProgramMonth = ref<number | null>(detail.value?.program.currentProgramMonth ?? null)
const currentComputedStatus = ref<ProviderClientStatus>(detail.value?.computedStatus ?? 'onboarding')
const updatePending = ref(false)
const updateSuccessMessage = ref<string | null>(null)
const updateErrorMessage = ref<string | null>(null)
const showOnboardingWarning = ref(false)

// Sync local state when detail changes (initial load)
watch(detail, (newDetail) => {
  if (newDetail) {
    currentProgramMonth.value = newDetail.program.currentProgramMonth
    currentComputedStatus.value = newDetail.computedStatus
    // Show warning if onboarding not completed and month is set
    showOnboardingWarning.value = !newDetail.onboardingCallDone && newDetail.program.currentProgramMonth !== null
  }
}, { immediate: true })

const currentStatusMeta = computed(() => getClientStatusMeta(currentComputedStatus.value))
const currentStatusMicrocopy = computed(() => getClientStatusMicrocopy(currentComputedStatus.value))

const nextAppointmentLabel = computed(() => {
  if (!detail.value) return 'Aucun rendez-vous planifié'
  const formatted = formatNextAppointment(detail.value.stats.nextConsultationAt, timezoneLabel.value)
  if (!formatted) return 'Aucun rendez-vous planifié'
  return `Consultation — ${formatted}`
})

/**
 * Handles program month update with optimistic UI and feedback.
 */
async function handleProgramMonthUpdate(newMonth: number | null): Promise<void> {
  if (!clientProfileId.value) return

  const previousMonth = currentProgramMonth.value
  const previousStatus = currentComputedStatus.value

  // Clear previous messages
  updateSuccessMessage.value = null
  updateErrorMessage.value = null
  showOnboardingWarning.value = false

  // Optimistic update
  currentProgramMonth.value = newMonth
  updatePending.value = true

  try {
    const result = await updateProviderClientProgram(clientProfileId.value, {
      currentProgramMonth: newMonth
    })

    // Update local state with server response
    currentProgramMonth.value = result.currentProgramMonth
    currentComputedStatus.value = result.computedStatus

    // Build success message
    const fromLabel = formatProgramMonth(result.previousProgramMonth, 6)
    const toLabel = formatProgramMonth(result.currentProgramMonth, 6)
    const statusLabel = getClientStatusMeta(result.computedStatus).label
    updateSuccessMessage.value = `Mois mis à jour : ${fromLabel} → ${toLabel} (${statusLabel})`

    // Handle warning from backend
    if (result.warning === 'ONBOARDING_NOT_COMPLETED') {
      showOnboardingWarning.value = true
    }

    // Auto-dismiss success message after 4 seconds
    setTimeout(() => {
      updateSuccessMessage.value = null
    }, 4000)
  } catch (error) {
    // Rollback optimistic update
    currentProgramMonth.value = previousMonth
    currentComputedStatus.value = previousStatus

    // Show error message
    updateErrorMessage.value = mapUpdateProgramErrorToMessage(error)
  } finally {
    updatePending.value = false
  }
}
</script>
