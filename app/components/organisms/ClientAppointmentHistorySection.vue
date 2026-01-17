<template>
  <UCard
    variant="ops"
    class="rounded-blob-c"
  >
    <!-- Collapsible header -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-4"
      :aria-expanded="isExpanded"
      :aria-controls="sectionId"
      @click="toggleExpanded"
    >
      <h2 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
        Rendez-vous
      </h2>
      <div class="flex items-center gap-3">
        <span
          v-if="!loading"
          class="text-xs text-[color:var(--color-brand-muted)]"
        >
          {{ totalLabel }}
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="h-5 w-5 text-[color:var(--color-brand-muted)] transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
        />
      </div>
    </button>

    <!-- Collapsible content -->
    <div
      v-show="isExpanded"
      :id="sectionId"
      class="mt-4"
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
        class="grid gap-3"
      >
        <div
          v-for="index in 3"
          :key="`appointment-skeleton-${index}`"
          class="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-white/70 bg-white/60 p-4 shadow-soft"
        >
          <div class="grid gap-2">
            <USkeleton class="h-4 w-36" />
            <USkeleton class="h-3 w-44" />
          </div>
          <USkeleton class="h-6 w-20 rounded-full" />
        </div>
      </div>

      <!-- Error state -->
      <SystemAlert
        v-else-if="errorMessage"
        variant="error"
        :description="errorMessage"
      />

      <!-- Empty state -->
      <div
        v-else-if="appointments.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-8 text-center"
      >
        <span class="i-lucide-calendar-x h-10 w-10 text-[color:var(--color-brand-muted)]" />
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          {{ emptyStateLabel }}
        </p>
      </div>

      <!-- Appointments list -->
      <div
        v-else
        class="grid gap-3"
      >
        <!-- Upcoming appointments section -->
        <template v-if="upcoming.length > 0">
          <span class="text-xs font-medium uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
            À venir
          </span>
          <AppointmentLine
            v-for="apt in upcoming"
            :key="apt.id"
            :appointment="apt"
            :timezone="timezone"
            temporal-context="upcoming"
          />
        </template>

        <!-- Past appointments section -->
        <template v-if="past.length > 0">
          <span
            class="text-xs font-medium uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]"
            :class="{ 'mt-4': upcoming.length > 0 }"
          >
            Passés
          </span>
          <AppointmentLine
            v-for="apt in past"
            :key="apt.id"
            :appointment="apt"
            :timezone="timezone"
            temporal-context="past"
          />
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
import { mapProviderClientsErrorToMessage } from '../../features/clients/api/clients-error'
import AppointmentFilters from '../molecules/AppointmentFilters.vue'
import AppointmentLine from '../molecules/AppointmentLine.vue'
import SystemAlert from '../atoms/SystemAlert.vue'

const props = withDefaults(
  defineProps<{
    /**
     * Client profile ID for fetching appointments.
     */
    clientProfileId: string
    /**
     * Timezone for date formatting.
     */
    timezone?: string
    /**
     * Initial expanded state.
     */
    defaultExpanded?: boolean
  }>(),
  {
    timezone: 'Europe/Paris',
    defaultExpanded: true
  }
)

const sectionId = useId()
const isExpanded = ref(props.defaultExpanded)

// Filters
const typeFilter = ref<AppointmentType | undefined>(undefined)
const statusFilter = ref<AppointmentStatus | undefined>(undefined)

// Data state
const appointments = ref<ProviderClientAppointmentItem[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref<string | null>(null)

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

// Initial fetch
onMounted(() => {
  fetchAppointments()
})
</script>
