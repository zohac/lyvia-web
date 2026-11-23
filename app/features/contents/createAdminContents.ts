import { ref, watch } from 'vue'
import type {
  AdminContentItem,
  AdminContentStatusFilter,
  ListAdminContentsParams,
  ListAdminContentsResponse
} from './api/admin-contents.contract'
import { mapProviderContentsErrorToMessage } from './api/contents-error'

export const ADMIN_CONTENTS_PAGE_LIMIT = 20

export interface CreateAdminContentsDependencies {
  list: (params: ListAdminContentsParams) => Promise<ListAdminContentsResponse>
}

/**
 * Admin platform-article list state machine (Story diffusion-10).
 *
 * Same shape as the provider/client list machines: framework-light, transport
 * injected, and every race guard executed by `tests/contents/admin-contents.test.ts`.
 * The status filter is the only filter the admin endpoint declares; there is no
 * search and no audience filter on `/admin/content`.
 */
export function createAdminContents(deps: CreateAdminContentsDependencies) {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const items = ref<AdminContentItem[]>([])
  const nextCursor = ref<string | null>(null)
  const statusFilter = ref<AdminContentStatusFilter>('all')

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  /** Monotonic token: a response from a previous query is dropped. */
  let requestId = 0
  /** Query the current list belongs to, so a stale page cannot be appended. */
  let activeQueryKey = ''
  /** Owner of the in-flight `loadMore` (it does not bump `requestId`). */
  let loadMoreToken = 0

  function buildParams(cursor?: string): ListAdminContentsParams {
    const params: ListAdminContentsParams = { limit: ADMIN_CONTENTS_PAGE_LIMIT }
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (cursor) params.cursor = cursor
    return params
  }

  function buildQueryKey(params: ListAdminContentsParams): string {
    return JSON.stringify({ status: params.status ?? 'all' })
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
      errorMessage.value = mapProviderContentsErrorToMessage(
        err,
        'Impossible de charger les articles. Veuillez réessayer.'
      )
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    // A page-2 fetch needs a page 1 that is neither stale nor in flight.
    if (loadMorePending.value || pending.value || !nextCursor.value) return

    const params = buildParams(nextCursor.value)
    const key = buildQueryKey(params)
    const id = requestId
    loadMoreToken += 1
    const token = loadMoreToken

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
          'Impossible de charger plus d’articles.'
        )
      }
    } finally {
      if (loadMoreToken === token) loadMorePending.value = false
    }
  }

  // A status change refetches at once; watching the ref collapses a programmatic
  // reset into a single request. No `useAsyncData` here (retro E4).
  const stopWatching = watch(statusFilter, () => {
    void refresh()
  })

  function dispose() {
    stopWatching()
  }

  return {
    pending,
    errorMessage,
    items,
    nextCursor,
    statusFilter,
    loadMorePending,
    loadMoreErrorMessage,
    refresh,
    loadMore,
    dispose
  }
}
