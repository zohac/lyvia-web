<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import { getPaymentStatusDisplay } from '../../features/payments/domain/payment-display'
import { useClientPayments } from '../../features/payments/useClientPayments'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Paiements'
})

const list = await useClientPayments()

const formattedPayments = computed(() => list.payments.value.map((payment) => {
  const status = getPaymentStatusDisplay(payment.status)
  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency }).format(payment.amountCents / 100)
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(payment.createdAt))
  return {
    ...payment,
    status,
    amount,
    date
  }
}))

function statusPillClasses(tone: ReturnType<typeof getPaymentStatusDisplay>['tone']): string {
  if (tone === 'success') return 'bg-[rgba(34,197,94,0.12)] text-[color:rgb(22,163,74)] border-[rgba(34,197,94,0.16)]'
  if (tone === 'danger') return 'bg-[rgba(239,68,68,0.12)] text-[color:rgb(220,38,38)] border-[rgba(239,68,68,0.16)]'
  return 'bg-[rgba(120,113,108,0.12)] text-[color:var(--color-brand-primary)] border-[rgba(120,113,108,0.16)]'
}

function openReceipt(url: string) {
  if (!import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section class="grid gap-8">
    <header class="grid gap-2">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
        Paiements
      </p>
      <h1 class="font-serif text-3xl italic text-[color:var(--color-brand-primary)] sm:text-4xl">
        Mes paiements
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
        Retrouvez vos paiements et accédez aux reçus lorsque Stripe les rend disponibles.
      </p>
    </header>

    <SystemAlert
      v-if="list.errorMessage.value"
      variant="error"
      title="Impossible de charger vos paiements"
      :description="list.errorMessage.value"
    />

    <button
      v-if="list.errorMessage.value"
      type="button"
      class="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
      @click="list.refresh"
    >
      <Icon
        name="lucide:refresh-ccw"
        size="16"
        aria-hidden="true"
      />
      Réessayer
    </button>

    <div
      v-else-if="list.pending.value"
      class="grid gap-6"
      role="status"
      aria-live="polite"
    >
      <div class="h-40 rounded-blob-b bg-white/60 shadow-soft" />
      <div class="h-28 rounded-blob-a bg-white/55 shadow-soft" />
      <div class="h-28 rounded-blob-c bg-white/55 shadow-soft" />
    </div>

    <div
      v-else-if="formattedPayments.length === 0"
      class="rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-8 text-sm text-[color:var(--color-brand-secondary)] shadow-soft backdrop-blur"
    >
      Aucun paiement pour le moment.
    </div>

    <div v-else class="grid gap-4">
      <article
        v-for="payment in formattedPayments"
        :key="payment.id"
        class="grid gap-4 rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-6 shadow-soft backdrop-blur sm:grid-cols-[1fr,auto] sm:items-center"
      >
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
              {{ payment.amount }}
            </span>
            <span class="text-xs text-[color:var(--color-brand-muted)]">
              {{ payment.date }}
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              :class="statusPillClasses(payment.status.tone)"
            >
              {{ payment.status.label }}
            </span>
          </div>

          <p
            v-if="payment.status.tone === 'success' && !payment.receiptUrl"
            class="text-xs text-[color:var(--color-brand-muted)]"
          >
            Reçu disponible sous peu.
          </p>
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
            {{ payment.status.tone === 'success' ? 'Reçu disponible sous peu.' : 'Reçu indisponible pour ce paiement.' }}
          </span>
        </div>
      </article>

      <div class="flex flex-col gap-2">
        <button
          v-if="list.nextCursor.value"
          type="button"
          class="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="list.loadMorePending.value"
          @click="list.loadMore"
        >
          <Icon
            name="lucide:chevron-down"
            size="16"
            aria-hidden="true"
          />
          {{ list.loadMorePending.value ? 'Chargement…' : 'Charger plus' }}
        </button>

        <p v-if="list.loadMoreErrorMessage.value" class="text-sm text-[color:var(--color-brand-primary)]">
          {{ list.loadMoreErrorMessage.value }}
        </p>
      </div>
    </div>
  </section>
</template>
