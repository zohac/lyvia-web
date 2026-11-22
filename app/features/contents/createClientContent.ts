import { ref } from 'vue'
import type { ClientContentDetail } from './api/contents.contract'
import {
  isClientContentNotFound,
  mapClientContentsErrorToMessage
} from './api/client-contents-error'

/**
 * Reading-page state machine (Story 5.7).
 *
 * The behaviour lives here, not in `app/pages/client/content/[slug].vue`, so it
 * can be executed: the page is `ssr: false`, its setup is synchronous and its
 * branches only run on `onMounted` — a page-only implementation is reachable by
 * the browser gate and by nothing else. Three states are mutually exclusive and
 * must not leak into one another:
 *
 * - `notFound` — the API masked a missing/unreadable content (404
 *   `CONTENT_NOT_FOUND`). It is a dedicated surface, not a retryable error: a
 *   « Réessayer » button on a permanent 404 is a loop.
 * - `errorMessage` — anything else (network, 5xx, 401, broken account). It is
 *   retryable.
 * - `content` — the readable content.
 */
export const CLIENT_CONTENT_LOAD_ERROR = 'Impossible de charger le contenu.'

export interface CreateClientContentDependencies {
  load: (slug: string) => Promise<ClientContentDetail>
}

export function createClientContent(deps: CreateClientContentDependencies) {
  // The page mounts before the first request: starting `pending` at `true`
  // keeps the skeleton as the first paint instead of an empty page.
  const pending = ref(true)
  const notFound = ref(false)
  const errorMessage = ref<string | null>(null)
  const content = ref<ClientContentDetail | null>(null)

  /**
   * A slug change starts a second load while the first is still in flight; the
   * slower response must never overwrite the newer slug's content.
   */
  let requestId = 0

  async function load(slug: string): Promise<void> {
    requestId += 1
    const id = requestId

    pending.value = true
    notFound.value = false
    errorMessage.value = null
    content.value = null

    try {
      const data = await deps.load(slug)
      if (requestId !== id) return
      content.value = data
    } catch (err) {
      if (requestId !== id) return
      if (isClientContentNotFound(err)) {
        notFound.value = true
      } else {
        errorMessage.value = mapClientContentsErrorToMessage(err, CLIENT_CONTENT_LOAD_ERROR)
      }
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  return { pending, notFound, errorMessage, content, load }
}
