import {
  ADMIN_CONTENT_TYPE,
  type CreateAdminContentRequest,
  type UpdateAdminContentRequest
} from '../api/admin-contents.contract'
import {
  resolveContentServerError,
  validateContentForm,
  type ContentFormErrors
} from './content-form'

/**
 * Admin-only rules for platform articles (Story diffusion-10).
 *
 * The backend accepts a single type (`article`) and owns approbations; there is
 * deliberately no audience, document or free URL field here. Payload builders
 * are pure so the DTO → request mapping is executed by a test instead of being
 * an inline list a reviewer can only read.
 */

export { ADMIN_CONTENT_TYPE }

/** Exact wording required by interfaces.md §4 and the story's intent contract. */
export const ADMIN_CONTENT_PUBLISHED_LABEL
  = 'Publié — visible des clientes des praticiennes qui l’ont approuvé.'
export const ADMIN_CONTENT_DRAFT_LABEL = 'Brouillon — non visible des clientes.'

export type AdminContentStatusBadge = { color: 'success' | 'neutral', label: string }

export function getAdminStatusBadge(isPublished: boolean): AdminContentStatusBadge {
  return isPublished
    ? { color: 'success', label: 'Publié' }
    : { color: 'neutral', label: 'Brouillon' }
}

/** The published state must always carry its scope, in the list and the editor. */
export function getAdminStatusScopeLabel(isPublished: boolean): string {
  return isPublished ? ADMIN_CONTENT_PUBLISHED_LABEL : ADMIN_CONTENT_DRAFT_LABEL
}

export function formatAdminApprovalCount(count: number): string {
  return count === 1 ? '1 praticienne' : `${count} praticiennes`
}

export interface AdminContentFormInput {
  title: string
  slug?: string
  body?: string | null
  coverImageUrl?: string | null
}

export interface AdminContentOriginal {
  title: string
  slug: string
  body: string | null
  coverImageUrl: string | null
}

/** Validation is shared with the provider form; `type` is supplied, never asked. */
export function validateAdminContentForm(input: AdminContentFormInput): ContentFormErrors {
  return validateContentForm({
    title: input.title,
    type: ADMIN_CONTENT_TYPE,
    slug: input.slug,
    body: input.body,
    coverImageUrl: input.coverImageUrl
  })
}

function trimmed(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function buildCreateAdminContentPayload(
  input: AdminContentFormInput
): CreateAdminContentRequest {
  const payload: CreateAdminContentRequest = {
    title: trimmed(input.title),
    type: ADMIN_CONTENT_TYPE
  }

  const slug = trimmed(input.slug)
  if (slug.length > 0) payload.slug = slug

  const body = trimmed(input.body)
  if (body.length > 0) payload.body = body

  // The cover URL is produced by the upload field, never typed. An empty value
  // is omitted instead of sent as an invalid URL the server would refuse.
  const coverImageUrl = trimmed(input.coverImageUrl)
  if (coverImageUrl.length > 0) payload.coverImageUrl = coverImageUrl

  return payload
}

/**
 * PATCH carrying only real changes. A cleared body or cover is sent as `null`
 * (the update DTO's "clear" value); a field left untouched is not sent at all.
 * `type` is never sent: it is fixed to `article` on the server row.
 */
export function buildUpdateAdminContentPayload(
  input: AdminContentFormInput,
  original: AdminContentOriginal
): UpdateAdminContentRequest {
  const payload: UpdateAdminContentRequest = {}

  // An *absent* field means "untouched"; an explicit empty string means "clear".
  // Collapsing the two would clear the body or cover on a partial PATCH.
  if (input.title !== undefined) {
    const title = trimmed(input.title)
    if (title !== trimmed(original.title)) payload.title = title
  }

  if (input.slug !== undefined) {
    const slug = trimmed(input.slug)
    if (slug.length > 0 && slug !== trimmed(original.slug)) payload.slug = slug
  }

  if (input.body !== undefined) {
    const body = trimmed(input.body)
    if (body !== trimmed(original.body)) {
      payload.body = body.length > 0 ? body : null
    }
  }

  if (input.coverImageUrl !== undefined) {
    const coverImageUrl = trimmed(input.coverImageUrl)
    if (coverImageUrl !== trimmed(original.coverImageUrl)) {
      payload.coverImageUrl = coverImageUrl.length > 0 ? coverImageUrl : null
    }
  }

  return payload
}

export interface AdminContentServerError {
  field: 'title' | 'type' | 'slug' | 'coverImageUrl' | null
  message: string
}

/**
 * Backend codes are mapped to the same French sentences as the provider form,
 * so `SLUG_ALREADY_TAKEN` lands on the slug field and `CONTENT_NOT_PUBLISHABLE`
 * becomes a toast without ever echoing the English transport message.
 */
export function resolveAdminContentServerError(code: string | null | undefined): AdminContentServerError {
  return resolveContentServerError(code)
}
