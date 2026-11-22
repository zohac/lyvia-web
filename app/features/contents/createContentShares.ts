import { ref, computed } from 'vue'
import type {
  ContentShareItem,
  ContentVisibility,
  ListContentSharesResponse,
  ShareContentRequest,
  ShareContentResponse
} from './api/contents.contract'
import type { ListProviderClientsParams, ListProviderClientsResponse, ProviderClientListItem } from '../clients/api/clients.contract'
import { mapProviderContentsErrorToMessage } from './api/contents-error'
import { mapProviderClientsErrorToMessage } from '../clients/api/clients-error'
import {
  buildShareSelectedPayload,
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

export interface ContentSharesOptions {
  /**
   * Delay between a keystroke and the roster request. Injectable so a test can
   * observe the debounce (one request for a burst of keystrokes) instead of
   * asserting that the query string was merely stored.
   */
  debounceMs?: number
  rosterLimit?: number
}

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_ROSTER_LIMIT = 20

const SHARES_ERROR_MESSAGE = 'Impossible de charger les partages.'
const ROSTER_ERROR_MESSAGE = 'Impossible de charger la liste des clientes.'

/**
 * State and behaviour of the content-sharing section (Story 5.6).
 *
 * The component owns only the rendering: every decision (when to load, what to
 * exclude, what a mutation does to the list) lives here so the unit tests can
 * execute it without a DOM. `applyVisibility` in particular exists because the
 * section is mounted once for the whole edit page: a `private` → `public` →
 * `private` round-trip must re-fetch, and a `public` → `private` switch must not
 * display the empty list it never loaded.
 */
export function createContentShares(
  deps: ContentSharesDeps,
  contentId: string,
  options: ContentSharesOptions = {}
) {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const rosterLimit = options.rosterLimit ?? DEFAULT_ROSTER_LIMIT

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

  let sharesLoadId = 0
  let lastVisibility: ContentVisibility | null = null

  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  function clearSearchTimeout() {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }

  const selectableClients = computed(() =>
    filterSelectableClients(roster.value, shared.value, selectorQuery.value)
  )

  async function loadShares() {
    const id = ++sharesLoadId
    pending.value = true
    error.value = null
    try {
      const res = await deps.listShares(contentId)
      if (sharesLoadId !== id) return
      shared.value = [...res.items].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
    } catch (err) {
      if (sharesLoadId !== id) return
      // The API answers in English: never surface `err.message` to the provider.
      error.value = mapProviderContentsErrorToMessage(err, SHARES_ERROR_MESSAGE)
    } finally {
      if (sharesLoadId === id) pending.value = false
    }
  }

  /**
   * Called on mount and on every `visibility` change of the edited content.
   * Loads once when the content is (or becomes) private; a return to private
   * after a public spell re-fetches instead of showing the list of a bygone
   * state, and a repeated `private` does not issue a second request.
   */
  async function applyVisibility(visibility: ContentVisibility) {
    const previous = lastVisibility
    lastVisibility = visibility
    if (visibility !== 'private') return
    if (previous === 'private') return
    await loadShares()
  }

  async function loadRoster(query?: string, cursor?: string) {
    const id = ++rosterLoadId.value
    rosterPending.value = true
    rosterError.value = null
    // A page-2 cursor belongs to the query that produced it: dropping it before
    // the request keeps "Charger plus" from appending another query's page.
    if (!cursor) rosterNextCursor.value = null
    try {
      const params: ListProviderClientsParams = { limit: rosterLimit }
      const q = (query ?? selectorQuery.value).trim()
      if (q) params.q = q
      if (cursor) params.cursor = cursor
      const res = await deps.listClients(params)
      if (rosterLoadId.value !== id) return
      roster.value = cursor ? [...roster.value, ...res.items] : res.items
      rosterNextCursor.value = res.page.nextCursor
    } catch (err) {
      if (rosterLoadId.value !== id) return
      rosterError.value = mapProviderClientsErrorToMessage(err, ROSTER_ERROR_MESSAGE)
    } finally {
      if (rosterLoadId.value === id) rosterPending.value = false
    }
  }

  function scheduleRosterSearch(q: string) {
    if (q !== selectorQuery.value) {
      selectorQuery.value = q
      // A page-2 cursor belongs to the query that produced it: "Charger plus"
      // clicked during the debounce window would otherwise append another
      // query's page onto the new one.
      rosterNextCursor.value = null
    }
    clearSearchTimeout()
    searchTimeout = setTimeout(() => {
      searchTimeout = null
      void loadRoster(q)
    }, debounceMs)
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
    const payload = buildShareSelectedPayload([...selected.value])
    if (!payload || adding.value) return 0
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
    if (sharingAll.value) return 0
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
    // A second click must not issue a second DELETE for the same client: the
    // button only reaches its disabled state on the next render.
    if (removing.value.has(clientProfileId)) return
    const removedItem = shared.value.find(s => s.clientProfileId === clientProfileId)
    shared.value = removeSharedClient(shared.value, clientProfileId)
    const nextRemoving = new Set(removing.value)
    nextRemoving.add(clientProfileId)
    removing.value = nextRemoving
    try {
      await deps.unshare(contentId, clientProfileId)
    } catch (err) {
      // Restore into the CURRENT list: re-installing an older snapshot would
      // resurrect a client another in-flight removal had just unshared.
      shared.value = removedItem ? restoreSharedClient(shared.value, removedItem) : shared.value
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
    selectableClients,
    loadShares,
    applyVisibility,
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
