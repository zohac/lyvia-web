<template>
  <div
    class="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4 transition-colors"
    :class="lineClasses"
  >
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <!-- Status icon -->
      <span
        class="mt-0.5 h-5 w-5 shrink-0"
        :class="iconClasses"
      >
        <svg
          v-if="payment.status === 'succeeded'"
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
        <svg
          v-else-if="payment.status === 'failed'"
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
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        <svg
          v-else
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
          <path d="M12 6v6l4 2" />
        </svg>
      </span>

      <div class="min-w-0 flex-1">
        <!-- Amount + Date -->
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span class="font-semibold text-[color:var(--color-brand-primary)]">
            {{ formattedAmount }}
          </span>
          <span class="text-sm text-[color:var(--color-brand-secondary)]">
            {{ formattedDate }}
          </span>
        </div>

        <!-- Receipt link -->
        <div class="mt-1 flex items-center gap-2 text-xs">
          <UButton
            v-if="payment.receiptUrl"
            :to="payment.receiptUrl"
            external
            target="_blank"
            variant="link"
            size="xs"
            class="h-auto p-0 text-xs"
            trailing-icon="i-lucide-external-link"
          >
            Voir le reçu
          </UButton>
          <span
            v-else
            class="text-[color:var(--color-brand-muted)]"
          >
            Reçu non disponible
          </span>
        </div>
      </div>
    </div>

    <!-- Status badge -->
    <UBadge
      :color="statusMeta.color"
      variant="soft"
      class="shrink-0"
    >
      {{ statusMeta.label }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
import type { PaymentDisplayItem } from '../../features/clients/api/clients.contract'
import {
  formatAmountCents,
  formatPaymentDate,
  getPaymentStatusMeta
} from '../../features/clients/domain/clients'

const props = withDefaults(
  defineProps<{
    /**
     * Payment data to display.
     * Accepts both detailed and list item formats.
     */
    payment: PaymentDisplayItem
    /**
     * Timezone for date formatting.
     */
    timezone?: string
  }>(),
  {
    timezone: 'Europe/Paris'
  }
)

const statusMeta = computed(() => getPaymentStatusMeta(props.payment.status))
const formattedAmount = computed(() => formatAmountCents(props.payment.amountCents, props.payment.currency))
const formattedDate = computed(() => formatPaymentDate(props.payment.createdAt, props.timezone))

const lineClasses = computed(() => {
  if (props.payment.status === 'failed') {
    return 'border-[color:var(--color-error)]/20 bg-[color:var(--color-error)]/5'
  }
  if (props.payment.status === 'pending') {
    return 'border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5'
  }
  return 'border-white/70 bg-white/60'
})

const iconClasses = computed(() => {
  if (props.payment.status === 'succeeded') {
    return 'text-[color:var(--color-success)]'
  }
  if (props.payment.status === 'failed') {
    return 'text-[color:var(--color-error)]'
  }
  return 'text-[color:var(--color-warning)]'
})
</script>
