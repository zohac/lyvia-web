import type { ContentItem, ContentType, ContentStatusFilter, ListContentsParams } from './api/contents.contract'
import { mapProviderContentsErrorToMessage } from './api/contents-error'
import { listMyContents } from './services/provider-contents.service'

const PAGE_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 350

type TypeFilter = ContentType | 'all'
type StatusFilter = ContentStatusFilter

export async function useProviderContents() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const items = ref<ContentItem[]>([])
  const nextCursor = ref<string | null>(null)

  const searchQuery = ref('')
  const typeFilter = ref<TypeFilter>('all')
  const statusFilter = ref<StatusFilter>('all')

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  const requestId = ref(0)
  const activeQueryKey = ref('')

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  function clearSearchTimeout() {
    if (!searchTimeout) return
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  function buildParams(cursor?: string): ListContentsParams {
    const query = searchQuery.value.trim()
    const params: ListContentsParams = { limit: PAGE_LIMIT }

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

  async function refresh() {
    const params = buildParams()
    const key = buildQueryKey(params)
    const id = requestId.value + 1
    requestId.value = id
    activeQueryKey.value = key

    pending.value = true
    errorMessage.value = null
    loadMoreErrorMessage.value = null

    try {
      const response = await listMyContents(params)
      if (requestId.value !== id) return
      items.value = response.items
      nextCursor.value = response.nextCursor
    } catch (err) {
      if (requestId.value !== id) return
      errorMessage.value = mapProviderContentsErrorToMessage(err)
    } finally {
      if (requestId.value === id) pending.value = false
    }
  }

  async function loadMore() {
    if (loadMorePending.value) return
    if (!nextCursor.value) return

    const params = buildParams(nextCursor.value)
    const key = buildQueryKey(params)

    loadMorePending.value = true
    loadMoreErrorMessage.value = null

    try {
      const response = await listMyContents(params)
      if (activeQueryKey.value !== key) return
      items.value = [...items.value, ...response.items]
      nextCursor.value = response.nextCursor
    } catch (err) {
      if (activeQueryKey.value === key) {
        loadMoreErrorMessage.value = mapProviderContentsErrorToMessage(
          err,
          'Impossible de charger plus de contenus.'
        )
      }
    } finally {
      loadMorePending.value = false
    }
  }

  watch(
    () => searchQuery.value,
    () => {
      if (import.meta.server) return
      clearSearchTimeout()
      searchTimeout = setTimeout(() => {
        refresh()
      }, SEARCH_DEBOUNCE_MS)
    }
  )

  watch(
    () => typeFilter.value,
    () => {
      if (import.meta.server) return
      clearSearchTimeout()
      refresh()
    }
  )

  watch(
    () => statusFilter.value,
    () => {
      if (import.meta.server) return
      clearSearchTimeout()
      refresh()
    }
  )

  onBeforeUnmount(() => {
    clearSearchTimeout()
  })

  await refresh()

  return {
    pending,
    errorMessage,
    items,
    nextCursor,
    searchQuery,
    typeFilter,
    statusFilter,
    refresh,
    loadMore,
    loadMorePending,
    loadMoreErrorMessage
  }
}
