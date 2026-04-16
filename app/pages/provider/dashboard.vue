<template>
  <div class="space-y-8">
    <!-- Page header -->
    <MoleculesDashboardGreeting
      subtitle="Vue d'ensemble"
      show-date
    />

    <!-- Stats row -->
    <div class="grid gap-4 sm:grid-cols-3">
      <UCard class="bg-[color:var(--color-surface-card)]">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-crepuscule-100">
            <UIcon
              name="lucide:calendar-check"
              class="h-6 w-6 text-crepuscule-600"
            />
          </div>
          <div>
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Aujourd'hui
            </p>
            <p class="text-xl font-semibold text-[color:var(--color-text-primary)]">
              {{ calendarPending ? '...' : todayAppointments.length }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-[color:var(--color-surface-card)]">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-surface-muted)]">
            <UIcon
              name="lucide:calendar-days"
              class="h-6 w-6 text-[color:var(--color-text-secondary)]"
            />
          </div>
          <div>
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Cette semaine
            </p>
            <p class="text-xl font-semibold text-[color:var(--color-text-primary)]">
              {{ calendarPending ? '...' : weekAppointments.length }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-[color:var(--color-surface-card)]">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-sunset-100">
            <UIcon
              name="lucide:users"
              class="h-6 w-6 text-sunset-600"
            />
          </div>
          <div>
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Clientes
            </p>
            <p class="text-xl font-semibold text-[color:var(--color-text-primary)]">
              {{ clientsPending ? '...' : clientsCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Today's agenda -->
      <UCard class="bg-[color:var(--color-surface-card)] lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-[color:var(--color-text-primary)]">
              Agenda du jour
            </h2>
            <UButton
              to="/provider/calendar"
              variant="ghost"
              color="neutral"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            >
              Voir tout
            </UButton>
          </div>
        </template>

        <!-- Loading -->
        <div
          v-if="calendarPending"
          class="space-y-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="flex items-center gap-4"
          >
            <USkeleton class="h-12 w-12 rounded-xl" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-1/3" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </div>
        </div>

        <!-- Error -->
        <AtomsDsErrorState
          v-else-if="calendarError"
          :message="calendarError"
          @retry="refreshCalendar()"
        />

        <!-- Empty -->
        <AtomsDsEmptyState
          v-else-if="!todayAppointments.length"
          icon="i-lucide-calendar-x"
          title="Aucun rendez-vous aujourd'hui"
          description="Votre journée est libre pour le moment."
          cta-label="Voir la semaine"
          cta-to="/provider/calendar"
        />

        <!-- Appointments list -->
        <div
          v-else
          class="divide-y divide-[color:var(--color-border-subtle)]"
        >
          <div
            v-for="appointment in todayAppointments.slice(0, 5)"
            :key="appointment.id"
            class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              :class="appointment.type === 'discovery' ? 'bg-crepuscule-100' : 'bg-[color:var(--color-surface-muted)]'"
            >
              <UIcon
                :name="appointment.type === 'discovery' ? 'i-lucide-phone' : 'i-lucide-video'"
                class="h-5 w-5"
                :class="appointment.type === 'discovery' ? 'text-crepuscule-600' : 'text-[color:var(--color-text-secondary)]'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-[color:var(--color-text-primary)]">
                {{ appointment.firstname }} {{ appointment.lastname }}
              </p>
              <p class="text-sm text-[color:var(--color-text-muted)]">
                {{ formatAppointmentTime(appointment.startAt) }} · {{ appointment.durationMinutes }} min
              </p>
            </div>
            <UBadge
              :color="appointment.type === 'discovery' ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ appointment.type === 'discovery' ? 'Découverte' : 'Consultation' }}
            </UBadge>
          </div>

          <p
            v-if="todayAppointments.length > 5"
            class="pt-3 text-center text-xs text-[color:var(--color-brand-muted)]"
          >
            + {{ todayAppointments.length - 5 }} autre{{ todayAppointments.length - 5 > 1 ? 's' : '' }}
          </p>
        </div>
      </UCard>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick actions -->
        <UCard class="bg-[color:var(--color-surface-card)]">
          <template #header>
            <h2 class="font-semibold text-[color:var(--color-text-primary)]">
              Accès rapide
            </h2>
          </template>

          <div class="space-y-2">
            <UButton
              to="/provider/discovery"
              variant="soft"
              color="primary"
              block
              class="justify-start"
            >
              <UIcon
                name="lucide:phone-call"
                class="mr-2 h-4 w-4"
              />
              Appels découverte
            </UButton>

            <UButton
              to="/provider/clients"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon
                name="lucide:users"
                class="mr-2 h-4 w-4"
              />
              Mes clientes
              <UBadge
                v-if="!clientsPending && activeClientsCount > 0"
                color="primary"
                variant="subtle"
                size="xs"
                class="ml-auto"
              >
                {{ activeClientsCount }} actives
              </UBadge>
            </UButton>

            <UButton
              to="/provider/availability"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon
                name="lucide:calendar-clock"
                class="mr-2 h-4 w-4"
              />
              Disponibilités
            </UButton>
          </div>
        </UCard>

        <!-- Finance card -->
        <UCard class="bg-[color:var(--color-surface-card)]">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-[color:var(--color-text-primary)]">
                Finance
              </h2>
              <div
                v-if="financeUiState"
                class="flex items-center gap-2"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="{
                    'bg-[color:var(--color-success)]': financeUiState.kind === 'ready',
                    'bg-[color:var(--color-warning)]': financeUiState.kind === 'incomplete',
                    'bg-[color:var(--color-error)]': financeUiState.kind === 'shadow',
                    'bg-[color:var(--color-neutral-300)]': financeUiState.kind === 'start'
                  }"
                />
                <span class="text-xs text-[color:var(--color-text-muted)]">
                  {{ stripeStatusLabel }}
                </span>
              </div>
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="financePending"
            class="space-y-2"
          >
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>

          <!-- Content -->
          <template v-else>
            <p class="text-sm text-[color:var(--color-text-secondary)]">
              {{ financeStatusLabel }}
            </p>

            <UButton
              to="/provider/finance"
              variant="link"
              size="sm"
              class="mt-3 px-0"
              trailing-icon="i-lucide-arrow-right"
            >
              Gérer les paiements
            </UButton>
          </template>
        </UCard>
      </div>
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
 * Calendar state
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
    activeClientsCount.value = response.items.filter(c => c.computedStatus === 'active').length
  } catch {
    // Silent fail
  } finally {
    clientsPending.value = false
  }
}

refreshClients()

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
  if (state.kind === 'start') return 'Connectez Stripe pour recevoir vos paiements.'
  if (state.kind === 'incomplete') return 'Onboarding Stripe en cours.'
  if (state.kind === 'shadow') return 'Compte Stripe à compléter.'

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
</script>
