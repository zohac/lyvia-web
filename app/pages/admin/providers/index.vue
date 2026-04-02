<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Providers'
})

const router = useRouter()

// Types
type StripeStatusFilter = 'all' | 'connected' | 'pending' | 'blocked'

type AdminProviderListItem = {
  id: string
  userId: string
  displayName: string
  email: string
  isActive: boolean
  isTest: boolean
  createdAt: string
  stripe: {
    stripeAccountId: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    requirementsDueCount: number
    onboardingCompletedAt: string | null
  }
}

type ListProvidersResponse = {
  items: AdminProviderListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

// Creation drawer
const showCreateDrawer = ref(false)

function onProviderCreated(id: string) {
  router.push(`/admin/providers/${id}`)
}

// Filters
const searchQuery = ref('')
const stripeStatus = ref<StripeStatusFilter>('all')
const showTestOnly = ref(false)
const providerIdInput = ref('')
const loadingMore = ref(false)

const stripeStatusFilters = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'connected' as const, label: 'Connectés' },
  { value: 'pending' as const, label: 'En attente' },
  { value: 'blocked' as const, label: 'Bloqués' }
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isValidUuid = computed(() => UUID_REGEX.test(providerIdInput.value))

// API params
const queryParams = computed(() => {
  const params: Record<string, string> = { limit: '20' }
  if (searchQuery.value) params.q = searchQuery.value
  if (stripeStatus.value !== 'all') params.stripeStatus = stripeStatus.value
  if (showTestOnly.value) {
    params.isTest = 'true'
  } else {
    params.isTest = 'false'
  }
  return params
})

// Fetch providers
const { data: providers, pending, error, refresh } = await useAsyncData<ListProvidersResponse>(
  'admin-providers',
  () => apiFetch<ListProvidersResponse>('/admin/providers', { params: queryParams.value }),
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

function setStripeStatus(status: StripeStatusFilter) {
  stripeStatus.value = status
}

// Load more
async function loadMore() {
  if (!providers.value?.page.nextCursor || loadingMore.value) return

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListProvidersResponse>('/admin/providers', {
      params: {
        ...queryParams.value,
        cursor: providers.value.page.nextCursor
      }
    })

    if (providers.value) {
      providers.value = {
        items: [...providers.value.items, ...moreData.items],
        page: moreData.page
      }
    }
  } finally {
    loadingMore.value = false
  }
}

// Table columns
const columns: TableColumn<AdminProviderListItem>[] = [
  {
    accessorKey: 'displayName',
    header: 'Provider',
    cell: ({ row }) => {
      const provider = row.original
      const nameChildren: ReturnType<typeof h>[] = [
        h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, provider.displayName)
      ]
      if (provider.isTest) {
        nameChildren.push(h('span', { class: 'ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700' }, 'Test'))
      }
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h('div', { class: 'flex items-center' }, nameChildren),
        h('span', { class: 'text-xs text-[color:var(--color-brand-muted)]' }, provider.email)
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
    accessorKey: 'stripe.stripeAccountId',
    header: 'Stripe Account',
    cell: ({ row }) => {
      const accountId = row.original.stripe.stripeAccountId
      if (!accountId) {
        return h('span', { class: 'text-sm text-[color:var(--color-brand-muted)]' }, '—')
      }
      return h('span', { class: 'font-mono text-xs text-[color:var(--color-brand-secondary)]' }, accountId)
    }
  },
  {
    id: 'stripeStatus',
    header: 'Statut',
    cell: ({ row }) => {
      const stripe = row.original.stripe
      let variant: 'neutral' | 'success' | 'warning' | 'error' = 'neutral'
      let label = 'Non lié'
      if (stripe.stripeAccountId) {
        if (stripe.chargesEnabled && stripe.payoutsEnabled) {
          variant = 'success'
          label = 'Actif'
        } else if (stripe.requirementsDueCount > 0) {
          variant = 'warning'
          label = `${stripe.requirementsDueCount} action${stripe.requirementsDueCount > 1 ? 's' : ''}`
        } else {
          variant = 'error'
          label = 'Bloqué'
        }
      }
      const s = getStatusBadgeClasses(variant)
      return h('span', { class: s.badge }, [h('span', { class: s.dot }), label])
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
function onRowSelect(_e: Event, row: TableRow<AdminProviderListItem>) {
  router.push(`/admin/providers/${row.original.id}`)
}

// Direct access
function goToProvider() {
  if (isValidUuid.value) {
    router.push(`/admin/providers/${providerIdInput.value}`)
  }
}
</script>

<template>
  <div>
    <AtomsDsPageHeader
      title="Providers"
      subtitle="Gestion des comptes coachs"
      class="mb-10"
    >
      <template #actions>
        <UButton
          color="primary"
          @click="showCreateDrawer = true"
        >
          <UIcon
            name="lucide:plus"
            size="18"
          />
          Nouveau provider
        </UButton>
      </template>
    </AtomsDsPageHeader>

    <!-- Filters -->
    <section class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search -->
      <div class="max-w-md flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par nom ou email..."
          icon="i-lucide-search"
          size="lg"
          class="w-full"
          @input="debouncedSearch"
        />
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-5">
        <!-- Stripe Status Filter -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Stripe :</span>
          <div class="flex gap-2">
            <button
              v-for="filter in stripeStatusFilters"
              :key="filter.value"
              type="button"
              :class="filterPillClasses(stripeStatus === filter.value)"
              @click="setStripeStatus(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- Test Filter -->
        <button
          type="button"
          :class="filterPillClasses(showTestOnly)"
          @click="showTestOnly = !showTestOnly"
        >
          Comptes test
        </button>
      </div>
    </section>

    <!-- Providers Table -->
    <section class="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-white shadow-soft">
      <!-- Loading State -->
      <div
        v-if="pending"
        class="flex items-center justify-center py-20"
      >
        <UIcon
          name="lucide:loader-2"
          size="32"
          class="animate-spin text-[color:var(--color-brand-muted)]"
        />
      </div>

      <!-- Error State -->
      <AtomsDsErrorState
        v-else-if="error"
        message="Erreur lors du chargement des providers"
        @retry="refresh()"
      />

      <!-- Empty State -->
      <AtomsDsEmptyState
        v-else-if="!providers?.items?.length"
        icon="i-lucide-users"
        title="Aucun provider trouvé"
        :description="searchQuery ? 'Essayez avec d\'autres termes de recherche.' : 'Aucun provider n\'est encore inscrit.'"
      />

      <!-- Table -->
      <div v-else>
        <UTable
          :data="providers.items"
          :columns="columns"
          :row-attrs="(row: AdminProviderListItem) => row.isTest ? { class: 'bg-amber-50/40' } : {}"
          :class="[ADMIN_TABLE_CLASSES, '[&_tr:hover_td]:bg-[color:var(--color-crepuscule-50)]/30 [&_tr]:cursor-pointer [&_tr]:transition-colors']"
          @select="onRowSelect"
        />

        <!-- Pagination -->
        <div
          v-if="providers.page.nextCursor"
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

    <!-- Quick Access Card -->
    <section class="mt-8 overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
          <UIcon
            name="lucide:hash"
            size="20"
            class="text-[color:var(--color-crepuscule-600)]"
          />
        </div>
        <div class="grid gap-1">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Accès direct par ID
          </h2>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Entrez l'ID d'un provider pour accéder directement à ses informations
          </p>
        </div>
      </div>

      <form
        class="mt-6 flex gap-4"
        @submit.prevent="goToProvider"
      >
        <div class="flex-1">
          <UInput
            v-model="providerIdInput"
            placeholder="00000000-0000-0000-0000-000000000000"
            size="lg"
            class="w-full font-mono"
          />
        </div>
        <UButton
          type="submit"
          color="primary"
          :disabled="!isValidUuid"
          class="rounded-full"
        >
          <UIcon
            name="lucide:arrow-right"
            size="18"
          />
          Voir
        </UButton>
      </form>

      <p
        v-if="providerIdInput && !isValidUuid"
        class="mt-2 text-sm text-[color:var(--color-error-600)]"
      >
        Format UUID invalide
      </p>
    </section>

    <!-- Create Provider Drawer -->
    <OrganismsAdminProviderCreateDrawer
      v-model:open="showCreateDrawer"
      @created="onProviderCreated"
    />
  </div>
</template>
