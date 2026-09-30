/**
 * V2.2a — Pure view-selection rules for the `/provider/pages` screen.
 *
 * Extracted from the page so the gating short-circuit and the
 * loading/error/empty/list branch selection are unit-tested without mounting
 * Vue. The page only maps the returned state to components.
 */

export type ProviderPagesViewState = 'locked' | 'loading' | 'error' | 'empty' | 'list'

export interface ProviderPagesViewInput {
  /** Whether the plan carries `page_builder` (gate resolved + feature present). */
  unlocked: boolean
  pending: boolean
  /** Whether at least one successful list load has happened. */
  loaded: boolean
  errorMessage: string | null
  pageCount: number
}

/**
 * Locked sessions must never hit `/provider/pages`; the page feeds this into
 * its gate watcher before calling `load()`.
 */
export function shouldLoadProviderPages(unlocked: boolean): boolean {
  return unlocked
}

export function resolveProviderPagesViewState(input: ProviderPagesViewInput): ProviderPagesViewState {
  if (!input.unlocked) return 'locked'
  if (input.pending) return 'loading'
  if (input.errorMessage) return 'error'
  if (!input.loaded) return 'loading'
  return input.pageCount === 0 ? 'empty' : 'list'
}
