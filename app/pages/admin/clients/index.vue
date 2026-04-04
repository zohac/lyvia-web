<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'
import { type ClientStage, STAGE_LABELS, STAGE_VARIANT } from '~/utils/client-stage'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Clients'
})

const router = useRouter()
const toast = useToast()

// ──────────────────────────────────────────────
// Types (verified against OpenAPI DTOs)
// ──────────────────────────────────────────────

type IsActiveFilter = 'all' | 'true' | 'false'

type ClientListItem = {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
  phone: string
  stage: ClientStage
  isActive: boolean
  computedStatus: ClientStage
  stats: {
    consultationsCompleted: number
    lastAppointmentAt: string | null
    nextConsultationAt: string | null
  }
  createdAt: string
}

type ListClientsResponse = {
  items: ClientListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

type ProviderOption = {
  id: string
  displayName: string
  isTest: boolean
}

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

const searchQuery = ref('')
const stageFilter = ref<ClientStage | 'all'>('all')
const isActiveFilter = ref<IsActiveFilter>('all')
const providerFilter = ref<string>('all')
const loadingMore = ref(false)

const stageOptions = [
  { value: 'all' as const, label: 'Tous les stades' },
  { value: 'discovery' as const, label: 'En découverte' },
  { value: 'lead' as const, label: 'À convertir' },
  { value: 'active' as const, label: 'Actifs' },
  { value: 'paused' as const, label: 'Archivés' }
]

const isActiveOptions = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'true' as const, label: 'Actifs' },
  { value: 'false' as const, label: 'Désactivés' }
]

// ──────────────────────────────────────────────
// Fetch providers for dropdown
// ──────────────────────────────────────────────

const { data: providersData } = await useAsyncData<{ items: ProviderOption[] }>(
  'admin-providers-for-filter',
  () => apiFetch<{ items: ProviderOption[] }>('/admin/providers', { params: { limit: '100' } })
)

const providerOptions = computed(() => [
  { value: 'all', label: 'Tous les providers' },
  ...(providersData.value?.items.map(p => ({
    value: p.id,
    label: p.isTest ? `${p.displayName} (Test)` : p.displayName
  })) ?? [])
])

// ──────────────────────────────────────────────
// API params
// ──────────────────────────────────────────────

const queryParams = computed(() => {
  const params: Record<string, string> = { limit: '20' }
  if (searchQuery.value) params.q = searchQuery.value
  if (stageFilter.value !== 'all') params.status = stageFilter.value
  if (isActiveFilter.value !== 'all') params.isActive = isActiveFilter.value
  if (providerFilter.value && providerFilter.value !== 'all') params.providerId = providerFilter.value
  return params
})

// ──────────────────────────────────────────────
// Fetch clients
// ──────────────────────────────────────────────

const { data: clients, pending, error, refresh } = await useAsyncData<ListClientsResponse>(
  'admin-clients',
  () => apiFetch<ListClientsResponse>('/admin/clients', { params: queryParams.value }),
  { watch: [queryParams] }
)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    refresh()
  }, 300)
}

// Load more
async function loadMore() {
  if (!clients.value?.page.nextCursor || loadingMore.value) return

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListClientsResponse>('/admin/clients', {
      params: {
        ...queryParams.value,
        cursor: clients.value.page.nextCursor
      }
    })

    if (clients.value) {
      clients.value = {
        items: [...clients.value.items, ...moreData.items],
        page: moreData.page
      }
    }
  } catch (err) {
    toast.add({
      title: 'Erreur lors du chargement',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    loadingMore.value = false
  }
}

// ──────────────────────────────────────────────
// Table columns
// ──────────────────────────────────────────────

const columns: TableColumn<ClientListItem>[] = [
  {
    accessorKey: 'lastname',
    header: 'Client',
    cell: ({ row }) => {
      const c = row.original
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, `${c.firstname} ${c.lastname}`),
        h('span', { class: 'text-xs text-[color:var(--color-brand-muted)]' }, c.email)
      ])
    }
  },
  {
    id: 'stage',
    header: 'Stade',
    cell: ({ row }) => {
      const stage = row.original.computedStatus
      const s = getStatusBadgeClasses(STAGE_VARIANT[stage])
      return h('span', { class: s.badge }, [
        h('span', { class: s.dot }),
        STAGE_LABELS[stage]
      ])
    }
  },
  {
    id: 'accountStatus',
    header: 'Compte',
    cell: ({ row }) => {
      const active = row.original.isActive
      const s = getStatusBadgeClasses(active ? 'success' : 'error')
      return h('span', { class: s.badge }, [
        h('span', { class: s.dot }),
        active ? 'Actif' : 'Désactivé'
      ])
    }
  },
  {
    id: 'stats',
    header: 'Consultations',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' },
        `${row.original.stats.consultationsCompleted}`
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Inscription',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' },
        formatDateShort(row.original.createdAt)
      )
    }
  }
]

// Row click
function onRowSelect(_e: Event, row: TableRow<ClientListItem>) {
  router.push(`/admin/clients/${row.original.clientProfileId}`)
}
</script>

<template>
  <div>
    <AtomsDsPageHeader
      title="Clients"
      subtitle="Supervision cross-provider"
      class="mb-10"
    />

    <!-- Filters -->
    <section class="mb-8 space-y-4">
      <!-- Search -->
      <div class="max-w-md">
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par nom ou email..."
          icon="i-lucide-search"
          size="lg"
          class="w-full"
          @input="debouncedSearch"
        />
      </div>

      <!-- Filter row -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Provider filter -->
        <USelect
          v-model="providerFilter"
          :items="providerOptions"
          value-key="value"
          label-key="label"
          placeholder="Tous les providers"
          class="w-56"
        />

        <!-- Stage filter -->
        <div class="flex gap-2">
          <button
            v-for="opt in stageOptions"
            :key="opt.value"
            type="button"
            :class="filterPillClasses(stageFilter === opt.value)"
            @click="stageFilter = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- IsActive filter -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Statut :</span>
          <div class="flex gap-2">
            <button
              v-for="opt in isActiveOptions"
              :key="opt.value"
              type="button"
              :class="filterPillClasses(isActiveFilter === opt.value, 'sm')"
              @click="isActiveFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Clients Table -->
    <section class="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] shadow-soft">
      <!-- Loading State -->
      <div
        v-if="pending"
        class="space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-14 rounded-xl"
        />
      </div>

      <!-- Error State -->
      <AtomsDsErrorState
        v-else-if="error"
        message="Erreur lors du chargement des clients"
        @retry="refresh()"
      />

      <!-- Empty State -->
      <AtomsDsEmptyState
        v-else-if="!clients?.items?.length"
        icon="i-lucide-users"
        title="Aucun client trouvé"
        :description="searchQuery ? 'Essayez avec d\'autres termes de recherche.' : 'Aucun client n\'est encore inscrit.'"
      />

      <!-- Table (desktop) -->
      <div v-else>
        <div class="hidden md:block">
          <UTable
            :data="clients.items"
            :columns="columns"
            :class="[ADMIN_TABLE_CLASSES, '[&_tr:hover_td]:bg-[color:var(--color-crepuscule-50)]/30 [&_tr]:cursor-pointer [&_tr]:transition-colors']"
            @select="onRowSelect"
          />
        </div>

        <!-- Cards (mobile) -->
        <div class="block space-y-3 p-4 md:hidden">
          <div
            v-for="client in clients.items"
            :key="client.clientProfileId"
            class="cursor-pointer rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4 transition-colors hover:bg-[color:var(--color-crepuscule-50)]/30"
            @click="router.push(`/admin/clients/${client.clientProfileId}`)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <span class="truncate font-medium text-[color:var(--color-brand-primary)]">{{ client.firstname }} {{ client.lastname }}</span>
                <p class="mt-0.5 truncate text-xs text-[color:var(--color-brand-muted)]">
                  {{ client.email }}
                </p>
              </div>
              <span
                :class="getStatusBadgeClasses(STAGE_VARIANT[client.computedStatus]).badge"
                class="shrink-0"
              >
                <span :class="getStatusBadgeClasses(STAGE_VARIANT[client.computedStatus]).dot" />
                {{ STAGE_LABELS[client.computedStatus] }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-secondary)]">
              <span
                :class="getStatusBadgeClasses(client.isActive ? 'success' : 'error').badge"
              >
                <span :class="getStatusBadgeClasses(client.isActive ? 'success' : 'error').dot" />
                {{ client.isActive ? 'Actif' : 'Désactivé' }}
              </span>
              <span>{{ client.stats.consultationsCompleted }} consultation{{ client.stats.consultationsCompleted !== 1 ? 's' : '' }}</span>
              <span>{{ formatDateShort(client.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="clients.page.nextCursor"
          class="flex justify-center border-t border-[color:var(--color-border-subtle)] p-4"
        >
          <UButton
            variant="outline"
            color="neutral"
            class="rounded-full"
            :loading="loadingMore"
            @click="loadMore"
          >
            <UIcon
              name="lucide:chevron-down"
              size="16"
            />
            Charger plus
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>
