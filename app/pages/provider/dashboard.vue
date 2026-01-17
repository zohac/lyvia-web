<template>
  <div>
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Vue d'ensemble
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Un aperçu clair pour piloter votre planning et vos appels discovery.
        </p>
      </div>

      <ULink
        to="/provider/calendar"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-floating transition-base hover:brightness-110"
      >
        <UIcon
          name="lucide:calendar"
          class="h-4 w-4"
        />
        Ouvrir l'agenda
      </ULink>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div class="space-y-8 lg:col-span-8">
        <!-- Agenda du jour -->
        <section class="relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/55 p-8 shadow-soft">
          <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-kaora-100)] opacity-50 blur-[100px]" />

          <div class="relative z-10">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Agenda du jour
              </h2>
              <span class="text-sm font-medium text-[color:var(--color-brand-muted)]">
                {{ formattedToday }}
              </span>
            </div>

            <!-- Loading state -->
            <div
              v-if="calendarPending"
              class="space-y-3"
            >
              <div
                v-for="i in 3"
                :key="i"
                class="flex items-center gap-4 rounded-xl bg-white/60 p-4"
              >
                <div class="h-10 w-10 animate-pulse rounded-lg bg-[color:var(--color-surface-highlight)]" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-1/3 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
                  <div class="h-3 w-1/2 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
                </div>
              </div>
            </div>

            <!-- Error state -->
            <div
              v-else-if="calendarError"
              class="rounded-xl bg-red-50 p-4"
            >
              <p class="text-sm text-red-600">
                {{ calendarError }}
              </p>
              <button
                class="mt-2 text-sm font-medium text-[color:var(--color-brand-accent)] hover:underline"
                @click="refreshCalendar"
              >
                Réessayer
              </button>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!todayAppointments.length"
              class="rounded-xl bg-white/60 p-6 text-center"
            >
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:calendar-check"
                  class="h-6 w-6 text-[color:var(--color-brand-muted)]"
                />
              </div>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Aucun rendez-vous prévu aujourd'hui.
              </p>
              <ULink
                to="/provider/calendar"
                class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--color-brand-accent)] hover:underline"
              >
                Voir la semaine
                <UIcon
                  name="lucide:arrow-right"
                  class="h-4 w-4"
                />
              </ULink>
            </div>

            <!-- Appointments list -->
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="appointment in todayAppointments.slice(0, 4)"
                :key="appointment.id"
                class="flex items-center gap-4 rounded-xl bg-white/80 p-4 shadow-sm transition-base hover:shadow-soft"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  :class="appointment.type === 'discovery' ? 'bg-purple-100' : 'bg-[color:var(--color-surface-highlight)]'"
                >
                  <UIcon
                    :name="appointment.type === 'discovery' ? 'lucide:phone' : 'lucide:video'"
                    class="h-5 w-5"
                    :class="appointment.type === 'discovery' ? 'text-purple-600' : 'text-[color:var(--color-brand-accent)]'"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-[color:var(--color-brand-primary)]">
                    {{ appointment.firstname }} {{ appointment.lastname }}
                  </p>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    {{ formatAppointmentTime(appointment.startAt) }} · {{ appointment.durationMinutes }} min
                    <span
                      class="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="appointment.type === 'discovery' ? 'bg-purple-100 text-purple-700' : 'bg-[color:var(--color-kaora-100)] text-[color:var(--color-brand-accent)]'"
                    >
                      {{ appointment.type === 'discovery' ? 'Discovery' : 'Consultation' }}
                    </span>
                  </p>
                </div>
                <div
                  v-if="appointment.status === 'cancelled'"
                  class="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                >
                  Annulé
                </div>
              </div>

              <p
                v-if="todayAppointments.length > 4"
                class="text-center text-xs text-[color:var(--color-brand-muted)]"
              >
                + {{ todayAppointments.length - 4 }} autre{{ todayAppointments.length - 4 > 1 ? 's' : '' }}
              </p>
            </div>
          </div>
        </section>

        <!-- Quick access cards -->
        <section class="grid gap-6 md:grid-cols-2">
          <!-- Discovery card -->
          <div class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <UIcon
                name="lucide:phone-call"
                class="h-5 w-5 text-purple-600"
              />
            </div>
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Appels discovery
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Gérez vos appels discovery depuis une vue dédiée.
            </p>
            <ULink
              to="/provider/discovery"
              class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] hover:underline"
            >
              Ouvrir la liste
              <UIcon
                name="lucide:arrow-right"
                class="h-4 w-4"
              />
            </ULink>
          </div>

          <!-- Clients card -->
          <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-highlight)]">
              <UIcon
                name="lucide:users"
                class="h-5 w-5 text-[color:var(--color-brand-muted)]"
              />
            </div>
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Mes clientes
            </h3>

            <!-- Loading -->
            <div
              v-if="clientsPending"
              class="mt-3 space-y-2"
            >
              <div class="h-4 w-2/3 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
            </div>

            <!-- Content -->
            <p
              v-else
              class="mt-3 text-sm text-[color:var(--color-brand-secondary)]"
            >
              {{ clientsSummaryLabel }}
            </p>

            <ULink
              to="/provider/clients"
              class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] hover:underline"
            >
              Voir toutes
              <UIcon
                name="lucide:arrow-right"
                class="h-4 w-4"
              />
            </ULink>
          </div>
        </section>
      </div>

      <aside class="space-y-8 lg:col-span-4">
        <!-- Stats card -->
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Aperçu
          </p>

          <div class="mt-5 space-y-4">
            <!-- Today appointments -->
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:calendar-check"
                  class="h-4 w-4 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Aujourd'hui
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ todayStatsLabel }}
                </p>
              </div>
            </div>

            <!-- Week appointments -->
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:calendar-days"
                  class="h-4 w-4 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Cette semaine
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ weekStatsLabel }}
                </p>
              </div>
            </div>

            <!-- Clients count -->
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="lucide:users"
                  class="h-4 w-4 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-[color:var(--color-brand-muted)]">
                  Clientes
                </p>
                <p class="mt-0.5 text-sm font-medium text-[color:var(--color-brand-primary)]">
                  {{ clientsStatsLabel }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Finance card -->
        <div class="rounded-blob-a border border-white/60 bg-gradient-to-br from-[color:var(--color-kaora-50)] to-white p-8 shadow-soft">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
            <UIcon
              name="lucide:wallet"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <h3 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Finance
          </h3>

          <!-- Loading -->
          <div
            v-if="financePending"
            class="mt-3 space-y-2"
          >
            <div class="h-4 w-3/4 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
            <div class="h-4 w-1/2 animate-pulse rounded bg-[color:var(--color-surface-highlight)]" />
          </div>

          <!-- Content -->
          <template v-else>
            <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
              {{ financeStatusLabel }}
            </p>

            <!-- Stripe status indicator -->
            <div
              v-if="financeUiState"
              class="mt-3 flex items-center gap-2"
            >
              <div
                class="h-2 w-2 rounded-full"
                :class="{
                  'bg-green-500': financeUiState.kind === 'ready',
                  'bg-yellow-500': financeUiState.kind === 'incomplete',
                  'bg-red-500': financeUiState.kind === 'shadow',
                  'bg-gray-400': financeUiState.kind === 'start'
                }"
              />
              <span class="text-xs text-[color:var(--color-brand-muted)]">
                {{ stripeStatusLabel }}
              </span>
            </div>
          </template>

          <ULink
            to="/provider/finance"
            class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] hover:underline"
          >
            Gérer
            <UIcon
              name="lucide:arrow-right"
              class="h-4 w-4"
            />
          </ULink>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { listProviderAppointments } from '../../features/calendar/services/provider-calendar.service'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import { useProviderFinance } from '../../features/finance/useProviderFinance'
import { formatPrice } from '../../features/consultation/domain/formatting'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Vue d\'ensemble'
})

/**
 * Today's date formatting
 */
const formattedToday = computed(() => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())
})

/**
 * Calendar state for today's appointments
 */
const calendarPending = ref(true)
const calendarError = ref<string | null>(null)
const todayAppointments = ref<ProviderAppointmentListItem[]>([])
const weekAppointments = ref<ProviderAppointmentListItem[]>([])

async function refreshCalendar() {
  calendarPending.value = true
  calendarError.value = null

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Get start and end of week
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    const [todayResponse, weekResponse] = await Promise.all([
      listProviderAppointments({
        from: startOfDay.toISOString(),
        to: endOfDay.toISOString()
      }),
      listProviderAppointments({
        from: startOfWeek.toISOString(),
        to: endOfWeek.toISOString()
      })
    ])

    todayAppointments.value = todayResponse.appointments
      .filter(a => a.status !== 'cancelled')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    weekAppointments.value = weekResponse.appointments
      .filter(a => a.status !== 'cancelled')
  } catch {
    calendarError.value = 'Impossible de charger les rendez-vous.'
  } finally {
    calendarPending.value = false
  }
}

refreshCalendar()

function formatAppointmentTime(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(new Date(dateStr))
}

/**
 * Clients state
 */
const clientsPending = ref(true)
const clientsCount = ref(0)
const activeClientsCount = ref(0)

async function refreshClients() {
  clientsPending.value = true
  try {
    const response = await listProviderClients({ limit: 100 })
    clientsCount.value = response.items.length
    activeClientsCount.value = response.items.filter(c => c.computedStatus === 'in_progress').length
  } catch {
    // Silent fail - stats will show default
  } finally {
    clientsPending.value = false
  }
}

refreshClients()

const clientsSummaryLabel = computed(() => {
  if (clientsCount.value === 0) return 'Aucune cliente pour le moment.'
  const active = activeClientsCount.value
  return `${clientsCount.value} cliente${clientsCount.value > 1 ? 's' : ''} · ${active} en suivi actif`
})

/**
 * Finance state
 */
const {
  pending: financePending,
  uiState: financeUiState
} = await useProviderFinance()

const financeStatusLabel = computed(() => {
  if (!financeUiState.value) return 'Chargement...'

  const state = financeUiState.value
  if (state.kind === 'start') {
    return 'Connectez Stripe pour recevoir vos paiements.'
  }
  if (state.kind === 'incomplete') {
    return 'Onboarding Stripe en cours.'
  }
  if (state.kind === 'shadow') {
    return 'Compte Stripe à compléter.'
  }

  // Ready state - show pending payout if any
  if (state.pendingPayoutCents > 0) {
    return `${formatPrice(state.pendingPayoutCents)} en attente de virement`
  }
  return 'Compte Stripe actif'
})

const stripeStatusLabel = computed(() => {
  if (!financeUiState.value) return ''

  const state = financeUiState.value
  if (state.kind === 'start') return 'Non connecté'
  if (state.kind === 'incomplete') return 'En cours'
  if (state.kind === 'shadow') return 'À compléter'
  return 'Actif'
})

/**
 * Stats labels
 */
const todayStatsLabel = computed(() => {
  if (calendarPending.value) return 'Chargement...'
  const count = todayAppointments.value.length
  if (count === 0) return 'Aucun rendez-vous'
  return `${count} rendez-vous`
})

const weekStatsLabel = computed(() => {
  if (calendarPending.value) return 'Chargement...'
  const count = weekAppointments.value.length
  if (count === 0) return 'Aucun rendez-vous'
  return `${count} rendez-vous`
})

const clientsStatsLabel = computed(() => {
  if (clientsPending.value) return 'Chargement...'
  if (clientsCount.value === 0) return 'Aucune cliente'
  return `${clientsCount.value} au total`
})
</script>
