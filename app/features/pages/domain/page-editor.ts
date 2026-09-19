/**
 * V2.2b — Pure editor state + save orchestration for `/provider/pages/:id`.
 *
 * Framework-free by design: the component owns a `ref` of this state and
 * delegates every transition here, so `isDirty`, the optimistic-locking payload
 * and the 409 mapping are unit-tested with the Node runner.
 *
 * Locked decisions (spec V2.2b):
 * - Only content blocks are editable; title, slug, menu and SEO are preserved
 *   from the loaded page and sent back unchanged.
 * - Every save carries `expectedVersion`; a `409
 *   PAGE_CONCURRENT_MODIFICATION` never overwrites the local draft.
 */
import type {
  ContentBlock,
  ProviderPageResponse,
  UpdateProviderPageRequest
} from '../api/pages.contract'
import { isTextBlock, updateTextBlockHtml } from './content-blocks'
import { sanitizeHtmlContent } from './paste-sanitizer'

export interface PageEditorState {
  id: string
  title: string
  slug: string
  blocks: ContentBlock[]
  includeInMenu: boolean
  menuLabel: string | null
  sortOrder: number
  seoTitle: string | null
  seoDescription: string | null
  version: number
  /** Serialized editable payload at the last load/save, for `isDirty`. */
  baseline: string
}

function cloneBlocks(blocks: readonly ContentBlock[]): ContentBlock[] {
  return JSON.parse(JSON.stringify(blocks)) as ContentBlock[]
}

export function editableSnapshot(state: Pick<PageEditorState, 'title' | 'blocks'>): string {
  return JSON.stringify({ title: state.title, blocks: state.blocks })
}

export function createPageEditorState(page: ProviderPageResponse): PageEditorState {
  const blocks = cloneBlocks(page.contentBlocks ?? [])
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    blocks,
    includeInMenu: page.includeInMenu,
    menuLabel: page.menuLabel,
    sortOrder: page.sortOrder,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    version: page.version,
    baseline: editableSnapshot({ title: page.title, blocks })
  }
}

export function isPageEditorDirty(state: PageEditorState): boolean {
  return editableSnapshot(state) !== state.baseline
}

export function setPageEditorBlocks(
  state: PageEditorState,
  blocks: readonly ContentBlock[]
): PageEditorState {
  return { ...state, blocks: [...blocks] }
}

/** Resets the editor to a freshly loaded/saved server page. */
export function resetPageEditorState(page: ProviderPageResponse): PageEditorState {
  return createPageEditorState(page)
}

/**
 * Applies the sanitized HTML of the text block at `index`.
 */
export function setEditorBlockHtml(
  state: PageEditorState,
  index: number,
  html: string
): PageEditorState {
  return { ...state, blocks: updateTextBlockHtml(state.blocks, index, html) }
}

/**
 * Applies a successful save when the coach kept editing DURING the request.
 *
 * The local (newer) blocks are preserved, but the version and the dirty
 * baseline must advance to what the server just persisted — otherwise the next
 * save would replay a stale `expectedVersion` and the preserved edits would be
 * falsely reported as already saved.
 */
export function applySavedVersion(
  state: PageEditorState,
  version: number,
  sent: UpdateProviderPageRequest
): PageEditorState {
  return {
    ...state,
    version,
    baseline: editableSnapshot({ title: sent.title, blocks: sent.contentBlocks })
  }
}

/**
 * Sanitizes blocks before they hit the wire. Only text HTML is touched;
 * image/unknown blocks are passed through untouched.
 */
export function sanitizeContentBlocks(
  blocks: readonly ContentBlock[]
): ContentBlock[] {
  return blocks.map((block): ContentBlock => {
    if (!isTextBlock(block)) return block
    const links = block.data.links
    return {
      type: 'text',
      data: {
        html: sanitizeHtmlContent(block.data.html),
        ...(links && links.length > 0 ? { links } : {})
      }
    }
  })
}

export function toUpdateProviderPageRequest(
  state: PageEditorState
): UpdateProviderPageRequest {
  return {
    title: state.title,
    slug: state.slug,
    contentBlocks: sanitizeContentBlocks(state.blocks),
    includeInMenu: state.includeInMenu,
    menuLabel: state.menuLabel,
    sortOrder: state.sortOrder,
    seoTitle: state.seoTitle,
    seoDescription: state.seoDescription,
    expectedVersion: state.version
  }
}

export type PageSaveErrorKind
  = | 'conflict'
    | 'validation'
    | 'not_found'
    | 'forbidden'
    | 'session'
    | 'network'

export interface PageSaveError {
  kind: PageSaveErrorKind
  title: string
  message: string
  code: string | null
}

interface ApiErrorLike {
  statusCode?: number
  code?: string
  message?: string
}

function readApiError(error: unknown): ApiErrorLike | null {
  if (!error || typeof error !== 'object') return null
  const apiError = (error as { apiError?: unknown }).apiError
  if (!apiError || typeof apiError !== 'object') return null
  const candidate = apiError as Record<string, unknown>
  return {
    statusCode: typeof candidate.statusCode === 'number' ? candidate.statusCode : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined
  }
}

/**
 * Maps a `PUT /provider/pages/:id` failure to user-facing copy. The 409 wording
 * is verbatim from the UX spec (§4.2) and must not be paraphrased.
 */
export function resolvePageSaveError(error: unknown): PageSaveError {
  const apiError = readApiError(error)
  const code = apiError?.code ?? null
  const status = apiError?.statusCode

  // Only the optimistic-locking code is a conflict; a bare 409 (e.g. an
  // unrelated duplicate) must not be presented as a page-edit conflict.
  if (code === 'PAGE_CONCURRENT_MODIFICATION') {
    return {
      kind: 'conflict',
      title: 'La page a été modifiée par ailleurs',
      message: 'Une modification plus récente a été enregistrée depuis un autre onglet ou appareil. Vos modifications actuelles n\'ont pas été écrasées.',
      code
    }
  }

  if (
    code === 'PAGE_CONTENT_INVALID'
    || code === 'PAGE_CONTENT_TOO_LARGE'
    || status === 422
    || status === 400
  ) {
    return {
      kind: 'validation',
      title: 'Enregistrement impossible',
      message: 'Le contenu de la page est invalide. Vérifiez vos blocs puis réessayez.',
      code
    }
  }

  if (code === 'PAGE_NOT_FOUND' || status === 404) {
    return {
      kind: 'not_found',
      title: 'Page introuvable',
      message: 'Cette page n\'existe plus. Rechargez la liste de vos pages.',
      code
    }
  }

  if (code === 'INVALID_REFRESH_TOKEN' || status === 401) {
    return {
      kind: 'session',
      title: 'Session expirée',
      message: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
      code
    }
  }

  if (status === 403) {
    return {
      kind: 'forbidden',
      title: 'Non autorisé',
      message: 'L\'enregistrement de cette page n\'est pas autorisé.',
      code
    }
  }

  return {
    kind: 'network',
    title: 'Enregistrement impossible',
    message: 'Impossible d\'enregistrer. Vérifiez votre connexion et réessayez.',
    code
  }
}
