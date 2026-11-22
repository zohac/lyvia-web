import { onBeforeUnmount } from 'vue'
import { createClientContents } from './createClientContents'
import { listAccessibleContents } from './services/client-contents.service'

/**
 * Nuxt wrapper around the testable list state machine.
 *
 * The behaviour (race guards, filters, cursor pagination) lives in
 * `createClientContents`, which imports only `vue` and is covered by
 * `tests/contents/create-client-contents.test.ts`. This file only injects the
 * authenticated transport and ties teardown to the component lifecycle.
 *
 * Deliberately synchronous: `/client/**` is `ssr: false`, so awaiting the first
 * page here buys nothing but an async `setup`, which renders the page through
 * `<Suspense>` and makes the whole template unreachable by the SSR render
 * harness (`tests/contents/client-content-pages-render.test.ts`). `pending`
 * starts `true`, so the skeleton is still the first paint.
 */
export function useClientContents() {
  const contents = createClientContents({ list: listAccessibleContents })

  onBeforeUnmount(contents.dispose)

  void contents.refresh()

  return contents
}
