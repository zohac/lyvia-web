import type { ListProviderClientsParams, ProviderClientListItem, ProviderClientStatus } from './api/clients.contract'
import { mapProviderClientsErrorToMessage } from './api/clients-error'
import { listProviderClients } from './services/provider-clients.service'

const PAGE_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 350

type ProviderClientStatusFilter = ProviderClientStatus | 'all'

function buildQueryKey(params: { q?: string, status?: ProviderClientStatus }): string {
  return JSON.stringify({
    q: params.q ?? '',
    status: params.status ?? 'all'
  })
}

export async function useProviderClients() {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const clients = ref<ProviderClientListItem[]>([])
  const nextCursor = ref<string | null>(null)

  const searchQuery = ref('')
  const statusFilter = ref<ProviderClientStatusFilter>('all')

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

  function buildParams(cursor?: string): ListProviderClientsParams {
    const query = searchQuery.value.trim()
    const params: ListProviderClientsParams = { limit: PAGE_LIMIT }

    if (query.length > 0) params.q = query
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (cursor) params.cursor = cursor

    return params
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
      const response = await listProviderClients(params)
      if (requestId.value !== id) return
      clients.value = response.items
      nextCursor.value = response.page.nextCursor
    } catch (err) {
      if (requestId.value !== id) return
      errorMessage.value = mapProviderClientsErrorToMessage(err)
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
      const response = await listProviderClients(params)
      if (activeQueryKey.value !== key) return
      clients.value = [...clients.value, ...response.items]
      nextCursor.value = response.page.nextCursor
    } catch (err) {
      if (activeQueryKey.value === key) {
        loadMoreErrorMessage.value = mapProviderClientsErrorToMessage(
          err,
          'Impossible de charger plus de clientes.'
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
    clients,
    nextCursor,
    searchQuery,
    statusFilter,
    refresh,
    loadMore,
    loadMorePending,
    loadMoreErrorMessage
  }
}
