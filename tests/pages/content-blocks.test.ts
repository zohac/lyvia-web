/**
 * V2.2b — Pure content-block helpers (creation, append, removal, update).
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  appendImageBlock,
  appendTextBlock,
  canRemoveBlock,
  createImageBlock,
  createTextBlock,
  imageBlockDataFromUpload,
  isImageBlock,
  isOrphanImageBlock,
  isTextBlock,
  markOrphanImageBlocks,
  readImageBlockData,
  readTextBlockHtml,
  removeBlockAt,
  shouldExcludeImageBlockFromSave,
  updateImageBlockData,
  updateTextBlockHtml
} from '../../app/features/pages/domain/content-blocks'
import type { ContentBlock } from '../../app/features/pages/api/pages.contract'

function text(html: string): ContentBlock {
  return { type: 'text', data: { html } }
}

function image(assetId: string): ContentBlock {
  return { type: 'image', data: { assetId } }
}

describe('pages/domain — content blocks', () => {
  test('createTextBlock produces the server block shape', () => {
    assert.deepEqual(createTextBlock('<p>Bonjour</p>'), {
      type: 'text',
      data: { html: '<p>Bonjour</p>' }
    })
    assert.deepEqual(createTextBlock(), { type: 'text', data: { html: '' } })
  })

  test('isTextBlock narrows text blocks only', () => {
    assert.equal(isTextBlock(text('a')), true)
    assert.equal(isTextBlock(image('00000000-0000-0000-0000-000000000000')), false)
  })

  test('readTextBlockHtml returns the html for text and empty for image', () => {
    assert.equal(readTextBlockHtml(text('<p>a</p>')), '<p>a</p>')
    assert.equal(readTextBlockHtml(image('00000000-0000-0000-0000-000000000000')), '')
  })

  test('appendTextBlock adds an empty block at the end without mutating', () => {
    const blocks = [text('<p>a</p>')]
    const next = appendTextBlock(blocks)
    assert.equal(next.length, 2)
    assert.deepEqual(next[1], { type: 'text', data: { html: '' } })
    assert.equal(blocks.length, 1)
  })

  test('the last block can never be removed', () => {
    const single = [text('<p>a</p>')]
    assert.equal(canRemoveBlock(single), false)
    assert.equal(removeBlockAt(single, 0).length, 1)
    assert.equal(canRemoveBlock([text('a'), text('b')]), true)
  })

  test('removeBlockAt removes the right block and ignores bad indices', () => {
    const blocks = [text('<p>a</p>'), text('<p>b</p>'), text('<p>c</p>')]
    const next = removeBlockAt(blocks, 1)
    assert.equal(next.length, 2)
    assert.equal(readTextBlockHtml(next[0]!), '<p>a</p>')
    assert.equal(readTextBlockHtml(next[1]!), '<p>c</p>')
    assert.equal(removeBlockAt(blocks, 42).length, 3)
    assert.equal(removeBlockAt(blocks, -1).length, 3)
  })

  test('updateTextBlockHtml rewrites only the targeted text block', () => {
    const blocks = [text('<p>a</p>'), image('00000000-0000-0000-0000-000000000000')]
    const next = updateTextBlockHtml(blocks, 0, '<p>z</p>')
    assert.equal(readTextBlockHtml(next[0]!), '<p>z</p>')
    assert.equal(next[1]?.type, 'image')
    assert.equal(readTextBlockHtml(blocks[0]!), '<p>a</p>')
  })

  test('updateTextBlockHtml is a no-op on an image block or bad index', () => {
    const blocks = [image('00000000-0000-0000-0000-000000000000')]
    assert.equal(updateTextBlockHtml(blocks, 0, '<p>x</p>')[0]?.type, 'image')
    assert.equal(updateTextBlockHtml(blocks, 5, '<p>x</p>')[0]?.type, 'image')
  })
})

describe('pages/domain — image blocks (V2.2c)', () => {
  test('createImageBlock produces the server block shape with an empty assetId', () => {
    assert.deepEqual(createImageBlock(), { type: 'image', data: { assetId: '' } })
    assert.deepEqual(createImageBlock({ assetId: 'a', alt: 'x' }), {
      type: 'image',
      data: { assetId: 'a', alt: 'x' }
    })
  })

  test('isImageBlock / readImageBlockData narrow image blocks only', () => {
    assert.equal(isImageBlock(image('00000000-0000-0000-0000-000000000000')), true)
    assert.equal(isImageBlock(text('a')), false)
    assert.deepEqual(readImageBlockData(image('00000000-0000-0000-0000-000000000000')), {
      assetId: '00000000-0000-0000-0000-000000000000'
    })
    assert.equal(readImageBlockData(text('a')), null)
  })

  test('appendImageBlock adds an image block without mutating', () => {
    const blocks = [text('<p>a</p>')]
    const next = appendImageBlock(blocks, { assetId: 'a' })
    assert.equal(next.length, 2)
    assert.deepEqual(next[1], { type: 'image', data: { assetId: 'a' } })
    assert.equal(blocks.length, 1)
  })

  test('updateImageBlockData merges a patch into the target image block only', () => {
    const blocks = [image('a'), text('<p>t</p>')]
    const next = updateImageBlockData(blocks, 0, { alt: 'décrit', url: 'https://cdn/x.webp' })
    assert.deepEqual(next[0], {
      type: 'image',
      data: { assetId: 'a', alt: 'décrit', url: 'https://cdn/x.webp' }
    })
    assert.equal(updateImageBlockData(blocks, 5, { alt: 'z' })[0]?.type, 'image')
  })

  test('markOrphanImageBlocks marks orphan ONLY from the explicit server flag', () => {
    const resolvedNoUrl: ContentBlock = { type: 'image', data: { assetId: 'a', url: null } }
    const serverOrphan: ContentBlock = { type: 'image', data: { assetId: 'b', orphan: true } }

    const [resolved, orphan] = markOrphanImageBlocks([resolvedNoUrl, serverOrphan])

    assert.equal(isOrphanImageBlock(resolved!), false, 'missing url alone is never an orphan')
    assert.deepEqual(resolved, { type: 'image', data: { assetId: 'a', url: null, orphan: false } })
    assert.equal(isOrphanImageBlock(orphan!), true)
  })

  test('imageBlockDataFromUpload maps the upload result to block data, keeping assetId', () => {
    const data = imageBlockDataFromUpload(
      {
        assetId: 'asset-1',
        url: 'https://cdn/original.jpg',
        optimizedUrl: 'https://cdn/original-optimized.webp'
      },
      { width: 1200, height: 800 }
    )

    assert.deepEqual(data, {
      assetId: 'asset-1',
      url: 'https://cdn/original-optimized.webp',
      width: 1200,
      height: 800,
      orphan: false
    })
  })

  test('imageBlockDataFromUpload falls back to url and server dimensions', () => {
    const data = imageBlockDataFromUpload({
      assetId: 'asset-2',
      url: 'https://cdn/original.jpg',
      optimizedUrl: null,
      width: 640,
      height: 480
    })

    assert.deepEqual(data, {
      assetId: 'asset-2',
      url: 'https://cdn/original.jpg',
      width: 640,
      height: 480,
      orphan: false
    })
  })

  test('shouldExcludeImageBlockFromSave excludes server orphans and never-uploaded blocks', () => {
    assert.equal(
      shouldExcludeImageBlockFromSave({ type: 'image', data: { assetId: '', orphan: false } }),
      true
    )
    assert.equal(
      shouldExcludeImageBlockFromSave({ type: 'image', data: { assetId: 'a', orphan: true } }),
      true
    )
    assert.equal(
      shouldExcludeImageBlockFromSave({ type: 'image', data: { assetId: 'a', url: null, orphan: false } }),
      false,
      'resolved block with missing url is kept'
    )
    assert.equal(shouldExcludeImageBlockFromSave(text('a')), false)
  })
})
