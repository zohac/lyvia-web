import { computed, ref, watch } from 'vue'
import type {
  ClientContentListItem,
  ContentType,
  ListClientContentsParams,
  ListClientContentsResponse
} from './api/contents.contract'
import { mapClientContentsErrorToMessage } from './api/client-contents-error'

export const CLIENT_CONTENTS_PAGE_LIMIT = 20
export const CLIENT_CONTENTS_SEARCH_DEBOUNCE_MS = 350

/**
 * `ListClientContentsQueryDto.q` is `@MaxLength(200)`: a longer query is
 * rejected with a `VALIDATION_ERROR` the search box cannot explain. The query
 * is truncated to the contract's bound instead of being sent and refused.
 */
export const CLIENT_CONTENTS_SEARCH_MAX_LENGTH = 200

/**
 * Derived from the contract's `ContentType`, never re-spelled: a new backend
 * enum value must break this type instead of silently missing from the filter.
 */
export type ClientContentsTypeFilter = ContentType | 'all'

export interface CreateClientContentsDependencies {
  list: (params: ListClientContentsParams) => Promise<ListClientContentsResponse>
  debounceMs?: number
}

export function createClientContents(deps: CreateClientContentsDependencies) {
  const debounceMs = deps.debounceMs ?? CLIENT_CONTENTS_SEARCH_DEBOUNCE_MS

  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const items = ref<ClientContentListItem[]>([])
  const nextCursor = ref<string | null>(null)

  const searchQuery = ref('')
  const typeFilter = ref<ClientContentsTypeFilter>('all')

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  let requestId = 0
  /**
   * Owner of the in-flight `loadMore`. `loadMore` does not bump `requestId`
   * (it is not a new query), so a page-1 refresh during a page-2 fetch would
   * otherwise let the stale call clear the flag of a newer one and allow two
   * page-2 fetches of the same cursor to be appended.
   */
  let loadMoreToken = 0

  function clearSearchTimeout() {
    if (!searchTimeout) return
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  function buildParams(cursor?: string): ListClientContentsParams {
    const query = searchQuery.value.trim().slice(0, CLIENT_CONTENTS_SEARCH_MAX_LENGTH)
    const params: ListClientContentsParams = { limit: CLIENT_CONTENTS_PAGE_LIMIT }

    if (query.length > 0) params.q = query
    if (typeFilter.value !== 'all') params.type = typeFilter.value
    if (cursor) params.cursor = cursor

    return params
  }

  const hasActiveFilters = computed(
    () => typeFilter.value !== 'all' || searchQuery.value.trim().length > 0
  )

  function resetFilters(): void {
    searchQuery.value = ''
    typeFilter.value = 'all'
  }

  async function refresh(): Promise<void> {
    clearSearchTimeout()
    const params = buildParams()
    requestId += 1
    const id = requestId

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
      errorMessage.value = mapClientContentsErrorToMessage(err)
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    // A page-2 fetch needs a page 1 that is neither stale nor in flight: during
    // a refresh `nextCursor` still points at the previous query's page 2, and
    // appending it under the new query would mix two result sets.
    if (loadMorePending.value || pending.value || !nextCursor.value) return

    if (searchTimeout) {
      clearSearchTimeout()
      await refresh()
      return
    }

    const params = buildParams(nextCursor.value)
    const id = requestId
    loadMoreToken += 1
    const token = loadMoreToken

    loadMorePending.value = true
    loadMoreErrorMessage.value = null

    try {
      const response = await deps.list(params)
      if (requestId !== id) return
      items.value = [...items.value, ...response.items]
      nextCursor.value = response.nextCursor
    } catch (err) {
      if (requestId === id) {
        loadMoreErrorMessage.value = mapClientContentsErrorToMessage(
          err,
          'Impossible de charger plus de contenus.'
        )
      }
    } finally {
      if (loadMoreToken === token) loadMorePending.value = false
    }
  }

  const stopWatching = watch(
    () => ({ q: searchQuery.value, type: typeFilter.value }),
    (next, previous) => {
      clearSearchTimeout()

      const filterChanged = next.type !== previous.type
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
    hasActiveFilters,
    loadMorePending,
    loadMoreErrorMessage,
    refresh,
    loadMore,
    resetFilters,
    dispose
  }
}
