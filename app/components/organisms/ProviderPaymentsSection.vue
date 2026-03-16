<script setup lang="ts">
import { getPaymentStatusDisplay } from '../../features/payments/domain/payment-display'
import { formatProviderPaymentAmounts } from '../../features/payments/domain/provider-payment-display'
import type { ProviderPaymentListItem } from '../../features/payments/api/provider-payments.contract'

type Props = {
  pending: boolean
  errorMessage: string | null
  payments: ProviderPaymentListItem[]
  nextCursor: string | null
  loadMorePending: boolean
  loadMoreErrorMessage: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'refresh' | 'loadMore'): void
}>()

const formattedPayments = computed(() => props.payments.map((payment) => {
  const status = getPaymentStatusDisplay(payment.status)
  const amounts = formatProviderPaymentAmounts(payment)

  const paymentDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(payment.createdAt))

  let appointmentWhen: string | null = null
  if (payment.appointmentScheduledAt) {
    appointmentWhen = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(payment.appointmentScheduledAt))
  }

  return {
    ...payment,
    status,
    amount: amounts.amount,
    fee: amounts.platformFee,
    stripeFee: amounts.stripeFee,
    net: amounts.net,
    paymentDate,
    appointmentWhen
  }
}))

function getStatusBadgeColor(tone: ReturnType<typeof getPaymentStatusDisplay>['tone']): 'success' | 'error' | 'neutral' {
  if (tone === 'success') return 'success'
  if (tone === 'danger') return 'error'
  return 'neutral'
}

function getStageBadgeColor(stage: ProviderPaymentListItem['client']['stage']): 'primary' | 'warning' {
  return stage === 'active' ? 'primary' : 'warning'
}

function openReceipt(url: string) {
  if (!import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <UCard class="bg-white">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-stone-900">
            Paiements
          </h3>
          <p class="mt-1 text-sm text-stone-500">
            Montants, commission Keova et reçus
          </p>
        </div>
        <UButton
          variant="outline"
          color="neutral"
          :loading="pending"
          @click="emit('refresh')"
        >
          <UIcon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
          />
          Actualiser
        </UButton>
      </div>
    </template>

    <!-- Error state -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Impossible de charger les paiements"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Loading state -->
    <div
      v-else-if="pending"
      class="space-y-4"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="rounded-lg border border-stone-100 bg-stone-50 p-6"
      >
        <div class="flex items-center gap-4">
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/4" />
          </div>
          <USkeleton class="h-8 w-24" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="formattedPayments.length === 0"
      class="flex flex-col items-center justify-center gap-3 py-12 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <UIcon
          name="lucide:credit-card"
          class="h-6 w-6 text-stone-400"
        />
      </div>
      <p class="text-sm text-stone-500">
        Aucun paiement à afficher pour le moment.
      </p>
    </div>

    <!-- Payments list -->
    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="payment in formattedPayments"
        :key="payment.id"
        class="rounded-lg border border-stone-100 bg-stone-50 p-5 transition-colors hover:bg-stone-100/50"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <!-- Client info and dates -->
          <div class="space-y-3">
            <!-- Client name and badges -->
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold text-stone-900">
                {{ payment.client.firstname }} {{ payment.client.lastname }}
              </p>
              <UBadge
                :color="getStageBadgeColor(payment.client.stage)"
                variant="soft"
                size="sm"
              >
                {{ payment.client.stage === 'active' ? 'Active' : 'Lead' }}
              </UBadge>
              <UBadge
                :color="getStatusBadgeColor(payment.status.tone)"
                variant="soft"
                size="sm"
              >
                {{ payment.status.label }}
              </UBadge>
            </div>

            <!-- Dates -->
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
              <span>
                Paiement : <span class="font-medium text-stone-700">{{ payment.paymentDate }}</span>
              </span>
              <span v-if="payment.appointmentWhen">
                RDV : <span class="font-medium text-stone-700">{{ payment.appointmentWhen }}</span>
              </span>
            </div>

            <!-- Amount breakdown -->
            <div class="grid grid-cols-2 gap-3 rounded-lg bg-white p-4 sm:grid-cols-4">
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Montant
                </p>
                <p class="mt-1 font-semibold text-stone-900">
                  {{ payment.amount }}
                </p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Commission
                </p>
                <p class="mt-1 font-semibold text-stone-900">
                  {{ payment.fee }}
                </p>
              </div>
              <div>
                <UTooltip text="Frais prélevés par Stripe pour le traitement du paiement">
                  <p class="flex cursor-help items-center gap-1 text-xs font-medium uppercase tracking-wider text-stone-500">
                    Frais Stripe
                    <UIcon
                      name="lucide:info"
                      class="h-3 w-3"
                    />
                  </p>
                </UTooltip>
                <p class="mt-1 font-semibold text-stone-900">
                  {{ payment.stripeFee ?? '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Vous recevez
                </p>
                <p class="mt-1 font-semibold text-green-600">
                  {{ payment.net }}
                </p>
              </div>
            </div>
          </div>

          <!-- Receipt button -->
          <div class="flex flex-col items-start gap-1 sm:items-end">
            <UButton
              :disabled="!payment.receiptUrl"
              variant="soft"
              color="neutral"
              @click="payment.receiptUrl ? openReceipt(payment.receiptUrl) : undefined"
            >
              <UIcon
                name="lucide:external-link"
                class="mr-2 h-4 w-4"
              />
              Voir le reçu
            </UButton>
            <span
              v-if="!payment.receiptUrl"
              class="text-xs text-stone-400"
            >
              {{ payment.status.tone === 'success' ? 'Disponible sous peu' : 'Reçu indisponible' }}
            </span>
          </div>
        </div>
      </article>

      <!-- Load more -->
      <div
        v-if="nextCursor"
        class="flex flex-col items-center gap-2 pt-4"
      >
        <UButton
          variant="soft"
          color="neutral"
          :loading="loadMorePending"
          @click="emit('loadMore')"
        >
          <UIcon
            name="lucide:chevrons-down"
            class="mr-2 h-4 w-4"
          />
          Charger plus
        </UButton>

        <UAlert
          v-if="loadMoreErrorMessage"
          color="warning"
          variant="soft"
          :description="loadMoreErrorMessage"
          icon="i-lucide-alert-triangle"
          class="w-full max-w-md"
        />
      </div>
    </div>
  </UCard>
</template>
