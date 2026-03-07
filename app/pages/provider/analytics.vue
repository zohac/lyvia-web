<script setup lang="ts">
import KpiCard from '~/components/molecules/KpiCard.vue'
import FunnelChart from '~/components/molecules/FunnelChart.vue'
import SourcesList from '~/components/molecules/SourcesList.vue'
import DevicesList from '~/components/molecules/DevicesList.vue'
import { useProviderAnalytics } from '~/features/analytics/useProviderAnalytics'
import { ANALYTICS_PERIOD_OPTIONS } from '~/features/analytics/api/analytics.contract'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Analytics'
})

const analytics = useProviderAnalytics()
await analytics.fetchAnalytics()

const periodOptions = ANALYTICS_PERIOD_OPTIONS

const isEmpty = computed(() => {
  if (!analytics.data.value) return true
  const k = analytics.data.value.kpis
  return k.visitors.value === 0
    && k.pageViews.value === 0
    && k.discoveryBooked.value === 0
    && k.revenue.value === 0
})
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)] sm:text-3xl">
          Analytics
        </h1>
        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
          Performance de vos pages publiques
        </p>
      </div>
      <USelect
        v-model="analytics.period.value"
        :items="periodOptions"
        value-key="value"
        class="w-36"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="analytics.loading.value"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 animate-pulse rounded-3xl border border-[color:var(--color-border-subtle)] bg-white/75 p-6"
      >
        <div class="h-4 w-24 rounded bg-[color:var(--color-brand-subtle)]" />
        <div class="mt-4 h-8 w-16 rounded bg-[color:var(--color-brand-subtle)]" />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="analytics.error.value"
      class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-12 text-center shadow-card"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        {{ analytics.error.value }}
      </p>
      <UButton
        variant="outline"
        color="neutral"
        class="mt-6 rounded-full"
        @click="analytics.fetchAnalytics()"
      >
        <UIcon
          name="lucide:refresh-cw"
          size="16"
        />
        Réessayer
      </UButton>
    </div>

    <!-- Empty State -->
    <template v-else-if="isEmpty">
      <div class="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
        <UIcon
          name="lucide:bar-chart-3"
          size="48"
          class="mx-auto text-stone-300"
        />
        <p class="mt-4 text-lg text-[color:var(--color-brand-secondary)]">
          Pas encore de données
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
          Partagez votre page pour commencer à collecter des statistiques
        </p>
      </div>
    </template>

    <!-- Data State -->
    <template v-else-if="analytics.data.value">
      <!-- KPI Cards -->
      <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Visiteurs"
          :value="analytics.data.value.kpis.visitors.value"
          :delta="analytics.data.value.kpis.visitors.delta"
          icon="lucide:eye"
        />
        <KpiCard
          label="Pages vues"
          :value="analytics.data.value.kpis.pageViews.value"
          :delta="analytics.data.value.kpis.pageViews.delta"
          icon="lucide:file-text"
        />
        <KpiCard
          label="Discovery"
          :value="analytics.data.value.kpis.discoveryBooked.value"
          :delta="analytics.data.value.kpis.discoveryBooked.delta"
          icon="lucide:phone-call"
        />
        <KpiCard
          label="Revenus"
          :value="analytics.data.value.kpis.revenue.value"
          :delta="analytics.data.value.kpis.revenue.delta"
          icon="lucide:wallet"
          format="currency"
        />
      </section>

      <!-- Funnel -->
      <section class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-card">
        <h2 class="mb-4 font-serif text-lg italic text-[color:var(--color-brand-primary)]">
          Funnel de conversion
        </h2>
        <FunnelChart :steps="analytics.data.value.funnel" />
      </section>

      <!-- Sources + Devices -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-card">
          <h2 class="mb-4 font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Sources de trafic
          </h2>
          <SourcesList :sources="analytics.data.value.sources" />
        </section>

        <section class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-card">
          <h2 class="mb-4 font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Appareils
          </h2>
          <DevicesList :devices="analytics.data.value.devices" />
        </section>
      </div>
    </template>
  </div>
</template>
