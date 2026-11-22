import { ref, watch } from 'vue'
import type {
  ClientContentListItem,
  ListClientContentsParams,
  ListClientContentsResponse
} from './api/contents.contract'
import { mapClientContentsErrorToMessage } from './api/client-contents-error'

export const CLIENT_CONTENTS_PAGE_LIMIT = 20
export const CLIENT_CONTENTS_SEARCH_DEBOUNCE_MS = 350

export type ClientContentsTypeFilter = 'article' | 'recette' | 'actualite' | 'all'

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
  let activeQueryKey = ''

  function clearSearchTimeout() {
    if (!searchTimeout) return
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  function buildParams(cursor?: string): ListClientContentsParams {
    const query = searchQuery.value.trim()
    const params: ListClientContentsParams = { limit: CLIENT_CONTENTS_PAGE_LIMIT }

    if (query.length > 0) params.q = query
    if (typeFilter.value !== 'all') params.type = typeFilter.value
    if (cursor) params.cursor = cursor

    return params
  }

  function buildQueryKey(params: ListClientContentsParams): string {
    return JSON.stringify({
      q: params.q ?? '',
      type: params.type ?? 'all'
    })
  }

  async function refresh(): Promise<void> {
    clearSearchTimeout()
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
      errorMessage.value = mapClientContentsErrorToMessage(err)
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (loadMorePending.value || !nextCursor.value) return

    if (searchTimeout) {
      clearSearchTimeout()
      await refresh()
      return
    }

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
        loadMoreErrorMessage.value = mapClientContentsErrorToMessage(
          err,
          'Impossible de charger plus de contenus.'
        )
      }
    } finally {
      loadMorePending.value = false
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
    loadMorePending,
    loadMoreErrorMessage,
    refresh,
    loadMore,
    dispose
  }
}
