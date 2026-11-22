import type { ContentType, ContentVisibility } from '../api/contents.contract'

export const MAX_CONTENT_TITLE_LENGTH = 200

export const CONTENT_TITLE_REQUIRED_MESSAGE = 'Le titre est obligatoire.'
export const CONTENT_TITLE_TOO_LONG_MESSAGE = `Le titre ne doit pas dépasser ${MAX_CONTENT_TITLE_LENGTH} caractères.`
export const CONTENT_TYPE_REQUIRED_MESSAGE = 'Le type est obligatoire.'
export const CONTENT_SLUG_INVALID_MESSAGE = 'Cette adresse est invalide. Utilisez des minuscules, des chiffres et des tirets.'
export const CONTENT_SLUG_TAKEN_MESSAGE = 'Cette adresse est déjà utilisée.'
export const CONTENT_NOT_PUBLISHABLE_MESSAGE = 'Le titre et le contenu sont requis pour publier.'
export const CONTENT_GENERIC_ERROR_MESSAGE = 'Impossible d’enregistrer le contenu. Veuillez réessayer.'
export const CONTENT_VALIDATION_ERROR_MESSAGE = 'Certains champs sont invalides. Vérifiez votre saisie.'
export const CONTENT_NOT_FOUND_MESSAGE = 'Ce contenu est introuvable.'
export const CONTENT_FORBIDDEN_MESSAGE = 'Accès refusé.'
export const CONTENT_COVER_IMAGE_INVALID_MESSAGE = 'URL d’image invalide. Utilisez une adresse http(s).'

/**
 * Mirrors the server slugs (`lyvia-api/src/features/contents/domain/content-slug.ts`
 * → `CONTENT_SLUG_PATTERN`). Lowercase only on purpose: a case-insensitive
 * pattern here would let `MonArticle` through to a server 422 the form cannot
 * attribute to a field.
 */
const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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
  if (slug.length > 0 && !CONTENT_SLUG_PATTERN.test(slug)) {
    errors.slug = CONTENT_SLUG_INVALID_MESSAGE
  }

  const url = (input.coverImageUrl ?? '').trim()
  if (url.length > 0 && !isHttpUrl(url)) {
    errors.coverImageUrl = CONTENT_COVER_IMAGE_INVALID_MESSAGE
  }

  return errors
}

/**
 * The server validates `coverImageUrl` with `@IsUrl()` (http/https only), so a
 * `data:` or `javascript:` address must be refused here too instead of coming
 * back as an unattributable 422.
 */
function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
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
    case 'VALIDATION_ERROR':
      return { field: null, message: CONTENT_VALIDATION_ERROR_MESSAGE }
    case 'CONTENT_NOT_FOUND':
      return { field: null, message: CONTENT_NOT_FOUND_MESSAGE }
    case 'FORBIDDEN':
      return { field: null, message: CONTENT_FORBIDDEN_MESSAGE }
    default:
      return { field: null, message: CONTENT_GENERIC_ERROR_MESSAGE }
  }
}
