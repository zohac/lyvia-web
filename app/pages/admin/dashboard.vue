<template>
  <div>
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Administration
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Supervisez la plateforme Kaora et les opérations.
        </p>
      </div>
    </section>

    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="space-y-8"
    >
      <!-- KPI Skeletons -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-32 animate-pulse rounded-3xl border border-[color:var(--color-border-subtle)] bg-white/75 p-6"
        >
          <div class="h-4 w-24 rounded bg-[color:var(--color-brand-subtle)]" />
          <div class="mt-4 h-8 w-16 rounded bg-[color:var(--color-brand-subtle)]" />
        </div>
      </div>

      <!-- Events Skeleton -->
      <div class="h-80 animate-pulse rounded-3xl border border-[color:var(--color-border-subtle)] bg-white/75 p-8">
        <div class="h-6 w-48 rounded bg-[color:var(--color-brand-subtle)]" />
        <div class="mt-6 space-y-4">
          <div
            v-for="j in 5"
            :key="j"
            class="h-10 rounded bg-[color:var(--color-brand-subtle)]"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="status === 'error'"
      class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-12 text-center shadow-card"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        Erreur lors du chargement du dashboard
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        {{ error?.message || 'Une erreur inattendue est survenue.' }}
      </p>
      <UButton
        variant="outline"
        color="neutral"
        class="mt-6 rounded-full"
        @click="() => refresh()"
      >
        <UIcon
          name="lucide:refresh-cw"
          size="16"
        />
        Réessayer
      </UButton>
    </div>

    <!-- Data State -->
    <div
      v-else-if="data"
      class="space-y-8"
    >
      <!-- KPI Cards -->
      <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="kpi in kpiCards"
          :key="kpi.key"
          class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-card transition-shadow hover:shadow-elevated"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)]">
              <UIcon
                :name="kpi.icon"
                size="20"
                class="text-[color:var(--color-brand-solid)]"
              />
            </div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              {{ kpi.label }}
            </span>
          </div>
          <p class="mt-4 font-serif text-3xl text-[color:var(--color-brand-primary)]">
            {{ kpi.value }}
          </p>
        </div>
      </section>

      <!-- Last Events -->
      <section class="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
        <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--ui-color-primary-100)] opacity-30 blur-[100px]" />

        <div class="relative z-10 p-8">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Derniers événements
          </h2>
          <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
            Les 10 derniers événements métier de la plateforme
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-if="!data.lastEvents.length"
          class="relative z-10 px-8 pb-8 text-center"
        >
          <UIcon
            name="lucide:inbox"
            size="48"
            class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
          />
          <p class="text-[color:var(--color-brand-secondary)]">
            Aucun événement enregistré
          </p>
        </div>

        <!-- Events Table -->
        <div
          v-else
          class="relative z-10"
        >
          <UTable
            :data="data.lastEvents"
            :columns="eventColumns"
            :class="ADMIN_TABLE_CLASSES"
          />
        </div>
      </section>

      <!-- Quick Links -->
      <section class="grid gap-6 md:grid-cols-2">
        <NuxtLink
          to="/admin/logs"
          class="rounded-3xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur transition-all hover:border-[color:var(--color-brand-solid)] hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)]">
              <UIcon
                name="lucide:scroll-text"
                size="24"
                class="text-[color:var(--color-brand-solid)]"
              />
            </div>
            <div>
              <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Business Logs
              </h3>
              <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                Consulter tous les événements métier avec filtres avancés
              </p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/providers"
          class="rounded-3xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur transition-all hover:border-[color:var(--color-brand-solid)] hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)]">
              <UIcon
                name="lucide:users"
                size="24"
                class="text-[color:var(--color-brand-solid)]"
              />
            </div>
            <div>
              <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Providers
              </h3>
              <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                Gérer les comptes Stripe Connect des coachs
              </p>
            </div>
          </div>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { getEventBadgeColor, getBadgeClasses } from '~/composables/useAdminBadges'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Dashboard'
})

// Types
type AdminKpis = {
  clientsTotal: number
  consultationsTotal: number
  consultationsUpcoming: number
  paymentsSucceededLast30d: number
}

type AdminLastEvent = {
  id: string
  eventType: string
  userId: string | null
  createdAt: string
  metadataPreview: string
}

type AdminDashboardOverviewResponse = {
  kpis: AdminKpis
  lastEvents: AdminLastEvent[]
}

// Fetch dashboard data
const { data, status, error, refresh } = await useAsyncData<AdminDashboardOverviewResponse>(
  'admin-dashboard',
  () => apiFetch<AdminDashboardOverviewResponse>('/admin/dashboard/overview')
)

// KPI cards configuration
const kpiCards = computed(() => {
  if (!data.value) return []

  return [
    {
      key: 'clients',
      label: 'Clients inscrits',
      value: data.value.kpis.clientsTotal,
      icon: 'lucide:users'
    },
    {
      key: 'consultations',
      label: 'Consultations totales',
      value: data.value.kpis.consultationsTotal,
      icon: 'lucide:calendar'
    },
    {
      key: 'upcoming',
      label: 'Consultations à venir',
      value: data.value.kpis.consultationsUpcoming,
      icon: 'lucide:calendar-clock'
    },
    {
      key: 'payments',
      label: 'Paiements (30j)',
      value: data.value.kpis.paymentsSucceededLast30d,
      icon: 'lucide:credit-card'
    }
  ]
})

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Event table columns
const eventColumns: TableColumn<AdminLastEvent>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' }, formatDate(row.original.createdAt))
    }
  },
  {
    accessorKey: 'eventType',
    header: 'Type',
    cell: ({ row }) => {
      const color = getEventBadgeColor(row.original.eventType)
      return h('span', {
        class: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getBadgeClasses(color)}`
      }, row.original.eventType)
    }
  },
  {
    accessorKey: 'metadataPreview',
    header: 'Aperçu',
    cell: ({ row }) => {
      return h('span', {
        class: 'max-w-xs truncate text-sm text-[color:var(--color-brand-muted)]',
        title: row.original.metadataPreview
      }, row.original.metadataPreview || '—')
    }
  }
]
</script>
