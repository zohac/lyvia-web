import { onBeforeUnmount } from 'vue'
import { createProviderContents } from './createProviderContents'
import { listMyContents } from './services/provider-contents.service'

/**
 * Nuxt wrapper around the testable list state machine.
 *
 * The behaviour (race guards, filters, cursor pagination) lives in
 * `createProviderContents`, which imports only `vue` and is covered by
 * `tests/contents/create-provider-contents.test.ts`. This file only injects the
 * authenticated transport and ties teardown to the component lifecycle.
 */
export async function useProviderContents() {
  const contents = createProviderContents({ list: listMyContents })

  onBeforeUnmount(contents.dispose)

  await contents.refresh()

  return contents
}
