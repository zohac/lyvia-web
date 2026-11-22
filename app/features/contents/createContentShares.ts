import { ref, computed } from 'vue'
import type {
  ContentShareItem,
  ListContentSharesResponse,
  ShareContentRequest,
  ShareContentResponse
} from './api/contents.contract'
import type { ListProviderClientsParams, ListProviderClientsResponse, ProviderClientListItem } from '../clients/api/clients.contract'
import {
  filterSelectableClients,
  removeSharedClient,
  restoreSharedClient
} from './domain/content-shares'

export interface ContentSharesDeps {
  listShares: (contentId: string) => Promise<ListContentSharesResponse>
  share: (contentId: string, payload: ShareContentRequest) => Promise<ShareContentResponse>
  unshare: (contentId: string, clientProfileId: string) => Promise<void>
  listClients: (params: ListProviderClientsParams) => Promise<ListProviderClientsResponse>
}

const ROSTER_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

export function createContentShares(deps: ContentSharesDeps, contentId: string) {
  const shared = ref<ContentShareItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  const sharingAll = ref(false)
  const adding = ref(false)

  const removing = ref<Set<string>>(new Set())

  // selector state
  const selectorOpen = ref(false)
  const selectorQuery = ref('')
  const selected = ref<Set<string>>(new Set())
  const roster = ref<ProviderClientListItem[]>([])
  const rosterPending = ref(false)
  const rosterError = ref<string | null>(null)
  const rosterNextCursor = ref<string | null>(null)
  const rosterLoadId = ref(0)

  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  function clearSearchTimeout() {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }

  const sharedIds = computed(() => new Set(shared.value.map(s => s.clientProfileId)))

  const selectableClients = computed(() =>
    filterSelectableClients(roster.value, shared.value, selectorQuery.value)
  )

  async function loadShares() {
    pending.value = true
    error.value = null
    try {
      const res = await deps.listShares(contentId)
      shared.value = [...res.items].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Impossible de charger les partages.'
    } finally {
      pending.value = false
    }
  }

  async function loadRoster(query?: string, cursor?: string) {
    const id = rosterLoadId.value + 1
    rosterLoadId.value = id
    rosterPending.value = true
    rosterError.value = null
    try {
      const params: ListProviderClientsParams = { limit: ROSTER_LIMIT }
      const q = (query ?? selectorQuery.value).trim()
      if (q) params.q = q
      if (cursor) params.cursor = cursor
      const res = await deps.listClients(params)
      if (rosterLoadId.value !== id) return
      if (cursor) {
        roster.value = [...roster.value, ...res.items]
      } else {
        roster.value = res.items
      }
      rosterNextCursor.value = res.page.nextCursor
    } catch (err) {
      if (rosterLoadId.value !== id) return
      rosterError.value = err instanceof Error ? err.message : 'Impossible de charger les clientes.'
    } finally {
      if (rosterLoadId.value === id) rosterPending.value = false
    }
  }

  function scheduleRosterSearch(q: string) {
    selectorQuery.value = q
    clearSearchTimeout()
    searchTimeout = setTimeout(() => {
      searchTimeout = null
      void loadRoster(q)
    }, SEARCH_DEBOUNCE_MS)
  }

  async function openSelector() {
    selectorOpen.value = true
    selected.value = new Set()
    selectorQuery.value = ''
    roster.value = []
    rosterNextCursor.value = null
    rosterError.value = null
    await loadRoster('')
  }

  function closeSelector() {
    selectorOpen.value = false
    clearSearchTimeout()
  }

  function toggleSelected(clientProfileId: string) {
    const next = new Set(selected.value)
    if (next.has(clientProfileId)) next.delete(clientProfileId)
    else next.add(clientProfileId)
    selected.value = next
  }

  async function loadMoreRoster() {
    if (rosterPending.value) return
    if (!rosterNextCursor.value) return
    await loadRoster(selectorQuery.value, rosterNextCursor.value)
  }

  async function shareSelected(): Promise<number> {
    const ids = [...selected.value]
    const payload = { clientProfileIds: ids }
    if (ids.length === 0) return 0
    adding.value = true
    try {
      const res = await deps.share(contentId, payload)
      await loadShares()
      selected.value = new Set()
      closeSelector()
      return res.count
    } finally {
      adding.value = false
    }
  }

  async function shareAll(): Promise<number> {
    sharingAll.value = true
    try {
      const res = await deps.share(contentId, { all: true })
      await loadShares()
      return res.count
    } finally {
      sharingAll.value = false
    }
  }

  async function remove(clientProfileId: string): Promise<void> {
    const removedItem = shared.value.find(s => s.clientProfileId === clientProfileId)
    const previous = shared.value
    shared.value = removeSharedClient(shared.value, clientProfileId)
    const nextRemoving = new Set(removing.value)
    nextRemoving.add(clientProfileId)
    removing.value = nextRemoving
    try {
      await deps.unshare(contentId, clientProfileId)
    } catch (err) {
      shared.value = removedItem ? restoreSharedClient(previous, removedItem) : previous
      throw err
    } finally {
      const after = new Set(removing.value)
      after.delete(clientProfileId)
      removing.value = after
    }
  }

  function dispose() {
    clearSearchTimeout()
  }

  return {
    shared,
    pending,
    error,
    sharingAll,
    adding,
    removing,
    selectorOpen,
    selectorQuery,
    selected,
    roster,
    rosterPending,
    rosterError,
    rosterNextCursor,
    sharedIds,
    selectableClients,
    loadShares,
    loadRoster,
    scheduleRosterSearch,
    openSelector,
    closeSelector,
    toggleSelected,
    loadMoreRoster,
    shareSelected,
    shareAll,
    remove,
    dispose
  }
}
