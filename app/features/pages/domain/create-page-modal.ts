import { slugify } from './slugify'
import { resolveCreatePageSlug, validateCreatePageForm } from './create-page-form'

/**
 * V2.2a — Pure state machine for `ProviderPageCreateModal`.
 *
 * Keeps the slug-tracking and submit-guard wiring out of the component so it is
 * unit-tested without a DOM renderer. The component owns a reactive copy and
 * delegates every transition here.
 */

export interface CreatePageModalState {
  title: string
  slug: string
  /** Set once the coach edits the slug manually; stops auto-derivation. */
  slugTouched: boolean
}

export function createInitialCreatePageModalState(): CreatePageModalState {
  return { title: '', slug: '', slugTouched: false }
}

/**
 * Typing a title auto-fills the slug UNLESS the coach has already touched it.
 */
export function applyCreatePageTitleChange(
  state: CreatePageModalState,
  title: string
): CreatePageModalState {
  if (state.slugTouched) return { ...state, title }
  return { ...state, title, slug: slugify(title) }
}

/**
 * Editing the slug marks it as touched. Clearing it falls back to the title so
 * the displayed value stays consistent with `resolveCreatePageSlug`.
 */
export function applyCreatePageSlugChange(
  state: CreatePageModalState,
  slug: string
): CreatePageModalState {
  if (slug.trim().length === 0) {
    return { ...state, slug: slugify(state.title), slugTouched: false }
  }
  return { ...state, slug, slugTouched: true }
}

export type CreatePageSubmitResult
  = | { kind: 'invalid' }
    | { kind: 'submit', title: string, slug: string }

export function resolveCreatePageSubmit(
  state: CreatePageModalState,
  existingSlugs: readonly string[] = []
): CreatePageSubmitResult {
  const errors = validateCreatePageForm({
    title: state.title,
    slug: state.slug,
    existingSlugs
  })
  if (Object.keys(errors).length > 0) return { kind: 'invalid' }

  return {
    kind: 'submit',
    title: state.title.trim(),
    slug: resolveCreatePageSlug({ title: state.title, slug: state.slug })
  }
}
