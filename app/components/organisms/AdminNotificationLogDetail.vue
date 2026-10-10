<template>
  <div
    class="space-y-6 p-4"
    data-testid="admin-notification-log-detail"
  >
    <!-- Type & Status -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Type
        </span>
        <div class="mt-2">
          <span :class="`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getNotificationTypeBadgeClasses(detail.type)}`">
            {{ detail.type }}
          </span>
        </div>
      </div>

      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Status
        </span>
        <div class="mt-2">
          <span :class="`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getNotificationStatusBadgeClasses(detail.status)}`">
            {{ getNotificationStatusLabel(detail.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Channel -->
    <div>
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Channel
      </span>
      <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
        {{ detail.channel }}
      </p>
    </div>

    <!-- Date -->
    <div>
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Date
      </span>
      <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
        {{ formatNotificationDate(detail.createdAt) }}
      </p>
    </div>

    <!-- Recipient -->
    <div>
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Destinataire (hash)
      </span>
      <p class="mt-2 break-all font-mono text-xs text-[color:var(--color-brand-secondary)]">
        {{ detail.recipient }}
      </p>
    </div>

    <!-- Payload Preview -->
    <div v-if="detail.payloadPreview">
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Payload Preview
      </span>
      <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-[color:var(--color-surface-muted)] p-4 text-xs text-[color:var(--color-brand-primary)]">{{ detail.payloadPreview }}</pre>
    </div>

    <!-- Error Message -->
    <div
      v-if="detail.errorMessage"
      class="rounded-lg bg-[color:var(--color-error-50)] p-4"
    >
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-error-600)]">
        Erreur
      </span>
      <p class="mt-2 text-sm text-[color:var(--color-error-700)]">
        {{ detail.errorMessage }}
      </p>
    </div>

    <!-- Provider Info -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Provider Message ID
        </span>
        <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
          {{ detail.providerMessageId ?? '—' }}
        </p>
      </div>

      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Tentatives
        </span>
        <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
          {{ detail.attemptCount }}
        </p>
      </div>
    </div>

    <!-- IDs -->
    <div class="space-y-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Client ID
        </span>
        <p
          class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]"
          data-testid="admin-notification-log-client-id"
        >
          {{ detail.clientId ?? '—' }}
        </p>
      </div>

      <div v-if="detail.appointmentId">
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Appointment ID
        </span>
        <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
          {{ detail.appointmentId }}
        </p>
      </div>

      <div>
        <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
          Log ID
        </span>
        <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
          {{ detail.id }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getNotificationStatusBadgeClasses,
  getNotificationTypeBadgeClasses,
  getNotificationStatusLabel
} from '~/composables/useAdminBadges'
import type { AdminNotificationLogDetail } from '~/features/admin/api/admin-notification-log.contract'
import { formatNotificationDate } from '~/features/admin/format-notification-date'

defineProps<{ detail: AdminNotificationLogDetail }>()
</script>
