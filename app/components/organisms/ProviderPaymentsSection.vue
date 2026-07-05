<script setup lang="ts">
import { getPaymentStatusDisplay } from '../../features/payments/domain/payment-display'
import {
  formatCentsToCurrency,
  formatProviderPaymentAmounts
} from '../../features/payments/domain/provider-payment-display'
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

const expandedId = ref<string | null>(null)

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function initials(firstname: string, lastname: string): string {
  return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase()
}

// DS status pill palette (dot + soft background) keyed by the display tone.
const STATUS_PILL: Record<'success' | 'danger' | 'neutral', { wrap: string, dot: string }> = {
  success: {
    wrap: 'bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] border-[color:var(--color-success-100)]',
    dot: 'bg-[color:var(--color-success)]'
  },
  danger: {
    wrap: 'bg-[color:var(--color-error-50)] text-[color:var(--color-error-600)] border-[color:var(--color-error-200)]',
    dot: 'bg-[color:var(--color-error)]'
  },
  neutral: {
    wrap: 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-subtle)]',
    dot: 'bg-[color:var(--color-neutral-400)]'
  }
}

function statusPill(tone: ReturnType<typeof getPaymentStatusDisplay>['tone']) {
  return STATUS_PILL[tone] ?? STATUS_PILL.neutral
}

const formattedPayments = computed(() => props.payments.map((payment) => {
  const status = getPaymentStatusDisplay(payment.status)
  const amounts = formatProviderPaymentAmounts(payment)

  const paymentDate = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  }).format(new Date(payment.createdAt))

  let appointmentWhen: string | null = null
  if (payment.appointmentScheduledAt) {
    appointmentWhen = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(payment.appointmentScheduledAt))
  }

  // Compact "Frais" column = commission + Stripe fee (known part). The exact
  // net stays null-safe (HF18/HF19): shown as "—" when the Stripe fee is unknown.
  const feesTotal = formatCentsToCurrency(
    payment.platformFeeCents + (payment.stripeFeeCents ?? 0),
    payment.currency
  )

  return {
    ...payment,
    status,
    fullName: `${payment.client.firstname} ${payment.client.lastname}`,
    initials: initials(payment.client.firstname, payment.client.lastname),
    stageLabel: payment.client.stage === 'active' ? 'Active' : 'Lead',
    amount: amounts.amount,
    commission: amounts.platformFee,
    stripeFee: amounts.stripeFee,
    fees: feesTotal,
    net: amounts.net,
    paymentDate,
    appointmentWhen
  }
}))

function openReceipt(url: string) {
  if (!import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] shadow-[0_1px_3px_rgba(91,75,110,0.08)]">
    <!-- Header (compact, sits directly on the table — DS) -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-5">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]">
          <UIcon
            name="lucide:receipt"
            class="h-5 w-5"
          />
        </div>
        <div>
          <h3 class="font-semibold text-[color:var(--color-text-primary)]">
            Paiements
          </h3>
          <p class="text-sm text-[color:var(--color-text-muted)]">
            Montants, commission Keova et reçus
          </p>
        </div>
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

    <!-- Error state -->
    <div
      v-if="errorMessage"
      class="p-4 sm:p-6"
    >
      <UAlert
        color="error"
        variant="soft"
        title="Impossible de charger les paiements"
        :description="errorMessage"
        icon="i-lucide-alert-circle"
      />
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="pending"
      class="space-y-4 p-4 sm:p-6"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center gap-4"
      >
        <USkeleton class="h-8 w-8 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-3 w-28" />
          <USkeleton class="h-2.5 w-16" />
        </div>
        <USkeleton class="h-3 w-16" />
        <USkeleton class="h-3 w-16" />
        <USkeleton class="h-3 w-16" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="formattedPayments.length === 0"
      class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]">
        <UIcon
          name="lucide:file-text"
          class="h-6 w-6 text-[color:var(--color-text-muted)]"
        />
      </div>
      <p class="text-sm font-medium text-[color:var(--color-text-primary)]">
        Aucun paiement à afficher pour le moment.
      </p>
    </div>

    <!-- Payments table -->
    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                v-for="(head, i) in ['Cliente', 'Statut', 'Dates', 'Montant', 'Frais', 'Vous recevez', '']"
                :key="i"
                class="whitespace-nowrap border-b border-[color:var(--color-border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]"
                :class="i >= 3 ? 'text-right' : 'text-left'"
              >
                {{ head }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="payment in formattedPayments"
              :key="payment.id"
            >
              <tr
                class="cursor-pointer transition-colors hover:bg-[color:var(--color-surface-page)]"
                @click="toggle(payment.id)"
              >
                <!-- Cliente -->
                <td class="border-b border-[color:var(--color-border-subtle)] px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-crepuscule-100)] text-xs font-semibold text-[color:var(--color-crepuscule-700)]">
                      {{ payment.initials }}
                    </span>
                    <div class="min-w-0">
                      <div class="whitespace-nowrap text-sm font-medium text-[color:var(--color-text-primary)]">
                        {{ payment.fullName }}
                      </div>
                      <span
                        class="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        :class="payment.client.stage === 'active'
                          ? 'bg-[color:var(--color-crepuscule-50)] text-[color:var(--color-crepuscule-700)]'
                          : 'bg-[color:var(--color-sunset-50)] text-[color:var(--color-sunset-700)]'"
                      >
                        {{ payment.stageLabel }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Statut -->
                <td class="border-b border-[color:var(--color-border-subtle)] px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    :class="statusPill(payment.status.tone).wrap"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="statusPill(payment.status.tone).dot"
                    />
                    {{ payment.status.label }}
                  </span>
                </td>

                <!-- Dates -->
                <td class="whitespace-nowrap border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-sm text-[color:var(--color-text-muted)]">
                  <div>{{ payment.paymentDate }}</div>
                  <div
                    v-if="payment.appointmentWhen"
                    class="mt-0.5 text-xs"
                  >
                    RDV {{ payment.appointmentWhen }}
                  </div>
                </td>

                <!-- Montant -->
                <td class="whitespace-nowrap border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-right text-sm font-medium text-[color:var(--color-text-primary)]">
                  {{ payment.amount }}
                </td>

                <!-- Frais -->
                <td class="whitespace-nowrap border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-right text-sm text-[color:var(--color-text-muted)]">
                  − {{ payment.fees }}
                </td>

                <!-- Vous recevez -->
                <td class="whitespace-nowrap border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-right text-sm font-semibold text-[color:var(--color-success-600)]">
                  {{ payment.net ?? '—' }}
                </td>

                <!-- Receipt + chevron -->
                <td class="border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      v-if="payment.receiptUrl"
                      type="button"
                      title="Voir le reçu"
                      class="grid h-8 w-8 place-items-center rounded-full border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)]"
                      @click.stop="openReceipt(payment.receiptUrl)"
                    >
                      <UIcon
                        name="lucide:file-text"
                        class="h-4 w-4"
                      />
                    </button>
                    <span
                      v-else
                      class="whitespace-nowrap text-[11px] text-[color:var(--color-text-muted)]"
                    >
                      {{ payment.status.tone === 'success' ? 'Sous peu' : 'Indisponible' }}
                    </span>
                    <UIcon
                      name="lucide:chevron-down"
                      class="h-3.5 w-3.5 text-[color:var(--color-text-muted)] transition-transform duration-200"
                      :class="expandedId === payment.id ? 'rotate-180' : ''"
                    />
                  </div>
                </td>
              </tr>

              <!-- Expanded detail -->
              <tr v-if="expandedId === payment.id">
                <td
                  colspan="7"
                  class="border-b border-[color:var(--color-border-subtle)] p-0"
                >
                  <div class="grid grid-cols-2 gap-5 bg-[color:var(--color-surface-muted)] px-6 py-5 sm:grid-cols-4">
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Montant brut
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {{ payment.amount }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Commission Keova
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        − {{ payment.commission }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Frais Stripe
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {{ payment.stripeFee ? `− ${payment.stripeFee}` : 'à venir' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Vous recevez
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-success-600)]">
                        {{ payment.net ?? '—' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Méthode de paiement
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        Carte bancaire
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Référence
                      </div>
                      <div class="mt-1 font-mono text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {{ payment.id }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Rendez-vous
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {{ payment.appointmentWhen ?? '—' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text-muted)]">
                        Statut
                      </div>
                      <div class="mt-1 text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {{ payment.status.label }}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Load more -->
      <div
        v-if="nextCursor"
        class="flex flex-col items-center gap-2 px-6 py-6"
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
    </template>
  </div>
</template>
