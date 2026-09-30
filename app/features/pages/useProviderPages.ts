import { createProviderPages } from './createProviderPages'
import { createProviderPage, listProviderPages } from './services/provider-pages.service'

export type {
  CreateProviderPageFailure,
  CreateProviderPageInput,
  CreateProviderPageOutcome,
  CreateProviderPageSuccess
} from './createProviderPages'

/**
 * V2.2a — Nuxt wrapper around `createProviderPages`, injecting the real
 * `apiFetch` transport. Gating and the create modal live in the page.
 */
export function useProviderPages() {
  return createProviderPages({
    list: listProviderPages,
    create: createProviderPage
  })
}
