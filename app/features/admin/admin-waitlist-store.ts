import { computed, reactive, ref, shallowRef } from 'vue'

import {
  applyOptimisticStatus,
  createDebouncer,
  reconcileLead,
  restoreSnapshot
} from './admin-waitlist-helpers'
import type {
  AdminWaitlistFilters,
  AdminWaitlistLead,
  ListAdminWaitlistResponse,
  WaitlistStatus
} from './api/admin-waitlist.contract'

/**
 * Pure store factory for the admin waitlist panel — used by the Nuxt
 * composable `useAdminWaitlist()` AND by behavioural tests (Codex F7).
 *
 * Why a dedicated factory? The composable's default service pulls in
 * `apiFetch`, which itself depends on Nuxt globals (`useRuntimeConfig`,
 * `useState`) unavailable in the project's node:test compile target. By
 * isolating all state + transitions here and accepting the service via
 * dependency injection, we can mount the store in plain Node.js, inject
 * fake services, and observe every reactive read.
 *
 * The composable is a 5-line wrapper that just builds the default service
 * from `apiFetch` and forwards options.
 */

export const SEARCH_DEBOUNCE_MS = 300
export const DEFAULT_LIMIT = 50

export interface AdminWaitlistService {
  list(filters: AdminWaitlistFilters): Promise<ListAdminWaitlistResponse>
  updateStatus(id: string, status: WaitlistStatus): Promise<AdminWaitlistLead>
}

export interface CreateAdminWaitlistStoreOptions {
  service: AdminWaitlistService
  debounceMs?: number
}

export function createAdminWaitlistStore(options: CreateAdminWaitlistStoreOptions) {
  const { service } = options
  const debounceMs = options.debounceMs ?? SEARCH_DEBOUNCE_MS

  const items = shallowRef<AdminWaitlistLead[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const nextCursor = ref<string | null>(null)
  const initialized = ref(false)

  const filters = reactive<AdminWaitlistFilters>({
    limit: DEFAULT_LIMIT
  })

  const debouncer = createDebouncer()

  const isEmpty = computed(() =>
    initialized.value && !loading.value && items.value.length === 0
  )

  async function fetchInitial(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await service.list({ ...filters, cursor: undefined })
      items.value = response.items
      nextCursor.value = response.page.nextCursor
      initialized.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur'
    } finally {
      loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!nextCursor.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const response = await service.list({ ...filters, cursor: nextCursor.value })
      items.value = [...items.value, ...response.items]
      nextCursor.value = response.page.nextCursor
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur'
    } finally {
      loadingMore.value = false
    }
  }

  function applyFilters(patch: Partial<AdminWaitlistFilters>): void {
    Object.assign(filters, patch)

    const isSearchOnly = Object.keys(patch).length === 1 && 'search' in patch

    if (isSearchOnly) {
      debouncer.schedule(() => {
        void fetchInitial()
      }, debounceMs)
      return
    }

    void fetchInitial()
  }

  function resetFilters(): void {
    debouncer.cancel()
    filters.status = undefined
    filters.specialty = undefined
    filters.search = undefined
    filters.dateFrom = undefined
    filters.dateTo = undefined
    filters.limit = DEFAULT_LIMIT
    void fetchInitial()
  }

  /**
   * Codex F4 — Optimistic + rollback.
   * 1. Snapshot the visible lead so we can undo.
   * 2. Patch the row in `items` BEFORE the network call.
   * 3. On success, reconcile via the server payload (timestamps included).
   * 4. On failure, restore the snapshot and re-throw so the caller can toast.
   */
  async function updateStatus(id: string, status: WaitlistStatus): Promise<AdminWaitlistLead> {
    const snapshot = items.value.find(lead => lead.id === id)
    if (!snapshot) {
      // Lead not in the current viewport (filtered out): relay the call,
      // do not touch the visible list.
      return service.updateStatus(id, status)
    }

    items.value = applyOptimisticStatus(items.value, id, status)

    try {
      const updated = await service.updateStatus(id, status)
      items.value = reconcileLead(items.value, updated)
      return updated
    } catch (e) {
      items.value = restoreSnapshot(items.value, snapshot)
      throw e
    }
  }

  return {
    items,
    loading,
    loadingMore,
    error,
    nextCursor,
    filters,
    isEmpty,
    initialized,
    fetchInitial,
    loadMore,
    applyFilters,
    resetFilters,
    updateStatus
  }
}

export type AdminWaitlistStore = ReturnType<typeof createAdminWaitlistStore>
