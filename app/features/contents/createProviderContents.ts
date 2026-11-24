/**
 * The provider contents list state machine (Story 5.5) now lives in
 * `./createContentsList.ts`, shared with every other contents list.
 *
 * This file stays as the name the page, the composable and the tests import:
 * the implementation moved, the import path did not. Its own behaviour is
 * executed by `tests/contents/create-provider-contents.test.ts`.
 */
export * from './createContentsList'
