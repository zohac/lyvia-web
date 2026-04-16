<!--
  ProviderRequestCard.vue

  Card displaying a client request (cancellation/reschedule) with actions.

  @see US-6 - Provider request processing
-->
<script setup lang="ts">
import type { ProviderRequestItem } from '../../features/provider-requests/api/provider-requests.contract'
import { getReasonLabel } from '../../features/provider-requests/api/provider-requests.contract'

const props = defineProps<{
  request: ProviderRequestItem
  processing?: boolean
}>()

const emit = defineEmits<{
  accept: [requestId: string]
  reject: [requestId: string]
}>()

/**
 * Client full name
 */
const clientName = computed(() =>
  `${props.request.appointment.client.firstName} ${props.request.appointment.client.lastName}`
)

/**
 * Formatted appointment date
 */
const formattedDate = computed(() => {
  const date = new Date(props.request.appointment.scheduledAt)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(date)
})

/**
 * Request submission date (relative)
 */
const submittedAt = computed(() => {
  const date = new Date(props.request.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }
  if (diffHours > 0) {
    return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
  }
  return 'à l\'instant'
})

/**
 * Type label and styling
 */
const typeConfig = computed(() => {
  if (props.request.type === 'cancellation') {
    return {
      label: 'Annulation',
      color: 'error' as const,
      icon: 'lucide:calendar-x'
    }
  }
  return {
    label: 'Report',
    color: 'info' as const,
    icon: 'lucide:calendar-clock'
  }
})

/**
 * Status config
 */
const statusConfig = computed(() => {
  switch (props.request.status) {
    case 'pending':
      return { label: 'En attente', color: 'warning' as const }
    case 'accepted':
      return { label: 'Acceptée', color: 'success' as const }
    case 'rejected':
      return { label: 'Refusée', color: 'error' as const }
    default:
      return { label: 'Inconnu', color: 'neutral' as const }
  }
})

const isPending = computed(() => props.request.status === 'pending')
</script>

<template>
  <UCard class="bg-[color:var(--color-surface-card)]">
    <div class="space-y-4">
      <!-- Header: Type + Status badges -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UBadge
            :color="typeConfig.color"
            variant="soft"
            size="sm"
          >
            <UIcon
              :name="typeConfig.icon"
              class="mr-1 h-3.5 w-3.5"
            />
            {{ typeConfig.label }}
          </UBadge>
          <UBadge
            :color="statusConfig.color"
            variant="subtle"
            size="sm"
          >
            {{ statusConfig.label }}
          </UBadge>
        </div>
        <span class="text-xs text-[color:var(--color-brand-muted)]">
          {{ submittedAt }}
        </span>
      </div>

      <!-- Client name -->
      <div>
        <h3 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
          {{ clientName }}
        </h3>
      </div>

      <!-- Appointment details -->
      <div class="flex items-center gap-3 rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-card)] shadow-sm">
          <UIcon
            name="lucide:calendar"
            class="h-5 w-5 text-crepuscule-600"
          />
        </div>
        <div>
          <p class="font-medium capitalize text-[color:var(--color-text-primary)]">
            {{ formattedDate }}
          </p>
          <p class="text-sm text-[color:var(--color-text-muted)]">
            {{ request.appointment.durationMinutes }} minutes
          </p>
        </div>
      </div>

      <!-- Reason -->
      <div class="space-y-1">
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Motif
        </p>
        <p class="font-medium text-[color:var(--color-text-primary)]">
          {{ getReasonLabel(request.reason) }}
        </p>
      </div>

      <!-- Details (if provided) -->
      <div
        v-if="request.details"
        class="space-y-1"
      >
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Message du client
        </p>
        <p class="rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-3 text-sm italic text-[color:var(--color-text-secondary)]">
          "{{ request.details }}"
        </p>
      </div>

      <!-- Actions (only for pending) -->
      <div
        v-if="isPending"
        class="flex items-center gap-3 border-t border-[color:var(--color-neutral-100)] pt-4"
      >
        <UButton
          color="success"
          variant="soft"
          :loading="processing"
          class="flex-1"
          @click="emit('accept', request.id)"
        >
          <UIcon
            name="lucide:check"
            class="mr-1.5 h-4 w-4"
          />
          Accepter
        </UButton>
        <UButton
          color="error"
          variant="soft"
          :loading="processing"
          class="flex-1"
          @click="emit('reject', request.id)"
        >
          <UIcon
            name="lucide:x"
            class="mr-1.5 h-4 w-4"
          />
          Refuser
        </UButton>
      </div>
    </div>
  </UCard>
</template>
