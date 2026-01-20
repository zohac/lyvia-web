<template>
  <div class="space-y-6">
    <!-- Back link + Header -->
    <div class="space-y-4">
      <UButton
        to="/provider/clients"
        variant="link"
        color="neutral"
        size="sm"
        class="px-0"
      >
        <UIcon name="lucide:arrow-left" class="mr-1.5 h-4 w-4" />
        Retour aux clientes
      </UButton>

      <!-- Header card -->
      <UCard class="bg-white">
        <div
          v-if="pending"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="h-14 w-14 rounded-full" />
            <div class="space-y-2">
              <USkeleton class="h-5 w-40" />
              <USkeleton class="h-4 w-56" />
            </div>
          </div>
          <USkeleton class="h-10 w-36 rounded-lg" />
        </div>

        <div
          v-else-if="client"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <UAvatar
              :text="getClientInitials(client)"
              size="xl"
              :class="avatarClass"
            />
            <div>
              <h1 class="text-2xl font-semibold text-stone-900">
                {{ formatClientName(client) }}
              </h1>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <a
                  :href="`mailto:${client.email}`"
                  class="hover:text-crepuscule-600 hover:underline"
                >
                  {{ client.email }}
                </a>
                <span class="text-stone-300">·</span>
                <a
                  :href="`tel:${client.phone}`"
                  class="hover:text-crepuscule-600 hover:underline"
                >
                  {{ client.phone }}
                </a>
              </div>
            </div>
          </div>
          <UButton
            to="/provider/calendar"
            color="primary"
          >
            <UIcon name="lucide:calendar-plus" class="mr-2 h-4 w-4" />
            Planifier un RDV
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Error alert -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Chargement impossible"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content (2 cols) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Appointments section -->
        <ClientAppointmentHistorySection
          v-if="clientProfileId"
          :client-profile-id="clientProfileId"
          :timezone="timezoneLabel"
        />

        <!-- Payments section -->
        <ClientPaymentHistorySection
          v-if="clientProfileId"
          :client-profile-id="clientProfileId"
          :timezone="timezoneLabel"
        />
      </div>

      <!-- Sidebar (1 col) -->
      <aside class="space-y-6 lg:order-first lg:order-last">
        <!-- Synthesis card -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-stone-900">Synthèse</h2>
              <UBadge
                v-if="currentStatusMeta"
                :color="currentStatusMeta.color"
                variant="soft"
              >
                {{ currentStatusMeta.label }}
              </UBadge>
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="pending"
            class="space-y-4"
          >
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-4/5" />
            <USkeleton class="h-10 w-full" />
          </div>

          <!-- Content -->
          <div
            v-else-if="detail"
            class="space-y-6"
          >
            <!-- Status description -->
            <p class="text-sm text-stone-600">
              {{ currentStatusMicrocopy }}
            </p>

            <!-- Program month stepper -->
            <div class="space-y-2">
              <label class="text-xs font-medium uppercase tracking-wider text-stone-500">
                Mois en cours
              </label>
              <ProgramMonthStepper
                :model-value="currentProgramMonth"
                :pending="updatePending"
                @update:model-value="handleProgramMonthUpdate"
              />
            </div>

            <!-- Success message -->
            <UAlert
              v-if="updateSuccessMessage"
              color="success"
              variant="soft"
              :title="updateSuccessMessage"
              icon="i-lucide-check-circle"
            />

            <!-- Warning: onboarding not completed -->
            <UAlert
              v-if="showOnboardingWarning"
              color="warning"
              variant="soft"
              description="Onboarding non terminé — certaines données peuvent être incomplètes."
              icon="i-lucide-alert-triangle"
            />

            <!-- Update error -->
            <UAlert
              v-if="updateErrorMessage"
              color="error"
              variant="soft"
              :description="updateErrorMessage"
              icon="i-lucide-alert-circle"
            />

            <!-- Stats -->
            <div class="divide-y divide-stone-100">
              <div class="py-3 first:pt-0">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Prochain RDV
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ nextAppointmentLabel }}
                </p>
              </div>

              <div class="py-3">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Consultations terminées
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ detail.stats.consultationsCompleted }}
                </p>
              </div>

              <div class="py-3 last:pb-0">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Fuseau horaire
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ timezoneLabel }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Quick actions card -->
        <UCard
          v-if="client"
          class="bg-white"
        >
          <template #header>
            <h2 class="font-semibold text-stone-900">Actions rapides</h2>
          </template>

          <div class="space-y-2">
            <UButton
              :href="`mailto:${client.email}`"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon name="lucide:mail" class="mr-2 h-4 w-4" />
              Envoyer un email
            </UButton>
            <UButton
              :href="`tel:${client.phone}`"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon name="lucide:phone" class="mr-2 h-4 w-4" />
              Appeler
            </UButton>
          </div>
        </UCard>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
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
import ProgramMonthStepper from '../../../components/molecules/ProgramMonthStepper.vue'
import ClientAppointmentHistorySection from '../../../components/organisms/ClientAppointmentHistorySection.vue'
import ClientPaymentHistorySection from '../../../components/organisms/ClientPaymentHistorySection.vue'

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

// Avatar color based on status
const avatarClass = computed(() => {
  if (!detail.value) return 'bg-stone-100 text-stone-700'

  switch (detail.value.computedStatus) {
    case 'onboarding':
      return 'bg-amber-100 text-amber-700'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-stone-100 text-stone-700'
  }
})

// ============================================================================
// Program Month Update (D5-b)
// ============================================================================

const currentProgramMonth = ref<number | null>(detail.value?.program.currentProgramMonth ?? null)
const currentComputedStatus = ref<ProviderClientStatus>(detail.value?.computedStatus ?? 'onboarding')
const updatePending = ref(false)
const updateSuccessMessage = ref<string | null>(null)
const updateErrorMessage = ref<string | null>(null)
const showOnboardingWarning = ref(false)

// Sync local state when detail changes
watch(detail, (newDetail) => {
  if (newDetail) {
    currentProgramMonth.value = newDetail.program.currentProgramMonth
    currentComputedStatus.value = newDetail.computedStatus
    showOnboardingWarning.value = !newDetail.onboardingCallDone && newDetail.program.currentProgramMonth !== null
  }
}, { immediate: true })

const currentStatusMeta = computed(() => getClientStatusMeta(currentComputedStatus.value))
const currentStatusMicrocopy = computed(() => getClientStatusMicrocopy(currentComputedStatus.value))

const nextAppointmentLabel = computed(() => {
  if (!detail.value) return 'Aucun rendez-vous planifié'
  const formatted = formatNextAppointment(detail.value.stats.nextConsultationAt, timezoneLabel.value)
  if (!formatted) return 'Aucun rendez-vous planifié'
  return formatted
})

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
    updateSuccessMessage.value = `${fromLabel} → ${toLabel} (${statusLabel})`

    // Handle warning from backend
    if (result.warning === 'ONBOARDING_NOT_COMPLETED') {
      showOnboardingWarning.value = true
    }

    // Auto-dismiss success message
    setTimeout(() => {
      updateSuccessMessage.value = null
    }, 4000)
  } catch (error) {
    // Rollback optimistic update
    currentProgramMonth.value = previousMonth
    currentComputedStatus.value = previousStatus
    updateErrorMessage.value = mapUpdateProgramErrorToMessage(error)
  } finally {
    updatePending.value = false
  }
}
</script>
