import type { ContentType, ContentVisibility } from '../api/contents.contract'

export const MAX_CONTENT_TITLE_LENGTH = 200

export const CONTENT_TITLE_REQUIRED_MESSAGE = 'Le titre est obligatoire'
export const CONTENT_TITLE_TOO_LONG_MESSAGE = 'Le titre ne doit pas dépasser 200 caractères.'
export const CONTENT_TYPE_REQUIRED_MESSAGE = 'Le type est obligatoire'
export const CONTENT_SLUG_INVALID_MESSAGE = 'Cette adresse est invalide.'
export const CONTENT_SLUG_TAKEN_MESSAGE = 'Cette adresse est déjà utilisée.'
export const CONTENT_NOT_PUBLISHABLE_MESSAGE = 'Le titre et le contenu sont requis pour publier.'
export const CONTENT_GENERIC_ERROR_MESSAGE = 'Impossible d’enregistrer le contenu. Veuillez réessayer.'

export interface ContentFormInput {
  title: string
  type: ContentType | '' | null | undefined
  slug?: string
  body?: string | null
  coverImageUrl?: string | null
  visibility?: ContentVisibility
}

export interface ContentFormErrors {
  title?: string
  type?: string
  slug?: string
  coverImageUrl?: string
}

export type ContentErrorField = 'title' | 'type' | 'slug' | 'coverImageUrl' | null

export function validateContentForm(input: ContentFormInput): ContentFormErrors {
  const errors: ContentFormErrors = {}

  const trimmedTitle = (input.title ?? '').trim()
  if (trimmedTitle.length === 0) {
    errors.title = CONTENT_TITLE_REQUIRED_MESSAGE
  } else if (trimmedTitle.length > MAX_CONTENT_TITLE_LENGTH) {
    errors.title = CONTENT_TITLE_TOO_LONG_MESSAGE
  }

  if (!input.type) {
    errors.type = CONTENT_TYPE_REQUIRED_MESSAGE
  }

  const slug = (input.slug ?? '').trim()
  if (slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    errors.slug = CONTENT_SLUG_INVALID_MESSAGE
  }

  const url = (input.coverImageUrl ?? '').trim()
  if (url.length > 0) {
    try {
      new URL(url)
    } catch {
      errors.coverImageUrl = 'URL d’image invalide.'
    }
  }

  return errors
}

export function hasContentFormErrors(errors: ContentFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function isContentPublishable(input: { title?: string | null, body?: string | null }): boolean {
  return (input.title ?? '').trim().length > 0 && (input.body ?? '').trim().length > 0
}

export function resolveContentServerError(code: string | null | undefined): {
  field: ContentErrorField
  message: string
} {
  switch (code) {
    case 'SLUG_ALREADY_TAKEN':
      return { field: 'slug', message: CONTENT_SLUG_TAKEN_MESSAGE }
    case 'CONTENT_NOT_PUBLISHABLE':
      return { field: null, message: CONTENT_NOT_PUBLISHABLE_MESSAGE }
    default:
      return { field: null, message: CONTENT_GENERIC_ERROR_MESSAGE }
  }
}
