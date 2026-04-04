<template>
  <div>
    <!-- Filters -->
    <section class="mb-8 space-y-4">
      <!-- Row 1: Search + Event Type -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <!-- Search -->
        <div class="relative max-w-md flex-1">
          <UIcon
            name="lucide:search"
            size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher dans les logs..."
            autocomplete="off"
            class="w-full rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] py-3 pl-12 pr-4 text-sm text-[color:var(--color-brand-primary)] placeholder-[color:var(--color-brand-muted)] shadow-sm transition-shadow focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
            @input="debouncedSearch"
          >
        </div>

        <!-- Event Type Multi-Select -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Types:</span>
          <button
            v-for="eventType in eventTypeOptions"
            :key="eventType.value"
            :class="[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              selectedEventTypes.includes(eventType.value)
                ? `${eventType.activeClass} shadow-sm`
                : 'border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
            ]"
            @click="toggleEventType(eventType.value)"
          >
            {{ eventType.label }}
          </button>
          <button
            v-if="selectedEventTypes.length > 0"
            class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="clearEventTypes"
          >
            Effacer
          </button>
        </div>
      </div>

      <!-- Row 2: Date Range -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label
            for="dateFrom"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Du:</label>
          <input
            id="dateFrom"
            v-model="dateFrom"
            type="datetime-local"
            autocomplete="off"
            class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
            @change="applyFilters"
          >
        </div>

        <div class="flex items-center gap-2">
          <label
            for="dateTo"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Au:</label>
          <input
            id="dateTo"
            v-model="dateTo"
            type="datetime-local"
            autocomplete="off"
            class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
            @change="applyFilters"
          >
        </div>

        <button
          v-if="dateFrom || dateTo"
          class="text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
          @click="clearDates"
        >
          Effacer dates
        </button>
      </div>
    </section>

    <!-- Logs Table -->
    <section class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
      <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--ui-color-primary-100)] opacity-30 blur-[100px]" />

      <!-- Loading State -->
      <div
        v-if="pending"
        class="relative z-10 space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 rounded-xl"
        />
      </div>

      <!-- Error State -->
      <AtomsDsErrorState
        v-else-if="error"
        :message="error?.message || 'Erreur lors du chargement des logs'"
        class="relative z-10"
        @retry="refresh()"
      />

      <!-- Empty State -->
      <AtomsDsEmptyState
        v-else-if="!logs?.items?.length"
        icon="i-lucide-scroll-text"
        title="Aucun log trouvé"
        :description="hasActiveFilters ? 'Essayez avec d\'autres filtres.' : 'Aucun événement n\'a encore été enregistré.'"
        class="relative z-10"
      />

      <!-- Table -->
      <div
        v-else
        class="relative z-10"
      >
        <UTable
          :data="logs.items"
          :columns="columns"
          :class="ADMIN_TABLE_CLASSES"
        />

        <!-- Pagination -->
        <div
          v-if="logs.page.nextCursor"
          class="flex justify-center border-t border-[color:var(--color-brand-subtle)]/50 p-4"
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

    <!-- Detail Drawer -->
    <USlideover
      v-model:open="drawerOpen"
      side="right"
      :title="selectedLog ? selectedLog.eventType : 'Détail du log'"
    >
      <template #body>
        <div
          v-if="detailPending"
          class="space-y-4 py-8"
        >
          <USkeleton class="h-6 w-48" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-32 rounded-xl" />
        </div>

        <div
          v-else-if="detailError"
          class="p-4"
        >
          <AtomsDsErrorState message="Erreur lors du chargement du détail" />
        </div>

        <div
          v-else-if="logDetail"
          class="space-y-6 p-4"
        >
          <!-- Event Type Badge -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Type d'événement
            </span>
            <div class="mt-2">
              <span :class="`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getBadgeClasses(getEventBadgeColor(logDetail.eventType))}`">
                {{ logDetail.eventType }}
              </span>
            </div>
          </div>

          <!-- Date -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Date
            </span>
            <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
              {{ formatDate(logDetail.createdAt) }}
            </p>
          </div>

          <!-- User ID -->
          <div v-if="logDetail.userId">
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              User ID
            </span>
            <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
              {{ logDetail.userId }}
            </p>
          </div>

          <!-- Log ID -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Log ID
            </span>
            <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
              {{ logDetail.id }}
            </p>
          </div>

          <!-- Metadata -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Metadata
            </span>
            <pre class="mt-2 max-h-96 overflow-auto rounded-lg bg-[color:var(--color-surface-muted)] p-4 text-xs text-[color:var(--color-brand-primary)]">{{ JSON.stringify(logDetail.metadata, null, 2) }}</pre>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { getEventBadgeColor, getBadgeClasses } from '~/composables/useAdminBadges'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'

// Types
type AdminBusinessLogListItem = {
  id: string
  eventType: string
  userId: string | null
  createdAt: string
  metadataPreview: string
}

type ListBusinessLogsResponse = {
  items: AdminBusinessLogListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

type AdminBusinessLogDetail = {
  id: string
  eventType: string
  userId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

// Filters
const searchQuery = ref('')
const selectedEventTypes = ref<string[]>([])
const dateFrom = ref('')
const dateTo = ref('')
const loadingMore = ref(false)

// Drawer state
const drawerOpen = ref(false)
const selectedLog = ref<AdminBusinessLogListItem | null>(null)
const logDetail = ref<AdminBusinessLogDetail | null>(null)
const detailPending = ref(false)
const detailError = ref<Error | null>(null)

// Event type options with colors
const eventTypeOptions = [
  { value: 'PAYMENT_', label: 'Paiements', activeClass: 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]' },
  { value: 'APPOINTMENT_', label: 'RDV', activeClass: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-700)]' },
  { value: 'CLIENT_', label: 'Clients', activeClass: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-800)]' },
  { value: 'PROVIDER_', label: 'Providers', activeClass: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]' },
  { value: 'STRIPE_', label: 'Stripe', activeClass: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]' },
  { value: 'AUTH_', label: 'Auth', activeClass: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]' }
]

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== ''
    || selectedEventTypes.value.length > 0
    || dateFrom.value !== ''
    || dateTo.value !== ''
})

// API params
const queryParams = computed(() => {
  const params: Record<string, string | string[]> = { limit: '20' }
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (selectedEventTypes.value.length > 0) params.eventType = selectedEventTypes.value
  if (dateFrom.value) params.dateFrom = new Date(dateFrom.value).toISOString()
  if (dateTo.value) params.dateTo = new Date(dateTo.value).toISOString()
  return params
})

// Fetch logs (no watch - manual refresh via debounce/filter handlers to avoid double-fetch)
const { data: logs, pending, error, refresh } = await useAsyncData<ListBusinessLogsResponse>(
  'admin-business-logs',
  () => apiFetch<ListBusinessLogsResponse>('/admin/logs', { params: queryParams.value })
)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    refresh()
  }, 300)
}

// Event type toggle
function toggleEventType(prefix: string) {
  const index = selectedEventTypes.value.indexOf(prefix)
  if (index === -1) {
    selectedEventTypes.value.push(prefix)
  } else {
    selectedEventTypes.value.splice(index, 1)
  }
  refresh()
}

function clearEventTypes() {
  selectedEventTypes.value = []
  refresh()
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  refresh()
}

function applyFilters() {
  refresh()
}

// Load more
async function loadMore() {
  if (!logs.value?.page.nextCursor || loadingMore.value) return

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListBusinessLogsResponse>('/admin/logs', {
      params: {
        ...queryParams.value,
        cursor: logs.value.page.nextCursor
      }
    })

    if (logs.value) {
      logs.value = {
        items: [...logs.value.items, ...moreData.items],
        page: moreData.page
      }
    }
  } finally {
    loadingMore.value = false
  }
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Open detail drawer
async function openDetail(log: AdminBusinessLogListItem) {
  selectedLog.value = log
  drawerOpen.value = true
  detailPending.value = true
  detailError.value = null
  logDetail.value = null

  try {
    logDetail.value = await apiFetch<AdminBusinessLogDetail>(`/admin/logs/${log.id}`)
  } catch (e) {
    detailError.value = e as Error
  } finally {
    detailPending.value = false
  }
}

// Table columns
const columns: TableColumn<AdminBusinessLogListItem>[] = [
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
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('button', {
        class: 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:bg-[color:var(--ui-color-primary-50)] hover:text-[color:var(--color-brand-primary)]',
        onClick: () => openDetail(row.original)
      }, [
        h('span', {}, 'Détails'),
        h('svg', {
          'class': 'h-3.5 w-3.5',
          'xmlns': 'http://www.w3.org/2000/svg',
          'fill': 'none',
          'viewBox': '0 0 24 24',
          'stroke': 'currentColor',
          'stroke-width': '2'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'd': 'M9 5l7 7-7 7'
          })
        ])
      ])
    }
  }
]
</script>
