<template>
  <div>
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Analytics plateforme
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Vue d'ensemble de la performance de tous les providers
        </p>
      </div>

      <USelect
        v-model="selectedPeriod"
        :items="periodOptions"
        value-key="value"
        class="w-36"
      />
    </section>

    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="space-y-8"
    >
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
    </div>

    <!-- Error State -->
    <div
      v-else-if="status === 'error'"
      class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-12 text-center shadow-card"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        Erreur lors du chargement des analytics
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

    <!-- Empty State -->
    <div
      v-else-if="data && isEmpty"
      class="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center"
    >
      <UIcon
        name="lucide:bar-chart-3"
        size="48"
        class="mx-auto text-stone-300"
      />
      <p class="mt-4 text-lg text-[color:var(--color-brand-secondary)]">
        Aucune donnée disponible pour cette période
      </p>
    </div>

    <!-- Data State -->
    <div
      v-else-if="data"
      class="space-y-8"
    >
      <!-- KPI Cards -->
      <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Visiteurs totaux"
          :value="data.kpis.visitors.value"
          :delta="data.kpis.visitors.delta"
          icon="lucide:eye"
        />
        <KpiCard
          label="Pages vues"
          :value="data.kpis.pageViews.value"
          :delta="data.kpis.pageViews.delta"
          icon="lucide:file-text"
        />
        <KpiCard
          label="Discovery"
          :value="data.kpis.discoveryBooked.value"
          :delta="data.kpis.discoveryBooked.delta"
          icon="lucide:phone-call"
        />
        <KpiCard
          label="Revenus plateforme"
          :value="data.kpis.revenue.value"
          :delta="data.kpis.revenue.delta"
          icon="lucide:wallet"
          format="currency"
        />
      </section>

      <!-- Top Providers -->
      <section class="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
        <div class="relative z-10 p-8">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Top providers
          </h2>
          <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
            Les 10 providers les plus performants sur la période
          </p>
        </div>

        <div
          v-if="!data.topProviders.length"
          class="relative z-10 px-8 pb-8 text-center"
        >
          <p class="text-[color:var(--color-brand-secondary)]">
            Aucun provider avec du trafic sur cette période
          </p>
        </div>

        <div
          v-else
          class="relative z-10"
        >
          <UTable
            :data="data.topProviders"
            :columns="topProviderColumns"
            :class="tableClasses"
          />
        </div>
      </section>

      <!-- Tenant Stats -->
      <section class="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
        <div class="relative z-10 flex items-center justify-between p-8 pb-4">
          <div>
            <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
              Détail par provider
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Statistiques détaillées par provider
            </p>
          </div>
          <UInput
            v-model="searchQuery"
            placeholder="Rechercher..."
            icon="lucide:search"
            class="w-64"
          />
        </div>

        <div
          v-if="!filteredTenantStats.length"
          class="relative z-10 px-8 pb-8 text-center"
        >
          <p class="text-[color:var(--color-brand-secondary)]">
            {{ searchQuery.trim() ? 'Aucun résultat pour cette recherche' : 'Aucune donnée disponible' }}
          </p>
        </div>

        <div
          v-else
          class="relative z-10"
        >
          <UTable
            :data="filteredTenantStats"
            :columns="tenantStatsColumns"
            :class="tableClasses"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import KpiCard from '~/components/molecules/KpiCard.vue'
import { formatKpiValue } from '~/features/analytics/helpers/format-kpi'
import { ANALYTICS_PERIOD_OPTIONS } from '~/features/analytics/api/analytics.contract'
import type { AnalyticsPeriod, KpiWithDelta } from '~/features/analytics/api/analytics.contract'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { apiFetch } from '~/services/api/apiFetch'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Analytics'
})

// ── Types inline (pattern admin — verified against AdminAnalyticsResponseDto) ──

type TopProviderEntry = {
  rank: number
  providerId: string
  name: string
  slug: string
  visitors: number
  conversionRate: number
  revenue: number
}

type TenantStatEntry = {
  providerId: string
  name: string
  slug: string
  visitors: number
  pageViews: number
  discoveryBooked: number
  revenue: number
}

type AdminAnalyticsResponse = {
  period: AnalyticsPeriod
  kpis: {
    visitors: KpiWithDelta
    pageViews: KpiWithDelta
    discoveryBooked: KpiWithDelta
    revenue: KpiWithDelta
  }
  topProviders: TopProviderEntry[]
  tenantStats: TenantStatEntry[]
}

// ── State ──

const selectedPeriod = ref<AnalyticsPeriod>('month')
const searchQuery = ref('')

const periodOptions = ANALYTICS_PERIOD_OPTIONS

// ── Data fetching ──

const { data, status, refresh } = await useAsyncData<AdminAnalyticsResponse>(
  'admin-analytics',
  () => apiFetch<AdminAnalyticsResponse>('/admin/analytics', {
    query: { period: selectedPeriod.value }
  })
)

watch(selectedPeriod, () => refresh())

// ── Computed ──

const isEmpty = computed(() => {
  if (!data.value) return true
  const k = data.value.kpis
  return k.visitors.value === 0
    && k.pageViews.value === 0
    && k.discoveryBooked.value === 0
    && k.revenue.value === 0
    && data.value.topProviders.length === 0
})

const filteredTenantStats = computed(() => {
  if (!data.value?.tenantStats) return []
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return data.value.tenantStats
  return data.value.tenantStats.filter(
    t => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
  )
})

// ── Table styling (admin pattern — shared) ──

const tableClasses = ADMIN_TABLE_CLASSES

// ── Top providers table columns ──

const topProviderColumns: TableColumn<TopProviderEntry>[] = [
  {
    accessorKey: 'rank',
    header: '#',
    cell: ({ row }) => h('span', {
      class: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)] text-xs font-bold text-[color:var(--color-brand-solid)]'
    }, String(row.original.rank))
  },
  {
    accessorKey: 'name',
    header: 'Provider',
    cell: ({ row }) => h('div', {}, [
      h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, row.original.name),
      h('span', { class: 'ml-2 text-xs text-[color:var(--color-brand-muted)]' }, row.original.slug)
    ])
  },
  {
    accessorKey: 'visitors',
    header: 'Visiteurs',
    cell: ({ row }) => h('span', { class: 'font-medium' }, formatKpiValue(row.original.visitors))
  },
  {
    accessorKey: 'conversionRate',
    header: 'Conversion',
    cell: ({ row }) => h('span', { class: 'text-sm' }, `${row.original.conversionRate.toFixed(1)}%`)
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    cell: ({ row }) => h('span', { class: 'font-medium' }, formatKpiValue(row.original.revenue, 'currency'))
  }
]

// ── Tenant stats table columns ──

const tenantStatsColumns: TableColumn<TenantStatEntry>[] = [
  {
    accessorKey: 'name',
    header: 'Provider',
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, row.original.name),
      h('p', { class: 'text-xs text-[color:var(--color-brand-muted)]' }, `/coach/${row.original.slug}`)
    ])
  },
  {
    accessorKey: 'visitors',
    header: 'Visiteurs',
    cell: ({ row }) => h('span', {}, formatKpiValue(row.original.visitors))
  },
  {
    accessorKey: 'pageViews',
    header: 'Pages vues',
    cell: ({ row }) => h('span', {}, formatKpiValue(row.original.pageViews))
  },
  {
    accessorKey: 'discoveryBooked',
    header: 'Discovery',
    cell: ({ row }) => h('span', {}, formatKpiValue(row.original.discoveryBooked))
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    cell: ({ row }) => h('span', { class: 'font-medium' }, formatKpiValue(row.original.revenue, 'currency'))
  }
]
</script>
