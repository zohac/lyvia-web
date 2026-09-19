import { isReservedPageSlug, isValidPageSlug, slugify } from './slugify'
import { PAGE_LIMIT_REACHED_MESSAGE } from './page-limits'

/**
 * V2.2a — Pure create-page form logic (validation + server error mapping).
 *
 * Kept out of the modal component so the rules are unit-tested without a DOM
 * renderer. The backend stays authoritative; these checks are fail-fast UX.
 */

/** Mirror of the API `MAX_PAGE_TITLE_LENGTH` (`page-limits.ts`). */
export const MAX_PAGE_TITLE_LENGTH = 300

export const CREATE_PAGE_TITLE_REQUIRED_MESSAGE = 'Le titre est obligatoire'
export const CREATE_PAGE_TITLE_TOO_LONG_MESSAGE = 'Le titre ne doit pas dépasser 300 caractères.'
export const CREATE_PAGE_SLUG_INVALID_MESSAGE = 'Cette adresse est invalide.'
/**
 * The API raises `PAGE_SLUG_RESERVED` for ANY slug unique violation (reserved
 * list OR already taken), so the copy must cover both cases.
 */
export const CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE = 'Cette adresse est réservée ou déjà utilisée.'
export const CREATE_PAGE_GENERIC_ERROR_MESSAGE = 'Impossible de créer la page. Veuillez réessayer.'

export interface CreatePageFormInput {
  title: string
  slug: string
  /** Slugs already used by the provider (from the loaded list). */
  existingSlugs?: readonly string[]
}

export interface CreatePageFormErrors {
  title?: string
  slug?: string
}

export type CreatePageErrorField = 'title' | 'slug' | null

/**
 * Resolves the slug that will actually be submitted: an explicit user slug
 * wins, otherwise it is derived from the title.
 */
export function resolveCreatePageSlug(input: Pick<CreatePageFormInput, 'title' | 'slug'>): string {
  const explicit = input.slug.trim()
  if (explicit.length > 0) return explicit
  return slugify(input.title)
}

export function validateCreatePageForm(input: CreatePageFormInput): CreatePageFormErrors {
  const errors: CreatePageFormErrors = {}

  const trimmedTitle = input.title.trim()
  if (trimmedTitle.length === 0) {
    errors.title = CREATE_PAGE_TITLE_REQUIRED_MESSAGE
  } else if (trimmedTitle.length > MAX_PAGE_TITLE_LENGTH) {
    errors.title = CREATE_PAGE_TITLE_TOO_LONG_MESSAGE
  }

  const slug = resolveCreatePageSlug(input)
  if (!isValidPageSlug(slug)) {
    errors.slug = CREATE_PAGE_SLUG_INVALID_MESSAGE
  } else if (isReservedPageSlug(slug) || input.existingSlugs?.includes(slug)) {
    errors.slug = CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE
  }

  return errors
}

/**
 * Maps an API error code from `POST /provider/pages` to a field-level message.
 * Unknown codes fall back to a generic message (the global 403
 * FEATURE_NOT_AVAILABLE toast is handled by `apiFetch`).
 */
export function resolveCreatePageServerError(code: string | null | undefined): {
  field: CreatePageErrorField
  message: string
} {
  switch (code) {
    case 'PAGE_LIMIT_REACHED':
      return { field: null, message: PAGE_LIMIT_REACHED_MESSAGE }
    case 'PAGE_SLUG_RESERVED':
      return { field: 'slug', message: CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE }
    case 'PAGE_SLUG_INVALID':
      return { field: 'slug', message: CREATE_PAGE_SLUG_INVALID_MESSAGE }
    case 'PAGE_CONTENT_INVALID':
      return { field: 'title', message: CREATE_PAGE_TITLE_TOO_LONG_MESSAGE }
    default:
      return { field: null, message: CREATE_PAGE_GENERIC_ERROR_MESSAGE }
  }
}
