import { ref, watch } from 'vue'
import type {
  ContentItem,
  ContentStatusFilter,
  ContentType,
  ListContentsParams,
  ListContentsResponse
} from './api/contents.contract'
import { mapProviderContentsErrorToMessage } from './api/contents-error'

/**
 * Provider contents list state machine (Story 5.5).
 *
 * Framework-light factory, same pattern as `app/features/pages/createProviderPages.ts`:
 * it imports only `vue` and pure helpers, and takes its transport as a
 * dependency, so the race guards, the filter wiring and the cursor pagination
 * are executed by `tests/contents/create-provider-contents.test.ts`.
 * `useProviderContents.ts` is the Nuxt wrapper that injects the real service.
 */

export const CONTENTS_PAGE_LIMIT = 20
export const CONTENTS_SEARCH_DEBOUNCE_MS = 350

export type ContentsTypeFilter = ContentType | 'all'
export type ContentsStatusFilter = ContentStatusFilter

export interface CreateProviderContentsDependencies {
  list: (params: ListContentsParams) => Promise<ListContentsResponse>
  /** Overridable so the debounce can be observed by a test without waiting 350 ms. */
  debounceMs?: number
}

export function createProviderContents(deps: CreateProviderContentsDependencies) {
  const debounceMs = deps.debounceMs ?? CONTENTS_SEARCH_DEBOUNCE_MS

  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const items = ref<ContentItem[]>([])
  const nextCursor = ref<string | null>(null)

  const searchQuery = ref('')
  const typeFilter = ref<ContentsTypeFilter>('all')
  const statusFilter = ref<ContentsStatusFilter>('all')

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Monotonic token. `refresh()` takes a new one, so a `loadMore()` started
   * before it knows it is stale and drops its page instead of appending rows
   * fetched under the previous query.
   */
  let requestId = 0
  /** Query the current list belongs to, so a stale page can be detected. */
  let activeQueryKey = ''

  function clearSearchTimeout() {
    if (!searchTimeout) return
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  function buildParams(cursor?: string): ListContentsParams {
    const query = searchQuery.value.trim()
    const params: ListContentsParams = { limit: CONTENTS_PAGE_LIMIT }

    if (query.length > 0) params.q = query
    if (typeFilter.value !== 'all') params.type = typeFilter.value
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (cursor) params.cursor = cursor

    return params
  }

  function buildQueryKey(params: ListContentsParams): string {
    return JSON.stringify({
      q: params.q ?? '',
      type: params.type ?? 'all',
      status: params.status ?? 'all'
    })
  }

  async function refresh(): Promise<void> {
    const params = buildParams()
    const key = buildQueryKey(params)
    requestId += 1
    const id = requestId
    activeQueryKey = key

    pending.value = true
    errorMessage.value = null
    loadMoreErrorMessage.value = null
    loadMorePending.value = false

    try {
      const response = await deps.list(params)
      if (requestId !== id) return
      items.value = response.items
      nextCursor.value = response.nextCursor
    } catch (err) {
      if (requestId !== id) return
      errorMessage.value = mapProviderContentsErrorToMessage(err)
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    // A search keystroke is still waiting for its debounce: the list under the
    // new query has not been fetched yet, so "Charger plus" must reload page 1
    // instead of appending a page for a cursor that no longer matches.
    if (searchTimeout) {
      clearSearchTimeout()
      await refresh()
      return
    }

    if (loadMorePending.value || !nextCursor.value) return

    const params = buildParams(nextCursor.value)
    const key = buildQueryKey(params)
    const id = requestId

    loadMorePending.value = true
    loadMoreErrorMessage.value = null

    try {
      const response = await deps.list(params)
      if (requestId !== id || activeQueryKey !== key) return
      items.value = [...items.value, ...response.items]
      nextCursor.value = response.nextCursor
    } catch (err) {
      if (requestId === id && activeQueryKey === key) {
        loadMoreErrorMessage.value = mapProviderContentsErrorToMessage(
          err,
          'Impossible de charger plus de contenus.'
        )
      }
    } finally {
      loadMorePending.value = false
    }
  }

  // One watcher for every filter (retro E4: never pair a `useAsyncData` watch
  // with a manual debounce — this list uses no `useAsyncData` at all). A
  // dropdown change refetches at once; a keystroke waits for the debounce.
  // Watching the three refs together collapses a "reset all filters" (three
  // synchronous writes) into a single request.
  const stopWatching = watch(
    () => ({ q: searchQuery.value, type: typeFilter.value, status: statusFilter.value }),
    (next, previous) => {
      clearSearchTimeout()

      const filterChanged = next.type !== previous.type || next.status !== previous.status
      if (filterChanged) {
        void refresh()
        return
      }

      searchTimeout = setTimeout(() => {
        searchTimeout = null
        void refresh()
      }, debounceMs)
    }
  )

  function dispose() {
    clearSearchTimeout()
    stopWatching()
  }

  return {
    pending,
    errorMessage,
    items,
    nextCursor,
    searchQuery,
    typeFilter,
    statusFilter,
    loadMorePending,
    loadMoreErrorMessage,
    refresh,
    loadMore,
    dispose
  }
}
