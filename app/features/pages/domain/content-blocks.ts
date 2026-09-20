/**
 * V2.2b/V2.2c — Pure content-block helpers for the page editor.
 *
 * The block shape is the server one (`{ type: 'text', data: { html } }` —
 * `{ type: 'image', data: { assetId, url, alt, caption, ... } }`); the editor
 * reads/writes it directly, so there is NEVER a second representation.
 *
 * Every function is immutable: they return a new array so the caller can feed it
 * back into a `ref` without mutation surprises.
 */
import type {
  ContentBlock,
  ImageBlockData,
  ImageContentBlock,
  TextContentBlock
} from '../api/pages.contract'

/** A brand-new, empty text block. */
export function createTextBlock(html = ''): TextContentBlock {
  return { type: 'text', data: { html } }
}

export function isTextBlock(block: ContentBlock): block is TextContentBlock {
  return block.type === 'text'
}

/** Reads the editable HTML of a text block (empty string for other types). */
export function readTextBlockHtml(block: ContentBlock): string {
  return isTextBlock(block) ? block.data.html : ''
}

/** Appends an empty text block at the end of the page. */
export function appendTextBlock(blocks: readonly ContentBlock[]): ContentBlock[] {
  return [...blocks, createTextBlock()]
}

// ── V2.2c — image blocks ────────────────────────────────────────────────────

export function createImageBlock(
  data: Partial<ImageBlockData> = {}
): ImageContentBlock {
  return { type: 'image', data: { assetId: '', ...data } }
}

export function isImageBlock(block: ContentBlock): block is ImageContentBlock {
  return block.type === 'image'
}

/** Reads the image data of an image block (null for other types). */
export function readImageBlockData(block: ContentBlock): ImageBlockData | null {
  return isImageBlock(block) ? block.data : null
}

/** Appends an image block (optionally pre-filled) at the end of the page. */
export function appendImageBlock(
  blocks: readonly ContentBlock[],
  data: Partial<ImageBlockData> = {}
): ContentBlock[] {
  return [...blocks, createImageBlock(data)]
}

/** Merges a patch into the image block at `index` (no-op on other types). */
export function updateImageBlockData(
  blocks: readonly ContentBlock[],
  index: number,
  patch: Partial<ImageBlockData>
): ContentBlock[] {
  if (index < 0 || index >= blocks.length) return [...blocks]
  return blocks.map((block, position) => {
    if (position !== index || !isImageBlock(block)) return block
    return { type: 'image', data: { ...block.data, ...patch } }
  })
}

export interface UploadedImageRef {
  assetId: string
  url: string
  optimizedUrl?: string | null
  width?: number | null
  height?: number | null
}

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * V2.2c — Maps a successful `POST /provider/assets/upload` result to the image
 * block data the editor stores. The bounded WebP variant is preferred, and the
 * caller-decoded dimensions win over the server metadata.
 *
 * Extracted so the upload-result → block contract (notably the `assetId`) is
 * pinned by a behavioural test rather than component source matching.
 */
export function imageBlockDataFromUpload(
  result: UploadedImageRef,
  dimensions?: ImageDimensions
): ImageBlockData {
  return {
    assetId: result.assetId,
    url: result.optimizedUrl ?? result.url,
    width: dimensions?.width ?? result.width ?? null,
    height: dimensions?.height ?? result.height ?? null,
    orphan: false
  }
}

/**
 * `orphan` is a server-owned flag: it is TRUE only when the server resolved the
 * asset and found it absent/not owned (`data.orphan === true`). This helper
 * makes the flag explicit and NEVER infers it from a missing `url`, so a
 * transient resolution failure can never neutralize a block (review 1).
 */
export function markOrphanImageBlocks(
  blocks: readonly ContentBlock[]
): ContentBlock[] {
  return blocks.map((block): ContentBlock => {
    if (!isImageBlock(block)) return block
    return {
      type: 'image',
      data: { ...block.data, orphan: block.data.orphan === true }
    }
  })
}

/** A block the server explicitly flagged as orphaned (display signal). */
export function isOrphanImageBlock(block: ContentBlock): boolean {
  return isImageBlock(block) && block.data.orphan === true
}

/**
 * True when an image block must NOT be persisted: an explicit server orphan, or
 * a block never successfully uploaded (`assetId` empty). Resolved blocks with a
 * missing `url` are NOT excluded.
 */
export function shouldExcludeImageBlockFromSave(block: ContentBlock): boolean {
  if (!isImageBlock(block)) return false
  return block.data.orphan === true || block.data.assetId.trim().length === 0
}

/** At least one block must always remain on the page (AC: last block protected). */
export function canRemoveBlock(blocks: readonly ContentBlock[]): boolean {
  return blocks.length > 1
}

/**
 * Removes the block at `index`. The last remaining block is never removed, so
 * the guard holds even if a caller forgets `canRemoveBlock`.
 */
export function removeBlockAt(
  blocks: readonly ContentBlock[],
  index: number
): ContentBlock[] {
  if (!canRemoveBlock(blocks)) return [...blocks]
  if (index < 0 || index >= blocks.length) return [...blocks]
  return blocks.filter((_, position) => position !== index)
}

/** Rewrites the HTML of the text block at `index` (no-op on other types). */
export function updateTextBlockHtml(
  blocks: readonly ContentBlock[],
  index: number,
  html: string
): ContentBlock[] {
  if (index < 0 || index >= blocks.length) return [...blocks]
  return blocks.map((block, position) => {
    if (position !== index || !isTextBlock(block)) return block
    return { type: 'text', data: { ...block.data, html } }
  })
}
