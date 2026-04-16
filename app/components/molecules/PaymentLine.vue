<template>
  <div
    class="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
    :class="lineClasses"
  >
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <!-- Status icon -->
      <div
        class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
        :class="iconClasses"
      >
        <UIcon
          v-if="payment.status === 'succeeded'"
          name="lucide:check-circle"
          class="h-5 w-5"
        />
        <UIcon
          v-else-if="payment.status === 'failed'"
          name="lucide:x-circle"
          class="h-5 w-5"
        />
        <UIcon
          v-else
          name="lucide:clock"
          class="h-5 w-5"
        />
      </div>

      <div class="min-w-0 flex-1">
        <!-- Amount + Date -->
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span class="font-semibold text-[color:var(--color-text-primary)]">
            {{ formattedAmount }}
          </span>
          <span class="text-sm text-[color:var(--color-text-muted)]">
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
          >
            Voir le reçu
            <UIcon
              name="lucide:external-link"
              class="ml-1 h-3 w-3"
            />
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
    payment: PaymentDisplayItem
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
    return 'border-[color:var(--color-error-200)] bg-[color:var(--color-error-50)]'
  }
  if (props.payment.status === 'pending') {
    return 'border-[color:var(--color-sunset-200)] bg-[color:var(--color-sunset-50)]'
  }
  return 'border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)]'
})

const iconClasses = computed(() => {
  if (props.payment.status === 'succeeded') {
    return 'text-[color:var(--color-success-600)]'
  }
  if (props.payment.status === 'failed') {
    return 'text-[color:var(--color-error-600)]'
  }
  return 'text-[color:var(--color-sunset-600)]'
})
</script>
