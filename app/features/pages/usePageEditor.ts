import type { ProviderPageResponse } from './api/pages.contract'
import { createPageEditor } from './createPageEditor'
import {
  publishProviderPage,
  unpublishProviderPage,
  updateProviderPage
} from './services/provider-pages.service'

/**
 * V2.2b/V2.2e — Nuxt wrapper around `createPageEditor`, injecting the real
 * draft and publication transports. Mirrors `useProviderPages` /
 * `createProviderPages`.
 */
export function usePageEditor(page: ProviderPageResponse) {
  return createPageEditor(page, {
    update: updateProviderPage,
    publish: publishProviderPage,
    unpublish: unpublishProviderPage
  })
}
