<template>
  <div class="space-y-8">
    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Mes clientes
        </h1>
        <p class="mt-1 text-stone-500">
          Cliquez sur une carte pour filtrer par statut.
        </p>
      </div>
      <UButton
        :loading="pending"
        variant="outline"
        color="neutral"
        @click="refresh"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="mr-2 h-4 w-4"
        />
        Actualiser
      </UButton>
    </header>

    <!-- Error alert -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Chargement impossible"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Stats cards - Interactive filters -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <!-- En découverte -->
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-200"
        :class="[
          statusFilter === 'discovery'
            ? 'border-amber-300 ring-2 ring-amber-200 shadow-md'
            : 'border-stone-200 hover:border-amber-200 hover:shadow-sm'
        ]"
        @click="toggleFilter('discovery')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <UIcon
                  name="lucide:search"
                  class="h-4.5 w-4.5 text-amber-600"
                />
              </div>
              <span class="text-sm font-semibold text-stone-900">En découverte</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-stone-500">
              Appel découverte planifié
            </p>
          </div>
          <span class="text-3xl font-bold tabular-nums text-amber-600">
            {{ pending ? '—' : discoveryCount }}
          </span>
        </div>
        <!-- Progress bar -->
        <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-amber-400 transition-all duration-500"
            :style="{ width: progressWidth(discoveryCount) }"
          />
        </div>
        <!-- Selected indicator -->
        <div
          v-if="statusFilter === 'discovery'"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="lucide:check-circle-2"
            class="h-5 w-5 text-amber-500"
          />
        </div>
      </button>

      <!-- Leads -->
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-200"
        :class="[
          statusFilter === 'lead'
            ? 'border-emerald-300 ring-2 ring-emerald-200 shadow-md'
            : 'border-stone-200 hover:border-emerald-200 hover:shadow-sm'
        ]"
        @click="toggleFilter('lead')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <UIcon
                  name="lucide:user-check"
                  class="h-4.5 w-4.5 text-emerald-600"
                />
              </div>
              <span class="text-sm font-semibold text-stone-900">À convertir</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-stone-500">
              Discovery effectué, en attente de décision
            </p>
          </div>
          <span class="text-3xl font-bold tabular-nums text-emerald-600">
            {{ pending ? '—' : leadCount }}
          </span>
        </div>
        <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-emerald-400 transition-all duration-500"
            :style="{ width: progressWidth(leadCount) }"
          />
        </div>
        <div
          v-if="statusFilter === 'lead'"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="lucide:check-circle-2"
            class="h-5 w-5 text-emerald-500"
          />
        </div>
      </button>

      <!-- Actives -->
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-200"
        :class="[
          statusFilter === 'active'
            ? 'border-crepuscule-300 ring-2 ring-crepuscule-200 shadow-md'
            : 'border-stone-200 hover:border-crepuscule-200 hover:shadow-sm'
        ]"
        @click="toggleFilter('active')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-crepuscule-100">
                <UIcon
                  name="lucide:rocket"
                  class="h-4.5 w-4.5 text-crepuscule-600"
                />
              </div>
              <span class="text-sm font-semibold text-stone-900">Actives</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-stone-500">
              Accompagnement en cours
            </p>
          </div>
          <span class="text-3xl font-bold tabular-nums text-crepuscule-600">
            {{ pending ? '—' : activeCount }}
          </span>
        </div>
        <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-crepuscule-400 transition-all duration-500"
            :style="{ width: progressWidth(activeCount) }"
          />
        </div>
        <div
          v-if="statusFilter === 'active'"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="lucide:check-circle-2"
            class="h-5 w-5 text-crepuscule-500"
          />
        </div>
      </button>

      <!-- Archivées -->
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-200"
        :class="[
          statusFilter === 'paused'
            ? 'border-stone-400 ring-2 ring-stone-300 shadow-md'
            : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
        ]"
        @click="toggleFilter('paused')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
                <UIcon
                  name="lucide:archive"
                  class="h-4.5 w-4.5 text-stone-600"
                />
              </div>
              <span class="text-sm font-semibold text-stone-900">Archivées</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-stone-500">
              Parcours clôturé ou en pause
            </p>
          </div>
          <span class="text-3xl font-bold tabular-nums text-stone-600">
            {{ pending ? '—' : pausedCount }}
          </span>
        </div>
        <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-stone-400 transition-all duration-500"
            :style="{ width: progressWidth(pausedCount) }"
          />
        </div>
        <div
          v-if="statusFilter === 'paused'"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="lucide:check-circle-2"
            class="h-5 w-5 text-stone-500"
          />
        </div>
      </button>
    </div>

    <!-- Search & results count -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par nom, email..."
          icon="i-lucide-search"
          class="w-full sm:w-72"
        />
        <UButton
          v-if="statusFilter !== 'all'"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="statusFilter = 'all'"
        >
          <UIcon
            name="lucide:x"
            class="mr-1 h-3.5 w-3.5"
          />
          Réinitialiser
        </UButton>
      </div>
      <p class="text-sm tabular-nums text-stone-500">
        <span class="font-semibold text-stone-900">{{ clients.length }}</span>
        cliente{{ clients.length > 1 ? 's' : '' }}
        <span v-if="statusFilter !== 'all'">
          · filtre actif
        </span>
        <span
          v-if="pending"
          class="ml-2 text-stone-400"
        >— Chargement...</span>
      </p>
    </div>

    <!-- Loading state -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <UCard
        v-for="i in 4"
        :key="i"
        class="bg-white"
      >
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
          <USkeleton class="h-8 w-24 rounded-full" />
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <UCard
      v-else-if="clients.length === 0"
      class="bg-white"
    >
      <div class="py-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <UIcon
            name="lucide:users"
            class="h-8 w-8 text-stone-400"
          />
        </div>
        <p class="text-lg font-medium text-stone-900">
          Aucune cliente
        </p>
        <p class="mt-2 text-stone-500">
          Les clientes apparaîtront ici dès qu'un premier rendez-vous sera créé.
        </p>
        <UButton
          to="/provider/discovery"
          variant="soft"
          color="primary"
          class="mt-6"
        >
          <UIcon
            name="lucide:phone-call"
            class="mr-2 h-4 w-4"
          />
          Voir les appels discovery
        </UButton>
      </div>
    </UCard>

    <!-- Clients list -->
    <div
      v-else
      class="space-y-4"
    >
      <ClientCard
        v-for="client in clients"
        :key="client.clientProfileId"
        :client="client"
      />
    </div>

    <!-- Load more -->
    <div
      v-if="clients.length > 0 && nextCursor"
      class="flex flex-col items-center gap-3"
    >
      <UButton
        variant="soft"
        color="neutral"
        :loading="loadMorePending"
        @click="loadMore"
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
        title="Chargement partiel"
        :description="loadMoreErrorMessage"
        icon="i-lucide-alert-triangle"
        class="w-full max-w-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProviderClients } from '../../../features/clients/useProviderClients'
import ClientCard from '../../../components/molecules/ClientCard.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mes clientes'
})

const {
  pending,
  errorMessage,
  clients,
  nextCursor,
  searchQuery,
  statusFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useProviderClients()

// Stats computed from clients list (4-stage model)
const totalClients = computed(() => clients.value.length)

const discoveryCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'discovery').length
)

const leadCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'lead').length
)

const activeCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'active').length
)

const pausedCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'paused').length
)

/**
 * Toggle filter on card click. If already selected, reset to 'all'.
 */
function toggleFilter(status: 'discovery' | 'lead' | 'active' | 'paused') {
  statusFilter.value = statusFilter.value === status ? 'all' : status
}

/**
 * Calculate progress bar width as percentage of total clients.
 */
function progressWidth(count: number): string {
  if (totalClients.value === 0) return '0%'
  const percentage = Math.round((count / totalClients.value) * 100)
  return `${Math.max(percentage, count > 0 ? 4 : 0)}%` // Minimum 4% if count > 0 for visibility
}
</script>
