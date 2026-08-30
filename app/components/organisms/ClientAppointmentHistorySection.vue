<template>
  <UCard class="bg-[color:var(--color-surface-card)]">
    <!-- Collapsible header -->
    <template #header>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4"
        :aria-expanded="isExpanded"
        :aria-controls="sectionId"
        @click="toggleExpanded"
      >
        <h2 class="font-semibold text-[color:var(--color-text-primary)]">
          Rendez-vous
        </h2>
        <div class="flex items-center gap-3">
          <span
            v-if="!loading"
            class="text-sm text-[color:var(--color-text-muted)]"
          >
            {{ totalLabel }}
          </span>
          <UIcon
            name="lucide:chevron-down"
            class="h-5 w-5 text-[color:var(--color-brand-muted)] transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
          />
        </div>
      </button>
    </template>

    <!-- Collapsible content -->
    <div
      v-show="isExpanded"
      :id="sectionId"
    >
      <!-- Filters -->
      <AppointmentFilters
        :type="typeFilter"
        :status="statusFilter"
        class="mb-4"
        @update:type="handleTypeChange"
        @update:status="handleStatusChange"
      />

      <!-- Loading skeleton -->
      <div
        v-if="loading"
        class="space-y-3"
      >
        <div
          v-for="index in 3"
          :key="`appointment-skeleton-${index}`"
          class="flex items-center justify-between gap-4 rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-4"
        >
          <div class="space-y-2">
            <USkeleton class="h-4 w-36" />
            <USkeleton class="h-3 w-44" />
          </div>
          <USkeleton class="h-6 w-20 rounded-full" />
        </div>
      </div>

      <!-- Error state -->
      <UAlert
        v-else-if="errorMessage"
        color="error"
        variant="soft"
        :description="errorMessage"
        icon="i-lucide-alert-circle"
      />

      <!-- Empty state -->
      <div
        v-else-if="appointments.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-8 text-center"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]">
          <UIcon
            name="lucide:calendar-x"
            class="h-6 w-6 text-[color:var(--color-brand-muted)]"
          />
        </div>
        <p class="text-sm text-[color:var(--color-text-muted)]">
          {{ emptyStateLabel }}
        </p>
      </div>

      <!-- Appointments list -->
      <div
        v-else
        class="space-y-4"
      >
        <!-- Upcoming appointments section -->
        <template v-if="upcoming.length > 0">
          <p class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-text-muted)]">
            À venir
          </p>
          <div class="space-y-2">
            <AppointmentLine
              v-for="apt in upcoming"
              :key="apt.id"
              :appointment="apt"
              :timezone="timezone"
              temporal-context="upcoming"
              :action-pending="actionPending"
              :resend-pending="resendPendingId === apt.id"
              :resend-disabled="resendPendingId !== null"
              @mark-completed="handleMarkCompleted"
              @resend-payment-link="handleResendPaymentLink"
            />
          </div>
        </template>

        <!-- Past appointments section -->
        <template v-if="past.length > 0">
          <p
            class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-text-muted)]"
            :class="{ 'mt-4': upcoming.length > 0 }"
          >
            Passés
          </p>
          <div class="space-y-2">
            <AppointmentLine
              v-for="apt in past"
              :key="apt.id"
              :appointment="apt"
              :timezone="timezone"
              temporal-context="past"
              :action-pending="actionPending"
              :resend-pending="resendPendingId === apt.id"
              :resend-disabled="resendPendingId !== null"
              @mark-completed="handleMarkCompleted"
              @resend-payment-link="handleResendPaymentLink"
            />
          </div>
        </template>

        <!-- Load more button -->
        <div
          v-if="hasMore"
          class="mt-4 flex justify-center"
        >
          <UButton
            variant="soft"
            color="neutral"
            :loading="loadingMore"
            @click="handleLoadMore"
          >
            <UIcon
              name="lucide:chevrons-down"
              class="mr-2 h-4 w-4"
            />
            Charger plus
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type {
  AppointmentStatus,
  AppointmentType,
  ProviderClientAppointmentItem
} from '../../features/clients/api/clients.contract'
import { partitionAppointmentsByTime } from '../../features/clients/domain/clients'
import { getProviderClientAppointments } from '../../features/clients/services/provider-client-appointments.service'
import { resendConsultationPaymentLink } from '../../features/clients/services/provider-client-detail.service'
import { markProviderAppointmentCompleted } from '../../features/calendar/services/provider-calendar.service'
import { mapProviderClientsErrorToMessage, mapResendPaymentLinkErrorToMessage } from '../../features/clients/api/clients-error'
import { ApiFetchError } from '../../services/api/api-error'
import AppointmentFilters from '../molecules/AppointmentFilters.vue'
import AppointmentLine from '../molecules/AppointmentLine.vue'

const props = withDefaults(
  defineProps<{
    clientProfileId: string
    timezone?: string
    defaultExpanded?: boolean
    /**
     * Hotfix-20: client first name used in the resend success toast.
     */
    clientFirstname?: string
  }>(),
  {
    timezone: 'Europe/Paris',
    defaultExpanded: true,
    clientFirstname: undefined
  }
)

const sectionId = useId()
const isExpanded = ref(props.defaultExpanded)
const toast = useToast()

// Filters
const typeFilter = ref<AppointmentType | undefined>(undefined)
const statusFilter = ref<AppointmentStatus | undefined>(undefined)

// Data state
const appointments = ref<ProviderClientAppointmentItem[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref<string | null>(null)

// Action state (mark completed)
const actionPending = ref(false)

// Hotfix-20: appointment id whose payment-link resend is in flight (null = none)
const resendPendingId = ref<string | null>(null)

// Pagination
const PAGE_SIZE = 20
const hasMore = computed(() => nextCursor.value !== null)

// Partitioned lists
const partitioned = computed(() => partitionAppointmentsByTime(appointments.value))
const past = computed(() => partitioned.value.past)
const upcoming = computed(() => partitioned.value.upcoming)

// Labels
const totalLabel = computed(() => {
  const count = appointments.value.length
  if (count === 0) return 'Aucun'
  return `${count} rendez-vous`
})

const emptyStateLabel = computed(() => {
  if (typeFilter.value || statusFilter.value) {
    return 'Aucun rendez-vous ne correspond aux filtres'
  }
  return 'Aucun rendez-vous enregistré'
})

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value
}

async function fetchAppointments(cursor?: string): Promise<void> {
  if (cursor) {
    loadingMore.value = true
  } else {
    loading.value = true
    appointments.value = []
  }
  errorMessage.value = null

  try {
    const response = await getProviderClientAppointments(props.clientProfileId, {
      type: typeFilter.value,
      status: statusFilter.value,
      limit: PAGE_SIZE,
      cursor
    })

    if (cursor) {
      appointments.value = [...appointments.value, ...response.items]
    } else {
      appointments.value = response.items
    }
    nextCursor.value = response.page.nextCursor
  } catch (err) {
    errorMessage.value = mapProviderClientsErrorToMessage(err, 'Impossible de charger les rendez-vous.')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function handleTypeChange(value: AppointmentType | undefined): void {
  typeFilter.value = value
  fetchAppointments()
}

function handleStatusChange(value: AppointmentStatus | undefined): void {
  statusFilter.value = value
  fetchAppointments()
}

function handleLoadMore(): void {
  if (nextCursor.value) {
    fetchAppointments(nextCursor.value)
  }
}

async function handleMarkCompleted(payload: { appointmentId: string }): Promise<void> {
  if (actionPending.value) return
  actionPending.value = true

  try {
    await markProviderAppointmentCompleted(payload.appointmentId, { status: 'completed' })
    toast.add({
      title: 'Consultation terminée',
      description: 'La consultation a été marquée comme terminée.',
      color: 'primary'
    })
    // Refresh the list to show updated status
    await fetchAppointments()
  } catch (err) {
    if (err instanceof ApiFetchError && err.apiError.code === 'CONSULTATION_NOT_PAID') {
      toast.add({
        title: 'Paiement requis',
        description: 'Le paiement doit être effectué avant de marquer la consultation comme terminée.',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Erreur',
        description: mapProviderClientsErrorToMessage(err, 'Impossible de marquer la consultation comme terminée.'),
        color: 'error'
      })
    }
  } finally {
    actionPending.value = false
  }
}

/**
 * Hotfix-20: re-delivers the payment link email of an unpaid consultation.
 * The button is loading/disabled per line while the send is in flight.
 */
async function handleResendPaymentLink(payload: { appointmentId: string }): Promise<void> {
  if (resendPendingId.value) return
  resendPendingId.value = payload.appointmentId

  try {
    const result = await resendConsultationPaymentLink(payload.appointmentId)
    if (!result.sent) throw new Error('Payment link resend returned sent=false')

    const clientFirstname = props.clientFirstname?.trim() || 'la cliente'
    toast.add({
      title: `Lien de paiement renvoyé à ${clientFirstname}`,
      color: 'primary'
    })
  } catch (err) {
    toast.add({
      title: 'Erreur',
      description: mapResendPaymentLinkErrorToMessage(err),
      color: 'error'
    })
  } finally {
    resendPendingId.value = null
  }
}

// Initial fetch
onMounted(() => {
  fetchAppointments()
})
</script>
