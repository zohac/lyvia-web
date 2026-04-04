<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <USelect
        v-model="selectedPeriod"
        :items="periodOptions"
        value-key="value"
        class="w-36"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="space-y-8"
    >
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-32 rounded-3xl"
        />
      </div>
    </div>

    <!-- Error State -->
    <AtomsDsErrorState
      v-else-if="status === 'error'"
      message="Erreur lors du chargement des analytics"
      @retry="refresh()"
    />

    <!-- Empty State -->
    <AtomsDsEmptyState
      v-else-if="data && isEmpty"
      icon="i-lucide-bar-chart-3"
      title="Aucune donnée disponible"
      description="Aucune donnée disponible pour cette période."
    />

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
      <section class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
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
      <section class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
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
      class: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)] text-xs font-bold text-[color:var(--color-brand-primary)]'
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
