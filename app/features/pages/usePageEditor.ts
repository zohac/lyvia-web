import type { ProviderPageResponse } from './api/pages.contract'
import { createPageEditor } from './createPageEditor'
import { updateProviderPage } from './services/provider-pages.service'

/**
 * V2.2b — Nuxt wrapper around `createPageEditor`, injecting the real `PUT`
 * transport. Mirrors `useProviderPages` / `createProviderPages`.
 */
export function usePageEditor(page: ProviderPageResponse) {
  return createPageEditor(page, { update: updateProviderPage })
}
