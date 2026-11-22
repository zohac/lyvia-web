import type { ContentStatusFilter, ContentType, ContentVisibility } from '../api/contents.contract'

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

export const CONTENT_VISIBILITY_OPTIONS: ContentSelectOption<ContentVisibility>[] = [
  { label: 'Public', value: 'public' },
  { label: 'Privé', value: 'private' }
]
