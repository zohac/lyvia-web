import type { UpdateProviderPageRequest } from './pages.contract'

export interface UpdateProviderPageCall {
  path: string
  options: {
    method: 'PUT'
    withAuth: true
    body: UpdateProviderPageRequest
  }
}

/**
 * V2.2b — Pure request builder for the page draft PUT.
 *
 * Extracted from the transport so the path/method/body contract is covered by
 * the Node test runner: the service itself imports Nuxt-bound `apiFetch` and
 * cannot be executed in `tests/`, so a wrong method or path would otherwise
 * ship green (VG-1).
 */
export function buildUpdateProviderPageCall(
  id: string,
  payload: UpdateProviderPageRequest
): UpdateProviderPageCall {
  return {
    path: `/provider/pages/${id}`,
    options: { method: 'PUT', withAuth: true, body: payload }
  }
}
