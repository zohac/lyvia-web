/**
 * V2.2c — Wiring guards for the image block editor.
 *
 * Pure rules live in `content-blocks.test.ts` / `page-editor.test.ts`. These
 * source-inspection tests protect the behaviours review 1 flagged:
 * BH7 (label `for`/`id`), BH15 (`bitmap.close()`), BH19 (drag counter),
 * ECH5 (single concurrent upload), plus the I/O matrix (drop, validation,
 * replace, delete, progress).
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test, { describe } from 'node:test'

const ROOT = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

describe('assets — BlockImageEditor', () => {
  const editor = read('app/components/organisms/BlockImageEditor.vue')

  test('accepts drag & drop and a click-to-browse picker', () => {
    assert.match(editor, /@drop\.prevent="onDrop"/)
    assert.match(editor, /@dragover\.prevent/)
    assert.match(editor, /@dragenter\.prevent="onDragEnter"/)
    assert.match(editor, /@dragleave\.prevent="onDragLeave"/)
    assert.match(editor, /@click="openFilePicker"/)
    assert.ok(editor.includes('accept="image/jpeg,image/png,image/webp"'))
  })

  test('shows an upload progress indicator', () => {
    assert.match(editor, /<UProgress/)
    assert.match(editor, /v-if="uploading"/)
  })

  test('guards against concurrent uploads (ECH5)', () => {
    assert.match(editor, /if \(uploading\.value\) return/)
  })

  test('uses a drag depth counter to avoid flicker (BH19)', () => {
    assert.ok(editor.includes('dragDepth'))
    assert.match(editor, /dragDepth\.value \+= 1/)
    assert.match(editor, /dragDepth\.value = Math\.max\(0, dragDepth\.value - 1\)/)
  })

  test('associates alt/caption labels with their inputs for screen readers (BH7)', () => {
    assert.match(editor, /:for="altId"/)
    assert.match(editor, /:id="altId"/)
    assert.match(editor, /:for="captionId"/)
    assert.match(editor, /:id="captionId"/)
  })

  test('validates files client-side before uploading', () => {
    assert.ok(editor.includes('validatePageImageFile'))
    assert.ok(editor.includes('validatePageImageDimensions'))
    assert.ok(editor.includes('formatUploadError'))
  })

  test('exposes replace and delete actions and the orphan warning', () => {
    assert.ok(editor.includes('Remplacer l\'image'))
    assert.ok(editor.includes('Supprimer le bloc'))
    assert.match(editor, /emit\('remove'\)/)
    assert.ok(editor.includes('Cette image n\'est plus disponible'))
  })

  test('uses only existing design tokens (no ghost var)', () => {
    const colorVars = [...editor.matchAll(/var\((--color-[a-z0-9-]+)/g)].map(m => m[1]!)
    assert.ok(colorVars.length > 0)
    const shared = read('app/assets/css/shared.css')
    for (const name of new Set(colorVars)) {
      assert.ok(shared.includes(`${name}:`), `${name} must exist in shared.css`)
    }
  })
})

describe('assets — readImageDimensions', () => {
  const upload = read('app/features/assets/use-asset-upload.ts')

  test('closes the decoded bitmap to avoid leaking GPU memory (BH15)', () => {
    assert.match(upload, /createImageBitmap/)
    assert.match(upload, /bitmap\.close\(\)/)
  })
})

describe('assets — single asset contract (BH16)', () => {
  const contract = read('app/features/assets/api/asset.contract.ts')
  const validators = read('app/features/assets/asset-validators.ts')

  test('UploadAssetType is declared once and imported by the validators', () => {
    assert.ok(contract.includes('export type UploadAssetType'))
    assert.match(validators, /from '\.\/api\/asset\.contract'/)
    assert.ok(
      !/export type UploadAssetType\s*=/.test(validators),
      'validators must not redeclare the union'
    )
  })

  test('page_image limits mirror the server', () => {
    assert.ok(contract.includes('PAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024'))
    assert.ok(contract.includes('PAGE_IMAGE_MAX_DIMENSION = 4000'))
    assert.ok(contract.includes('PAGE_IMAGE_MAX_PIXELS = 10_000_000'))
  })
})
