<!--
  Provider Requests Panel (extracted from requests.vue for DS3.1 tab fusion)

  Lists client requests (cancellation/reschedule) with status filter.
  Allows provider to accept or reject pending requests.

  @see US-6 - Provider request processing
-->
<script setup lang="ts">
import type { ProviderRequestItem, ProviderRequestStatusFilter } from '../../features/provider-requests/api/provider-requests.contract'
import { REQUEST_STATUS_LABELS } from '../../features/provider-requests/api/provider-requests.contract'
import { useProviderRequests } from '../../features/provider-requests/useProviderRequests'

const {
  requests,
  pendingCount,
  loading,
  error,
  currentStatus,
  fetchRequests,
  refresh,
  processing,
  actionError,
  acceptCancellation,
  acceptReschedule,
  reject
} = useProviderRequests()

const statusFilters: ProviderRequestStatusFilter[] = ['pending', 'accepted', 'rejected', 'all']

const acceptModalOpen = ref(false)
const rejectModalOpen = ref(false)
const selectedRequest = ref<ProviderRequestItem | null>(null)

const requestsEmptyDescription = computed(() => {
  switch (currentStatus.value) {
    case 'pending':
      return 'Vous n\'avez pas de demande en attente de traitement.'
    case 'accepted':
      return 'Aucune demande acceptée.'
    case 'rejected':
      return 'Aucune demande refusée.'
    default:
      return 'Aucune demande pour le moment.'
  }
})

function handleFilterChange(status: ProviderRequestStatusFilter) {
  fetchRequests(status)
}

function handleAcceptClick(requestId: string) {
  const request = requests.value.find(r => r.id === requestId)
  if (request) {
    selectedRequest.value = request
    acceptModalOpen.value = true
  }
}

function handleRejectClick(requestId: string) {
  const request = requests.value.find(r => r.id === requestId)
  if (request) {
    selectedRequest.value = request
    rejectModalOpen.value = true
  }
}

async function handleAcceptConfirm(providerNote: string | null, newScheduledAt?: string) {
  if (!selectedRequest.value) return

  let result
  if (selectedRequest.value.type === 'reschedule' && newScheduledAt) {
    result = await acceptReschedule(selectedRequest.value.id, newScheduledAt, providerNote)
  } else {
    result = await acceptCancellation(selectedRequest.value.id, providerNote)
  }

  if (result) {
    acceptModalOpen.value = false
    selectedRequest.value = null
    await refresh()
  }
}

async function handleRejectConfirm(providerNote: string | null) {
  if (!selectedRequest.value) return

  const result = await reject(selectedRequest.value.id, providerNote)
  if (result) {
    rejectModalOpen.value = false
    selectedRequest.value = null
    await refresh()
  }
}

onMounted(() => {
  fetchRequests('pending')
})
</script>

<template>
  <div class="mt-6 space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-[color:var(--color-text-muted)]">
        {{ pendingCount }} demande{{ pendingCount > 1 ? 's' : '' }} en attente
      </p>
    </div>

    <!-- Filter tabs -->
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="status in statusFilters"
        :key="status"
        :variant="currentStatus === status ? 'solid' : 'ghost'"
        :color="currentStatus === status ? 'primary' : 'neutral'"
        size="sm"
        @click="handleFilterChange(status)"
      >
        {{ REQUEST_STATUS_LABELS[status] }}
        <UBadge
          v-if="status === 'pending' && pendingCount > 0"
          color="warning"
          variant="solid"
          size="xs"
          class="ml-1.5"
        >
          {{ pendingCount }}
        </UBadge>
      </UButton>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <UCard
        v-for="i in 3"
        :key="i"
        class="bg-[color:var(--color-surface-card)]"
      >
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <USkeleton class="h-5 w-20 rounded-full" />
            <USkeleton class="h-5 w-16 rounded-full" />
          </div>
          <USkeleton class="h-6 w-2/3" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
          </div>
          <div class="flex gap-3 pt-2">
            <USkeleton class="h-9 flex-1" />
            <USkeleton class="h-9 flex-1" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error state -->
    <AtomsDsErrorState
      v-else-if="error"
      :message="error"
      @retry="refresh()"
    />

    <!-- Empty state -->
    <AtomsDsEmptyState
      v-else-if="requests.length === 0"
      icon="i-lucide-inbox"
      title="Aucune demande"
      :description="requestsEmptyDescription"
    />

    <!-- Requests grid -->
    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <OrganismsProviderRequestCard
        v-for="request in requests"
        :key="request.id"
        :request="request"
        :processing="processing"
        @accept="handleAcceptClick"
        @reject="handleRejectClick"
      />
    </div>

    <!-- Accept Modal -->
    <OrganismsProviderAcceptRequestModal
      v-model:open="acceptModalOpen"
      :request="selectedRequest"
      :processing="processing"
      :error="actionError"
      @confirm="handleAcceptConfirm"
    />

    <!-- Reject Modal -->
    <OrganismsProviderRejectRequestModal
      v-model:open="rejectModalOpen"
      :request="selectedRequest"
      :processing="processing"
      :error="actionError"
      @confirm="handleRejectConfirm"
    />
  </div>
</template>
