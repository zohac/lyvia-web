<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'
import { getPaymentStatusDisplay } from '../../features/payments/domain/payment-display'
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
  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency }).format(payment.amountCents / 100)
  const fee = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency }).format(payment.platformFeeCents / 100)
  const net = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency }).format((payment.amountCents - payment.platformFeeCents) / 100)

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
    amount,
    fee,
    net,
    paymentDate,
    appointmentWhen
  }
}))

function statusPillClasses(tone: ReturnType<typeof getPaymentStatusDisplay>['tone']): string {
  if (tone === 'success') return 'bg-[rgba(34,197,94,0.12)] text-[color:rgb(22,163,74)] border-[rgba(34,197,94,0.16)]'
  if (tone === 'danger') return 'bg-[rgba(239,68,68,0.12)] text-[color:rgb(220,38,38)] border-[rgba(239,68,68,0.16)]'
  return 'bg-[rgba(120,113,108,0.12)] text-[color:var(--color-brand-primary)] border-[rgba(120,113,108,0.16)]'
}

function stagePillClasses(stage: ProviderPaymentListItem['client']['stage']): string {
  if (stage === 'active') return 'bg-[rgba(181,192,163,0.22)] text-[color:var(--color-brand-primary)] border-[rgba(181,192,163,0.3)]'
  return 'bg-[rgba(212,184,160,0.24)] text-[color:var(--color-brand-primary)] border-[rgba(212,184,160,0.34)]'
}

function openReceipt(url: string) {
  if (!import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section class="grid gap-6 rounded-blob-d border border-white/60 bg-white/80 p-7 shadow-soft backdrop-blur-md">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
          Paiements
        </h3>
        <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
          Montants, commission Kaora et reçus lorsqu’ils sont disponibles.
        </p>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        class="rounded-full"
        :loading="pending"
        @click="emit('refresh')"
      >
        Rafraîchir
      </UButton>
    </div>

    <SystemAlert
      v-if="errorMessage"
      variant="error"
      title="Impossible de charger les paiements"
      :description="errorMessage"
    />

    <div
      v-else-if="pending"
      class="grid gap-4"
      role="status"
      aria-live="polite"
    >
      <div class="h-24 rounded-blob-a bg-[color:var(--color-surface-highlight)]" />
      <div class="h-24 rounded-blob-b bg-[color:var(--color-surface-highlight)]" />
    </div>

    <div
      v-else-if="formattedPayments.length === 0"
      class="rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/70 p-6 text-sm text-[color:var(--color-brand-secondary)]"
    >
      Aucun paiement à afficher pour le moment.
    </div>

    <div v-else class="grid gap-3">
      <article
        v-for="payment in formattedPayments"
        :key="payment.id"
        class="grid gap-4 rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-6 shadow-soft sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
              {{ payment.client.firstname }} {{ payment.client.lastname }}
            </p>
            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              :class="stagePillClasses(payment.client.stage)"
            >
              {{ payment.client.stage === 'active' ? 'Active' : 'Lead' }}
            </span>
            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              :class="statusPillClasses(payment.status.tone)"
            >
              {{ payment.status.label }}
            </span>
          </div>

          <div class="grid gap-1 text-xs text-[color:var(--color-brand-muted)]">
            <p>
              Paiement : <span class="font-semibold text-[color:var(--color-brand-primary)]">{{ payment.paymentDate }}</span>
            </p>
            <p v-if="payment.appointmentWhen">
              RDV : <span class="font-semibold text-[color:var(--color-brand-primary)]">{{ payment.appointmentWhen }}</span>
            </p>
          </div>

          <dl class="mt-2 grid gap-2 rounded-blob-a bg-[color:var(--color-surface-highlight)] p-4 text-sm text-[color:var(--color-brand-primary)] sm:grid-cols-3">
            <div class="grid gap-1">
              <dt class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Montant
              </dt>
              <dd class="font-semibold">
                {{ payment.amount }}
              </dd>
            </div>
            <div class="grid gap-1">
              <dt class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Commission Kaora
              </dt>
              <dd class="font-semibold">
                {{ payment.fee }}
              </dd>
            </div>
            <div class="grid gap-1">
              <dt class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Vous recevez
              </dt>
              <dd class="font-semibold">
                {{ payment.net }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="flex flex-col gap-2 sm:items-end">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:bg-[color:var(--color-brand-subtle)] disabled:text-[color:var(--color-brand-secondary)]"
            :disabled="!payment.receiptUrl"
            @click="payment.receiptUrl ? openReceipt(payment.receiptUrl) : undefined"
          >
            <Icon
              name="lucide:external-link"
              size="16"
              aria-hidden="true"
            />
            Voir le reçu
          </button>
          <span
            v-if="!payment.receiptUrl"
            class="text-xs text-[color:var(--color-brand-muted)]"
          >
            {{ payment.status.tone === 'success' ? 'Disponible sous peu.' : 'Reçu indisponible.' }}
          </span>
        </div>
      </article>

      <div class="flex flex-col gap-2">
        <button
          v-if="nextCursor"
          type="button"
          class="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadMorePending"
          @click="emit('loadMore')"
        >
          <Icon
            name="lucide:chevron-down"
            size="16"
            aria-hidden="true"
          />
          {{ loadMorePending ? 'Chargement…' : 'Charger plus' }}
        </button>

        <p v-if="loadMoreErrorMessage" class="text-sm text-[color:var(--color-brand-primary)]">
          {{ loadMoreErrorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>
