import { computed, ref } from 'vue'
import type { ProviderPageListItem } from './api/pages.contract'
import { PAGE_LIMIT_REACHED_MESSAGE, isPageLimitReached } from './domain/page-limits'
import {
  resolveCreatePageServerError,
  type CreatePageErrorField
} from './domain/create-page-form'

/**
 * V2.2a — List state + create orchestration for `/provider/pages`.
 *
 * Framework-light factory (same pattern as `plans/createFeatureGate.ts`): it
 * imports only `vue` and pure domain helpers, so the behaviour is unit-tested
 * with the Node runner. `useProviderPages.ts` is the Nuxt wrapper that injects
 * the real transport.
 */

export interface CreateProviderPageInput {
  title: string
  slug: string
}

export interface CreateProviderPageFailure {
  ok: false
  field: CreatePageErrorField
  message: string
  code: string | null
}

export interface CreateProviderPageSuccess {
  ok: true
  /** `true` when the page was created but the list reload failed afterwards. */
  reloadFailed: boolean
}

export type CreateProviderPageOutcome = CreateProviderPageSuccess | CreateProviderPageFailure

export interface CreateProviderPagesDependencies {
  list: () => Promise<ProviderPageListItem[]>
  create: (input: CreateProviderPageInput) => Promise<unknown>
}

/**
 * Reads the error code off an `ApiFetchError`-shaped object without importing
 * the transport (keeps the factory testable and framework-free).
 */
function getApiErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const apiError = (error as { apiError?: unknown }).apiError
  if (!apiError || typeof apiError !== 'object') return null
  const code = (apiError as { code?: unknown }).code
  return typeof code === 'string' ? code : null
}

export function createProviderPages(deps: CreateProviderPagesDependencies) {
  const pages = ref<ProviderPageListItem[]>([])
  const pending = ref(false)
  const loaded = ref(false)
  const errorMessage = ref<string | null>(null)
  const creating = ref(false)

  // Monotonic token: only the most recent `load()` may apply its response.
  let requestId = 0

  const isLimitReached = computed(() => isPageLimitReached(pages.value.length))
  const existingSlugs = computed(() => pages.value.map(page => page.slug))

  async function load(): Promise<boolean> {
    const id = requestId + 1
    requestId = id
    pending.value = true
    errorMessage.value = null

    try {
      const result = await deps.list()
      if (requestId !== id) return false
      pages.value = result
      loaded.value = true
      return true
    } catch {
      if (requestId !== id) return false
      errorMessage.value = 'Impossible de charger vos pages.'
      return false
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function createPage(input: CreateProviderPageInput): Promise<CreateProviderPageOutcome> {
    if (isLimitReached.value) {
      return {
        ok: false,
        field: null,
        message: PAGE_LIMIT_REACHED_MESSAGE,
        code: 'PAGE_LIMIT_REACHED'
      }
    }

    creating.value = true
    try {
      await deps.create(input)
      const refreshed = await load()
      return { ok: true, reloadFailed: !refreshed }
    } catch (error: unknown) {
      const code = getApiErrorCode(error)
      const mapped = resolveCreatePageServerError(code)
      return { ok: false, field: mapped.field, message: mapped.message, code }
    } finally {
      creating.value = false
    }
  }

  return {
    pages,
    pending,
    loaded,
    errorMessage,
    creating,
    isLimitReached,
    existingSlugs,
    load,
    createPage
  }
}

export type ProviderPages = ReturnType<typeof createProviderPages>
