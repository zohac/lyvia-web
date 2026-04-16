<template>
  <div class="space-y-8">
    <AtomsDsPageHeader
      title="Mes clientes"
      subtitle="Cliquez sur une carte pour filtrer par statut."
    >
      <template #actions>
        <div class="flex items-center gap-3">
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
          <UButton
            color="primary"
            @click="createDrawerOpen = true"
          >
            <UIcon
              name="lucide:user-plus"
              class="mr-2 h-4 w-4"
            />
            Nouvelle cliente
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
      <!-- Stats cards - Interactive filters -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <!-- En découverte -->
        <div
          class="group relative overflow-hidden rounded-2xl border bg-[color:var(--color-surface-card)] transition-all duration-200"
          :class="[
            statusFilter === 'discovery'
              ? 'border-[color:var(--color-sunset-300)] ring-2 ring-[color:var(--color-sunset-200)] shadow-md'
              : 'border-[color:var(--color-brand-subtle)] hover:border-[color:var(--color-sunset-200)] hover:shadow-sm'
          ]"
        >
          <button
            type="button"
            class="w-full p-5 text-left"
            @click="toggleFilter('discovery')"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-sunset-100)]">
                    <UIcon
                      name="lucide:search"
                      class="h-4.5 w-4.5 text-[color:var(--color-sunset-600)]"
                    />
                  </div>
                  <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">En découverte</span>
                </div>
                <p class="mt-3 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                  Appel découverte planifié
                </p>
              </div>
              <span class="text-3xl font-bold tabular-nums text-[color:var(--color-sunset-600)]">
                {{ pending ? '—' : discoveryCount }}
              </span>
            </div>
            <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
              <div
                class="h-full rounded-full bg-[color:var(--color-sunset-400)] transition-all duration-500"
                :style="{ width: progressWidth(discoveryCount) }"
              />
            </div>
          </button>

          <button
            v-if="discoveryCancelledCount > 0"
            type="button"
            class="flex w-full items-center justify-between border-t border-[color:var(--color-neutral-100)] px-5 py-2.5 text-left transition-colors"
            :class="[
              showCancelledOnly
                ? 'bg-[color:var(--color-error-50)]'
                : 'hover:bg-[color:var(--color-surface-page)]'
            ]"
            @click.stop="toggleCancelledFilter"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="lucide:calendar-x"
                class="h-3.5 w-3.5 text-[color:var(--color-error)]"
              />
              <span class="text-xs font-medium text-[color:var(--color-error-600)]">
                {{ discoveryCancelledCount }} annulé{{ discoveryCancelledCount > 1 ? 's' : '' }}
              </span>
            </div>
            <UIcon
              v-if="showCancelledOnly"
              name="lucide:check"
              class="h-3.5 w-3.5 text-[color:var(--color-error)]"
            />
          </button>

          <div
            v-if="statusFilter === 'discovery' && !showCancelledOnly"
            class="absolute right-3 top-3"
          >
            <UIcon
              name="lucide:check-circle-2"
              class="h-5 w-5 text-[color:var(--color-sunset-500)]"
            />
          </div>
        </div>

        <!-- Leads -->
        <button
          type="button"
          class="group relative overflow-hidden rounded-2xl border bg-[color:var(--color-surface-card)] p-5 text-left transition-all duration-200"
          :class="[
            statusFilter === 'lead'
              ? 'border-[color:var(--color-success-300)] ring-2 ring-[color:var(--color-success-200)] shadow-md'
              : 'border-[color:var(--color-brand-subtle)] hover:border-[color:var(--color-success-200)] hover:shadow-sm'
          ]"
          @click="toggleFilter('lead')"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-success-100)]">
                  <UIcon
                    name="lucide:user-check"
                    class="h-4.5 w-4.5 text-[color:var(--color-success-600)]"
                  />
                </div>
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">À convertir</span>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                Discovery effectué, en attente de décision
              </p>
            </div>
            <span class="text-3xl font-bold tabular-nums text-[color:var(--color-success-600)]">
              {{ pending ? '—' : leadCount }}
            </span>
          </div>
          <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
            <div
              class="h-full rounded-full bg-[color:var(--color-success-400)] transition-all duration-500"
              :style="{ width: progressWidth(leadCount) }"
            />
          </div>
          <div
            v-if="statusFilter === 'lead'"
            class="absolute right-3 top-3"
          >
            <UIcon
              name="lucide:check-circle-2"
              class="h-5 w-5 text-[color:var(--color-success)]"
            />
          </div>
        </button>

        <!-- Actives -->
        <button
          type="button"
          class="group relative overflow-hidden rounded-2xl border bg-[color:var(--color-surface-card)] p-5 text-left transition-all duration-200"
          :class="[
            statusFilter === 'active'
              ? 'border-crepuscule-300 ring-2 ring-crepuscule-200 shadow-md'
              : 'border-[color:var(--color-brand-subtle)] hover:border-crepuscule-200 hover:shadow-sm'
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
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">Actives</span>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                Accompagnement en cours
              </p>
            </div>
            <span class="text-3xl font-bold tabular-nums text-crepuscule-600">
              {{ pending ? '—' : activeCount }}
            </span>
          </div>
          <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
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
          class="group relative overflow-hidden rounded-2xl border bg-[color:var(--color-surface-card)] p-5 text-left transition-all duration-200"
          :class="[
            statusFilter === 'paused'
              ? 'border-[color:var(--color-neutral-400)] ring-2 ring-[color:var(--color-neutral-300)] shadow-md'
              : 'border-[color:var(--color-brand-subtle)] hover:border-[color:var(--color-neutral-300)] hover:shadow-sm'
          ]"
          @click="toggleFilter('paused')"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-surface-muted)]">
                  <UIcon
                    name="lucide:archive"
                    class="h-4.5 w-4.5 text-[color:var(--color-text-secondary)]"
                  />
                </div>
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">Archivées</span>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                Parcours clôturé ou en pause
              </p>
            </div>
            <span class="text-3xl font-bold tabular-nums text-[color:var(--color-text-secondary)]">
              {{ pending ? '—' : pausedCount }}
            </span>
          </div>
          <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
            <div
              class="h-full rounded-full bg-[color:var(--color-neutral-400)] transition-all duration-500"
              :style="{ width: progressWidth(pausedCount) }"
            />
          </div>
          <div
            v-if="statusFilter === 'paused'"
            class="absolute right-3 top-3"
          >
            <UIcon
              name="lucide:check-circle-2"
              class="h-5 w-5 text-[color:var(--color-text-muted)]"
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
            v-if="statusFilter !== 'all' || showCancelledOnly"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="statusFilter = 'all'; showCancelledOnly = false"
          >
            <UIcon
              name="lucide:x"
              class="mr-1 h-3.5 w-3.5"
            />
            Réinitialiser
          </UButton>
        </div>
        <p class="text-sm tabular-nums text-[color:var(--color-text-muted)]">
          <span class="font-semibold text-[color:var(--color-text-primary)]">{{ clients.length }}</span>
          cliente{{ clients.length > 1 ? 's' : '' }}
          <span
            v-if="showCancelledOnly"
            class="text-[color:var(--color-error-600)]"
          >
            · discovery annulés
          </span>
          <span v-else-if="statusFilter !== 'all'">
            · filtre actif
          </span>
          <span
            v-if="pending"
            class="ml-2 text-[color:var(--color-brand-muted)]"
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
          class="bg-[color:var(--color-surface-card)]"
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
      <AtomsDsEmptyState
        v-else-if="clients.length === 0"
        icon="i-lucide-users"
        :title="clientsEmptyTitle"
        :description="clientsEmptyDescription"
        :cta-label="hasClientFilters ? undefined : 'Voir les appels découverte'"
        :cta-to="hasClientFilters ? undefined : '/provider/discovery'"
      />

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
    </template>

    <!-- Create Client Drawer -->
    <ProviderClientCreateDrawer
      v-model:open="createDrawerOpen"
      @created="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { useProviderClients } from '../../../features/clients/useProviderClients'
import { hasDiscoveryCancelled } from '../../../features/clients/domain/clients'
import ClientCard from '../../../components/molecules/ClientCard.vue'
import ProviderClientCreateDrawer from '../../../components/organisms/ProviderClientCreateDrawer.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mes clientes'
})

const {
  pending,
  errorMessage,
  clients: rawClients,
  nextCursor,
  searchQuery,
  statusFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useProviderClients()

// Create drawer
const createDrawerOpen = ref(false)

// Local filter for cancelled discoveries (frontend-only refinement)
const showCancelledOnly = ref(false)

// Apply local filter for cancelled discoveries
const clients = computed(() => {
  if (!showCancelledOnly.value) return rawClients.value
  // When showCancelledOnly is active, only show discovery clients with cancelled discovery
  return rawClients.value.filter(c => hasDiscoveryCancelled(c))
})

// Stats computed from raw clients list (unfiltered for accurate counts)
const totalClients = computed(() => rawClients.value.length)

const discoveryClients = computed(() =>
  rawClients.value.filter(c => c.computedStatus === 'discovery')
)

const discoveryCount = computed(() => discoveryClients.value.length)

// Count of cancelled discoveries (discovery stage + no scheduled discovery)
const discoveryCancelledCount = computed(() =>
  discoveryClients.value.filter(c => !c.hasScheduledDiscovery).length
)

const leadCount = computed(() =>
  rawClients.value.filter(c => c.computedStatus === 'lead').length
)

const activeCount = computed(() =>
  rawClients.value.filter(c => c.computedStatus === 'active').length
)

const pausedCount = computed(() =>
  rawClients.value.filter(c => c.computedStatus === 'paused').length
)

const hasClientFilters = computed(() =>
  Boolean(searchQuery.value) || statusFilter.value !== 'all' || showCancelledOnly.value
)

const clientsEmptyTitle = computed(() => {
  if (showCancelledOnly.value) return 'Aucun discovery annulé'
  if (hasClientFilters.value) return 'Aucune cliente trouvée'
  return 'Aucune cliente'
})

const clientsEmptyDescription = computed(() => {
  if (showCancelledOnly.value) return 'Aucun appel découverte annulé ne correspond au filtre actuel.'
  if (hasClientFilters.value) return 'Essayez avec d\'autres critères de recherche ou retirez un filtre.'
  return 'Les clientes apparaîtront ici dès qu\'un premier rendez-vous sera créé.'
})

/**
 * Toggle filter on card click. If already selected, reset to 'all'.
 * Also resets cancelled-only filter when switching away from discovery.
 */
function toggleFilter(status: 'discovery' | 'lead' | 'active' | 'paused') {
  if (statusFilter.value === status) {
    statusFilter.value = 'all'
    showCancelledOnly.value = false
  } else {
    statusFilter.value = status
    // Reset cancelled filter when switching to a different status
    if (status !== 'discovery') {
      showCancelledOnly.value = false
    }
  }
}

/**
 * Toggle cancelled-only filter. Also ensures discovery filter is active.
 */
function toggleCancelledFilter() {
  if (showCancelledOnly.value) {
    // Turn off cancelled filter
    showCancelledOnly.value = false
  } else {
    // Turn on cancelled filter and ensure discovery is selected
    statusFilter.value = 'discovery'
    showCancelledOnly.value = true
  }
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
