<template>
  <UCard
    variant="subtle"
    class="rounded-blob-d"
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
        Paiements
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
      <PaymentFilters
        :status="statusFilter"
        class="mb-4"
        @update:status="handleStatusChange"
      />

      <!-- Loading skeleton -->
      <div
        v-if="loading"
        class="grid gap-3"
      >
        <div
          v-for="index in 3"
          :key="`payment-skeleton-${index}`"
          class="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-white/70 bg-white/60 p-4 shadow-soft"
        >
          <div class="grid gap-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-3 w-32" />
          </div>
          <USkeleton class="h-6 w-16 rounded-full" />
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
        v-else-if="payments.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-8 text-center"
      >
        <span class="i-lucide-credit-card h-10 w-10 text-[color:var(--color-brand-muted)]" />
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          {{ emptyStateLabel }}
        </p>
      </div>

      <!-- Payments list -->
      <div
        v-else
        class="grid gap-3"
      >
        <PaymentLine
          v-for="payment in payments"
          :key="payment.id"
          :payment="payment"
          :timezone="timezone"
        />

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
  PaymentStatus,
  ProviderClientPaymentItem
} from '../../features/clients/api/clients.contract'
import { getProviderClientPayments } from '../../features/clients/services/provider-client-payments.service'
import { mapProviderClientsErrorToMessage } from '../../features/clients/api/clients-error'
import PaymentFilters from '../molecules/PaymentFilters.vue'
import PaymentLine from '../molecules/PaymentLine.vue'
import SystemAlert from '../atoms/SystemAlert.vue'

const props = withDefaults(
  defineProps<{
    /**
     * Client profile ID for fetching payments.
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
const statusFilter = ref<PaymentStatus | undefined>(undefined)

// Data state
const payments = ref<ProviderClientPaymentItem[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref<string | null>(null)

// Pagination
const PAGE_SIZE = 20
const hasMore = computed(() => nextCursor.value !== null)

// Labels
const totalLabel = computed(() => {
  const count = payments.value.length
  if (count === 0) return 'Aucun'
  return `${count} ${count === 1 ? 'paiement' : 'paiements'}`
})

const emptyStateLabel = computed(() => {
  if (statusFilter.value) {
    return 'Aucun paiement ne correspond au filtre'
  }
  return 'Aucun paiement enregistré'
})

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value
}

async function fetchPayments(cursor?: string): Promise<void> {
  if (cursor) {
    loadingMore.value = true
  } else {
    loading.value = true
    payments.value = []
  }
  errorMessage.value = null

  try {
    const response = await getProviderClientPayments(props.clientProfileId, {
      status: statusFilter.value,
      limit: PAGE_SIZE,
      cursor
    })

    if (cursor) {
      payments.value = [...payments.value, ...response.items]
    } else {
      payments.value = response.items
    }
    nextCursor.value = response.page.nextCursor
  } catch (err) {
    errorMessage.value = mapProviderClientsErrorToMessage(err, 'Impossible de charger les paiements.')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function handleStatusChange(value: PaymentStatus | undefined): void {
  statusFilter.value = value
  fetchPayments()
}

function handleLoadMore(): void {
  if (nextCursor.value) {
    fetchPayments(nextCursor.value)
  }
}

// Initial fetch
onMounted(() => {
  fetchPayments()
})
</script>
