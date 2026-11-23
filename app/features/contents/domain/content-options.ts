import type { ContentAudience, ContentStatusFilter, ContentType } from '../api/contents.contract'

/**
 * Select vocabularies for the provider content screens.
 *
 * One source for the labels the list filters and both forms show: the same
 * type list was previously written twice in the pages and once in the story,
 * which is how a label drifts from the enum it renders.
 */

export interface ContentSelectOption<T> {
  label: string
  value: T
}

export const CONTENT_TYPE_OPTIONS: ContentSelectOption<ContentType>[] = [
  { label: 'Article', value: 'article' },
  { label: 'Recette', value: 'recette' },
  { label: 'Actualité', value: 'actualite' }
]

export const CONTENT_TYPE_FILTER_OPTIONS: ContentSelectOption<ContentType | 'all'>[] = [
  { label: 'Tous les types', value: 'all' },
  ...CONTENT_TYPE_OPTIONS
]

export const CONTENT_STATUS_FILTER_OPTIONS: ContentSelectOption<ContentStatusFilter>[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' }
]

export const CONTENT_AUDIENCE_OPTIONS: ContentSelectOption<ContentAudience>[] = [
  { label: 'Toutes mes clientes', value: 'all' },
  { label: 'Clientes choisies', value: 'selected' }
]

/**
 * The Diffusion filter of the contents list. Its "no filter" sentinel is `any`,
 * never `all` — `all` is a *value* of the `audience` enum, and a filter that
 * sent `audience=all` would ask for the `all` audience instead of asking for
 * everything. Every non-sentinel value is forwarded verbatim as `?audience=`,
 * so it must be one of `ContentAudience` (`ListContentsQueryDto` is
 * `@IsIn(['all','selected'])`).
 */
export type ContentDiffusionFilter = 'any' | ContentAudience

export const CONTENT_DIFFUSION_FILTER_OPTIONS: ContentSelectOption<ContentDiffusionFilter>[] = [
  { label: 'Toutes les diffusions', value: 'any' },
  { label: 'Toutes mes clientes', value: 'all' },
  { label: 'Clientes choisies', value: 'selected' }
]
