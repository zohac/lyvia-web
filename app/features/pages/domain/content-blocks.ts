/**
 * V2.2b — Pure content-block helpers for the page editor.
 *
 * The block shape is the server one (`{ type: 'text', data: { html } }`); the
 * editor reads `data.html`, renders it in a `contenteditable` and writes it
 * back, so there is NEVER a second representation of a block.
 *
 * Every function is immutable: they return a new array so the caller can feed it
 * back into a `ref` without mutation surprises.
 */
import type {
  ContentBlock,
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
