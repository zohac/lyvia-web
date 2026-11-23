import { ref, watch } from 'vue'

/**
 * State machine of the client checklist (Story diffusion-7, AC2 and AC3).
 *
 * Same shape as `createContentsList` / `createClientContents`: a framework-light
 * factory importing only `vue`, taking its transport as a dependency, so the
 * debounce, the cursor pagination and the optimistic check with its rollback are
 * **executed** by `tests/contents/create-content-client-checklist.test.ts`.
 * `ContentClientChecklist.vue` only renders this state.
 *
 * The guards are the ones the twin lists carry (retro Epic 5, DR-6/AGG-4):
 * - a monotonic `requestId` so a stale roster response never replaces a fresher
 *   one;
 * - `loadMore()` runs through `load()`, so a second click while a page is in
 *   flight is refused by `loadingMore`, and a page started before a refresh is
 *   dropped by the token instead of being appended.
 */

export interface ChecklistClient {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
}

export interface ChecklistRosterPage {
  items: ChecklistClient[]
  page?: { nextCursor: string | null } | null
}

export interface ChecklistShares {
  items: Array<{ clientProfileId: string }>
}

export interface ChecklistNotice {
  title: string
  color: 'success' | 'error'
}

export interface CreateContentClientChecklistDependencies {
  contentId: string
  listClients: (params: { q?: string, limit: number, cursor?: string }) => Promise<ChecklistRosterPage>
  listShares: () => Promise<ChecklistShares>
  share: (clientProfileId: string) => Promise<unknown>
  unshare: (clientProfileId: string) => Promise<unknown>
  notify: (notice: ChecklistNotice) => void
  /** Overridable so the debounce is observed by a test without waiting 350 ms. */
  debounceMs?: number
  pageSize?: number
}

export const CHECKLIST_PAGE_SIZE = 20
export const CHECKLIST_SEARCH_DEBOUNCE_MS = 350

export const CHECKLIST_LOAD_ERROR_MESSAGE = 'Impossible de charger les clientes.'
export const CHECKLIST_LOAD_MORE_ERROR_MESSAGE = 'Impossible de charger plus de clientes.'
export const CHECKLIST_SHARE_ERROR_MESSAGE = 'Impossible de modifier le partage.'

export function createContentClientChecklist(deps: CreateContentClientChecklistDependencies) {
  const debounceMs = deps.debounceMs ?? CHECKLIST_SEARCH_DEBOUNCE_MS
  const pageSize = deps.pageSize ?? CHECKLIST_PAGE_SIZE

  const query = ref('')
  const items = ref<ChecklistClient[]>([])
  const pending = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const loadMoreError = ref<string | null>(null)
  const nextCursor = ref<string | null>(null)
  const checked = ref<Set<string>>(new Set())
  const toggling = ref<Set<string>>(new Set())

  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  /**
   * Monotonic token. Unlike the list twins, `loadMore()` takes a fresh token by
   * calling `load(cursor)` — one owner for "who is allowed to write this list",
   * so a stale page 2 cannot append, cannot paint an error and cannot clear the
   * loading flag of a newer request.
   */
  let requestId = 0

  function clearSearchTimeout() {
    if (!searchTimeout) return
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  /**
   * Server truth, with the optimistic ticks that are still in flight laid on
   * top. A debounced search re-reads the shares while a `POST …/share` is
   * pending: the server does not know it yet, so a raw replacement would flip
   * the box back and contradict the toast that is about to say "Contenu
   * partagé".
   */
  function reconcileChecked(shared: Array<{ clientProfileId: string }>): Set<string> {
    const next = new Set(shared.map(share => share.clientProfileId))
    for (const clientProfileId of toggling.value) {
      if (checked.value.has(clientProfileId)) next.add(clientProfileId)
      else next.delete(clientProfileId)
    }
    return next
  }

  /**
   * First page (or the next one when `cursor` is given). The shares are read
   * only for page one: `GET …/shares` is not paginated and the checked set is
   * the persisted truth, never derived from the roster page.
   */
  async function load(cursor?: string): Promise<void> {
    clearSearchTimeout()
    const id = ++requestId
    const isFirstPage = !cursor

    if (isFirstPage) {
      pending.value = true
      error.value = null
      loadMoreError.value = null
    } else {
      loadingMore.value = true
    }

    const trimmedQuery = query.value.trim()

    try {
      const [roster, shares] = await Promise.all([
        deps.listClients({
          ...(trimmedQuery.length > 0 ? { q: trimmedQuery } : {}),
          limit: pageSize,
          ...(cursor ? { cursor } : {})
        }),
        isFirstPage ? deps.listShares() : Promise.resolve(null)
      ])
      if (id !== requestId) return

      items.value = isFirstPage ? roster.items : [...items.value, ...roster.items]
      nextCursor.value = roster.page?.nextCursor ?? null
      if (shares) checked.value = reconcileChecked(shares.items)
    } catch {
      if (id !== requestId) return
      if (isFirstPage) {
        error.value = CHECKLIST_LOAD_ERROR_MESSAGE
      } else {
        loadMoreError.value = CHECKLIST_LOAD_MORE_ERROR_MESSAGE
      }
    } finally {
      if (id === requestId) {
        pending.value = false
        loadingMore.value = false
      }
    }
  }

  function loadMore(): Promise<void> {
    // Page 2 needs a page 1 that is neither in flight nor stale; without the
    // token, two clicks append the same cursor twice.
    if (loadingMore.value || pending.value || !nextCursor.value) return Promise.resolve()
    return load(nextCursor.value)
  }

  /**
   * Optimistic toggle: the checkbox follows the click at once, and only a
   * refused call puts it back. A second click on the same row while its call is
   * in flight is ignored (the input is disabled too).
   */
  async function toggle(client: { clientProfileId: string }): Promise<void> {
    const clientProfileId = client.clientProfileId
    if (toggling.value.has(clientProfileId)) return

    const wasChecked = checked.value.has(clientProfileId)

    const optimistic = new Set(checked.value)
    if (wasChecked) optimistic.delete(clientProfileId)
    else optimistic.add(clientProfileId)
    checked.value = optimistic

    toggling.value = new Set(toggling.value).add(clientProfileId)

    try {
      if (wasChecked) {
        await deps.unshare(clientProfileId)
        deps.notify({ title: 'Partage retiré', color: 'success' })
      } else {
        await deps.share(clientProfileId)
        deps.notify({ title: 'Contenu partagé', color: 'success' })
      }
    } catch {
      // Rollback onto the *current* set: another row may have been toggled
      // while this call was in flight, and replacing the whole set with a copy
      // taken before the call would silently undo that one.
      const rollback = new Set(checked.value)
      if (wasChecked) rollback.add(clientProfileId)
      else rollback.delete(clientProfileId)
      checked.value = rollback
      deps.notify({ title: CHECKLIST_SHARE_ERROR_MESSAGE, color: 'error' })
    } finally {
      const stillToggling = new Set(toggling.value)
      stillToggling.delete(clientProfileId)
      toggling.value = stillToggling
    }
  }

  watch(query, () => {
    clearSearchTimeout()
    searchTimeout = setTimeout(() => {
      searchTimeout = null
      void load()
    }, debounceMs)
  })

  function dispose() {
    clearSearchTimeout()
  }

  return {
    query,
    items,
    pending,
    loadingMore,
    error,
    loadMoreError,
    nextCursor,
    checked,
    toggling,
    load,
    loadMore,
    toggle,
    dispose
  }
}
