<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Mes paiements
        </h1>
        <p class="mt-1 text-stone-500">
          Retrouvez l'historique de vos transactions et accédez aux reçus.
        </p>
      </div>

      <UButton
        to="/client/dashboard"
        variant="ghost"
        color="neutral"
        leading-icon="i-lucide-arrow-left"
      >
        Retour
      </UButton>
    </header>

    <!-- Error State -->
    <UAlert
      v-if="list.errorMessage.value"
      color="error"
      variant="soft"
      title="Impossible de charger vos paiements"
      :description="list.errorMessage.value"
      icon="i-lucide-alert-circle"
    >
      <template #actions>
        <UButton
          variant="link"
          color="error"
          size="sm"
          leading-icon="i-lucide-refresh-cw"
          @click="list.refresh"
        >
          Réessayer
        </UButton>
      </template>
    </UAlert>

    <!-- Loading State -->
    <template v-else-if="list.pending.value">
      <!-- Summary skeleton -->
      <div class="grid gap-4 sm:grid-cols-3">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-24 rounded-xl"
        />
      </div>
      <!-- Table skeleton -->
      <UCard class="bg-white">
        <div class="space-y-4">
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-16 w-full rounded-lg"
          />
        </div>
      </UCard>
    </template>

    <!-- Content -->
    <template v-else>
      <!-- Summary Cards -->
      <div class="grid gap-4 sm:grid-cols-3">
        <!-- Total transactions -->
        <UCard class="bg-white">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-crepuscule-100">
              <UIcon
                name="lucide:receipt"
                class="h-6 w-6 text-crepuscule-600"
              />
            </div>
            <div>
              <p class="text-sm text-stone-500">
                Transactions
              </p>
              <p class="text-2xl font-semibold text-stone-900">
                {{ list.payments.value.length }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Total paid -->
        <UCard class="bg-white">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <UIcon
                name="lucide:check-circle"
                class="h-6 w-6 text-green-600"
              />
            </div>
            <div>
              <p class="text-sm text-stone-500">
                Total réglé
              </p>
              <p class="text-2xl font-semibold text-stone-900">
                {{ totalPaidFormatted }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Last payment -->
        <UCard class="bg-white">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sunset-100">
              <UIcon
                name="lucide:calendar"
                class="h-6 w-6 text-sunset-600"
              />
            </div>
            <div>
              <p class="text-sm text-stone-500">
                Dernier paiement
              </p>
              <p class="text-lg font-semibold text-stone-900">
                {{ lastPaymentDate }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <UCard
        v-if="list.payments.value.length === 0"
        class="bg-white"
      >
        <div class="py-12 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
            <UIcon
              name="lucide:credit-card"
              class="h-8 w-8 text-stone-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-stone-900">
            Aucun paiement
          </h3>
          <p class="mx-auto mt-2 max-w-sm text-sm text-stone-500">
            Vos paiements apparaîtront ici une fois que vous aurez réglé votre première consultation.
          </p>
          <UButton
            to="/client/dashboard"
            variant="soft"
            color="primary"
            class="mt-6"
          >
            Retour au tableau de bord
          </UButton>
        </div>
      </UCard>

      <!-- Payments Table (Desktop) -->
      <UCard
        v-else
        class="hidden bg-white md:block"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-stone-900">
              Historique des paiements
            </h2>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ list.payments.value.length }} paiement{{ list.payments.value.length > 1 ? 's' : '' }}
            </UBadge>
          </div>
        </template>

        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6">
          <table class="min-w-full divide-y divide-stone-200">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Montant
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Statut
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Reçu
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr
                v-for="payment in formattedPayments"
                :key="payment.id"
                class="transition-colors hover:bg-stone-50"
              >
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      :class="getStatusIconBg(payment.status.tone)"
                    >
                      <UIcon
                        :name="getStatusIcon(payment.status.tone)"
                        class="h-5 w-5"
                        :class="getStatusIconColor(payment.status.tone)"
                      />
                    </div>
                    <div>
                      <p class="font-medium text-stone-900">
                        {{ payment.dateLong }}
                      </p>
                      <p class="text-xs text-stone-500">
                        {{ payment.time }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span class="text-lg font-semibold text-stone-900">
                    {{ payment.amount }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <UBadge
                    :color="getStatusBadgeColor(payment.status.tone)"
                    variant="subtle"
                    size="sm"
                  >
                    <span
                      class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                      :class="getStatusDotColor(payment.status.tone)"
                    />
                    {{ payment.status.label }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right">
                  <UButton
                    v-if="payment.receiptUrl"
                    variant="soft"
                    color="neutral"
                    size="xs"
                    trailing-icon="i-lucide-external-link"
                    @click="openReceipt(payment.receiptUrl)"
                  >
                    Voir le reçu
                  </UButton>
                  <span
                    v-else
                    class="text-xs text-stone-400"
                  >
                    {{ payment.status.tone === 'success' ? 'Bientôt disponible' : '—' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load more -->
        <template
          v-if="list.nextCursor.value"
          #footer
        >
          <div class="flex justify-center">
            <UButton
              variant="ghost"
              color="neutral"
              :loading="list.loadMorePending.value"
              leading-icon="i-lucide-chevron-down"
              @click="list.loadMore"
            >
              {{ list.loadMorePending.value ? 'Chargement…' : 'Charger plus' }}
            </UButton>
          </div>
          <p
            v-if="list.loadMoreErrorMessage.value"
            class="mt-2 text-center text-sm text-red-600"
          >
            {{ list.loadMoreErrorMessage.value }}
          </p>
        </template>
      </UCard>

      <!-- Payments Cards (Mobile) -->
      <div class="space-y-4 md:hidden">
        <h2 class="font-semibold text-stone-900">
          Historique des paiements
        </h2>

        <UCard
          v-for="payment in formattedPayments"
          :key="payment.id"
          class="bg-white"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                :class="getStatusIconBg(payment.status.tone)"
              >
                <UIcon
                  :name="getStatusIcon(payment.status.tone)"
                  class="h-5 w-5"
                  :class="getStatusIconColor(payment.status.tone)"
                />
              </div>
              <div>
                <p class="text-lg font-semibold text-stone-900">
                  {{ payment.amount }}
                </p>
                <p class="text-sm text-stone-500">
                  {{ payment.dateLong }}
                </p>
              </div>
            </div>

            <UBadge
              :color="getStatusBadgeColor(payment.status.tone)"
              variant="subtle"
              size="sm"
            >
              {{ payment.status.label }}
            </UBadge>
          </div>

          <div
            v-if="payment.receiptUrl || payment.status.tone === 'success'"
            class="mt-4 flex items-center justify-between border-t border-stone-100 pt-4"
          >
            <span class="text-sm text-stone-500">Reçu</span>
            <UButton
              v-if="payment.receiptUrl"
              variant="soft"
              color="neutral"
              size="xs"
              trailing-icon="i-lucide-external-link"
              @click="openReceipt(payment.receiptUrl)"
            >
              Télécharger
            </UButton>
            <span
              v-else
              class="text-xs text-stone-400"
            >
              Bientôt disponible
            </span>
          </div>
        </UCard>

        <!-- Load more (mobile) -->
        <div
          v-if="list.nextCursor.value"
          class="flex flex-col items-center gap-2"
        >
          <UButton
            variant="outline"
            color="neutral"
            :loading="list.loadMorePending.value"
            leading-icon="i-lucide-chevron-down"
            @click="list.loadMore"
          >
            {{ list.loadMorePending.value ? 'Chargement…' : 'Charger plus' }}
          </UButton>
          <p
            v-if="list.loadMoreErrorMessage.value"
            class="text-sm text-red-600"
          >
            {{ list.loadMoreErrorMessage.value }}
          </p>
        </div>
      </div>

      <!-- Info Card -->
      <UCard class="bg-gradient-to-br from-crepuscule-50 to-white">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <UIcon
              name="lucide:info"
              class="h-5 w-5 text-crepuscule-600"
            />
          </div>
          <div>
            <h3 class="font-semibold text-stone-900">
              À propos des reçus
            </h3>
            <p class="mt-1 text-sm text-stone-600">
              Les reçus sont générés par Stripe et peuvent prendre quelques minutes à être disponibles après un paiement réussi. Vous pouvez les télécharger pour vos justificatifs.
            </p>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getPaymentStatusDisplay } from '../../features/payments/domain/payment-display'
import { useClientPayments } from '../../features/payments/useClientPayments'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Paiements'
})

const list = await useClientPayments()

/**
 * Formatted payments with display values
 */
const formattedPayments = computed(() => list.payments.value.map((payment) => {
  const status = getPaymentStatusDisplay(payment.status)
  const amount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: payment.currency
  }).format(payment.amountCents / 100)

  const date = new Date(payment.createdAt)
  const dateLong = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)

  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

  return {
    ...payment,
    status,
    amount,
    dateLong,
    time
  }
}))

/**
 * Total paid (succeeded payments only)
 */
const totalPaidFormatted = computed(() => {
  const succeeded = list.payments.value.filter(p => p.status === 'succeeded')
  if (!succeeded.length) return '0 €'

  const total = succeeded.reduce((sum, p) => sum + p.amountCents, 0)
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: succeeded[0]?.currency ?? 'EUR'
  }).format(total / 100)
})

/**
 * Last payment date
 */
const lastPaymentDate = computed(() => {
  const succeeded = list.payments.value.filter(p => p.status === 'succeeded')
  if (!succeeded.length) return '—'

  const sorted = succeeded.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const lastPayment = sorted[0]
  if (!lastPayment) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(lastPayment.createdAt))
})

/**
 * Status-based styling helpers
 */
type StatusTone = 'success' | 'danger' | 'neutral'

function getStatusBadgeColor(tone: StatusTone): 'success' | 'error' | 'neutral' {
  if (tone === 'success') return 'success'
  if (tone === 'danger') return 'error'
  return 'neutral'
}

function getStatusDotColor(tone: StatusTone): string {
  if (tone === 'success') return 'bg-green-500'
  if (tone === 'danger') return 'bg-red-500'
  return 'bg-stone-400'
}

function getStatusIconBg(tone: StatusTone): string {
  if (tone === 'success') return 'bg-green-100'
  if (tone === 'danger') return 'bg-red-100'
  return 'bg-stone-100'
}

function getStatusIconColor(tone: StatusTone): string {
  if (tone === 'success') return 'text-green-600'
  if (tone === 'danger') return 'text-red-600'
  return 'text-stone-500'
}

function getStatusIcon(tone: StatusTone): string {
  if (tone === 'success') return 'lucide:check'
  if (tone === 'danger') return 'lucide:x'
  return 'lucide:clock'
}

/**
 * Open receipt in new tab
 */
function openReceipt(url: string) {
  if (!import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>
