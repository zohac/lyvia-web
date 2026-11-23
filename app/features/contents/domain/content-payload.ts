import type {
  ContentType,
  ContentAudience,
  CreateContentRequest,
  UpdateContentRequest
} from '../api/contents.contract'
import type { ContentFormInput } from './content-form'

/**
 * Payload builders for the provider content forms (Story 5.5).
 *
 * The mapping form → request lives here, not in the page, so a field the DTO
 * validates can never be dropped by an inline mapping nobody executes. The
 * builders are pure and covered by `tests/contents/contents-payload.test.ts`.
 *
 * Server contracts mirrored here (`lyvia-api`):
 * - `CreateContentDto`: `body`/`coverImageUrl` are optional strings, never
 *   `null` — an empty field is omitted rather than sent empty.
 * - `UpdateContentDto`: `body`/`coverImageUrl` accept `null` to clear, and
 *   `slug` is `@Matches(kebab-case)` so an empty string would be a 400.
 */

export interface ContentOriginal {
  title: string
  type: ContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  audience: ContentAudience | null
  document?: { filename: string, sizeBytes: number } | null
  documentAssetId?: string | null
}

function trimmed(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function buildCreateContentPayload(input: ContentFormInput): CreateContentRequest {
  const payload: CreateContentRequest = {
    // `validateContentForm` has already refused an empty title or type.
    title: trimmed(input.title),
    type: input.type as ContentType,
    audience: input.audience ?? 'selected'
  }

  const body = trimmed(input.body)
  if (body.length > 0) payload.body = body

  const slug = trimmed(input.slug)
  if (slug.length > 0) payload.slug = slug

  const coverImageUrl = trimmed(input.coverImageUrl)
  if (coverImageUrl.length > 0) payload.coverImageUrl = coverImageUrl

  // `documentAssetId` is always carried (never `undefined`): `null` means "no
  // document attached". The asset id comes either from the form's `document`
  // (after an upload) or from an explicit `documentAssetId` field.
  let documentAssetId: string | null = null
  if (input.documentAssetId !== undefined) {
    documentAssetId = input.documentAssetId ?? null
  } else if (input.document) {
    documentAssetId = input.document.assetId || null
  }
  payload.documentAssetId = documentAssetId

  return payload
}

/**
 * PATCH payload carrying only the fields that actually changed (AC #3).
 * A cleared body or cover is sent as `null`, which the update DTO accepts as
 * "clear this field"; an untouched empty field is not sent at all.
 */
export function buildUpdateContentPayload(
  input: ContentFormInput,
  original: ContentOriginal
): UpdateContentRequest {
  const payload: UpdateContentRequest = {}

  const title = trimmed(input.title)
  if (title !== trimmed(original.title)) payload.title = title

  if (input.type && input.type !== original.type) payload.type = input.type

  const body = trimmed(input.body)
  if (body !== trimmed(original.body)) {
    payload.body = body.length > 0 ? body : null
  }

  const coverImageUrl = trimmed(input.coverImageUrl)
  if (coverImageUrl !== trimmed(original.coverImageUrl)) {
    payload.coverImageUrl = coverImageUrl.length > 0 ? coverImageUrl : null
  }

  if (input.audience && input.audience !== original.audience) {
    payload.audience = input.audience
  }

  // The server has no "clear the slug" operation: `slug` is `@Matches` and an
  // empty string fails validation. An emptied field therefore means "keep the
  // current address", never a 400 the user cannot act on.
  const slug = trimmed(input.slug)
  if (slug.length > 0 && slug !== trimmed(original.slug)) payload.slug = slug

  // Document attachment: `undefined` means "don't touch" (PATCH semantics),
  // `null` means "detach". A change is emitted only when it is real, so an
  // untouched server document (assetId === '') is never re-sent as an empty
  // string (which the API would reject as a malformed UUID).
  const originalHasDocument = original.document != null || original.documentAssetId != null

  if (input.documentAssetId !== undefined) {
    payload.documentAssetId = input.documentAssetId ?? null
  } else if (input.document !== undefined) {
    if (input.document == null) {
      if (originalHasDocument) payload.documentAssetId = null
    } else {
      const assetId = (input.document.assetId ?? '').trim()
      if (assetId.length > 0) {
        // A freshly uploaded asset (real assetId) is always sent.
        payload.documentAssetId = assetId
      } else if (!originalHasDocument) {
        // No document before, none after with an id: nothing to send.
      } else {
        // Existing document, unchanged (assetId === ''): leave it alone.
      }
    }
  }

  return payload
}
