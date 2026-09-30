import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  validateBrandLogoFile,
  validateFileUpload,
  validatePageImageDimensions,
  validatePageImageFile,
  formatUploadError,
  BRAND_LOGO_MAX_BYTES,
  BRAND_LOGO_ALLOWED_MIME_TYPES
} from '../../app/features/assets/asset-validators'
import {
  PAGE_IMAGE_MAX_BYTES,
  PAGE_IMAGE_MAX_DIMENSION,
  PAGE_IMAGE_MAX_PIXELS
} from '../../app/features/assets/api/asset.contract'

/**
 * Story 0-27 — pure helpers for the brand logo upload widget.
 * These tests guard the validation contract decoupled from the Vue page,
 * so a future refactor of the markup cannot silently break the validation
 * rules.
 */

function makeFile(name: string, mime: string, size: number): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type: mime })
}

describe('validateBrandLogoFile (Story 0-27)', () => {
  test('accepts a valid PNG under 1 MB', () => {
    const file = makeFile('logo.png', 'image/png', 500_000)
    assert.equal(validateBrandLogoFile(file), null)
  })

  test('accepts a valid JPEG under 1 MB', () => {
    const file = makeFile('logo.jpg', 'image/jpeg', 500_000)
    assert.equal(validateBrandLogoFile(file), null)
  })

  test('accepts a valid WebP under 1 MB', () => {
    const file = makeFile('logo.webp', 'image/webp', 500_000)
    assert.equal(validateBrandLogoFile(file), null)
  })

  test('rejects a file > 1 MB with the AC-5 verbatim copy', () => {
    const file = makeFile('big.png', 'image/png', 2 * 1024 * 1024)
    const err = validateBrandLogoFile(file)
    assert.equal(err, 'Le logo doit faire moins de 1 Mo.')
  })

  test('rejects an SVG (Story 0-27 AC-1: SVG excluded for security)', () => {
    const file = makeFile('logo.svg', 'image/svg+xml', 10_000)
    const err = validateBrandLogoFile(file)
    assert.match(err ?? '', /PNG, JPEG ou WebP/)
  })

  test('rejects a PDF (only image MIMEs are allowed)', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 10_000)
    const err = validateBrandLogoFile(file)
    assert.match(err ?? '', /PNG, JPEG ou WebP/)
  })

  test('exposed constants align with the AC-1/AC-5 spec', () => {
    assert.equal(BRAND_LOGO_MAX_BYTES, 1 * 1024 * 1024)
    assert.deepStrictEqual([...BRAND_LOGO_ALLOWED_MIME_TYPES], [
      'image/png',
      'image/jpeg',
      'image/webp'
    ])
  })
})

describe('formatUploadError (Story 0-27)', () => {
  test('brand_logo: surfaces logo-specific TOO_LARGE copy verbatim', () => {
    const err = formatUploadError(new Error('SEO_UPLOAD_TOO_LARGE'), 'brand_logo')
    assert.equal(err, 'Le logo doit faire moins de 1 Mo.')
  })

  test('brand_logo: surfaces logo-specific INVALID_MIME copy', () => {
    const err = formatUploadError(new Error('SEO_UPLOAD_INVALID_MIME'), 'brand_logo')
    assert.match(err, /Format de logo non reconnu/)
  })

  test('brand_logo: surfaces generic logo error fallback', () => {
    const err = formatUploadError(new Error('SOMETHING_ELSE'), 'brand_logo')
    assert.equal(err, 'Erreur lors de l\'upload du logo.')
  })

  test('legacy callers (no assetType): preserves the photo-specific copy', () => {
    const err = formatUploadError(new Error('SEO_UPLOAD_INVALID_MIME'))
    assert.match(err, /Format d'image non reconnu/)
  })
})

describe('validateFileUpload (shared helper, regression guard)', () => {
  test('returns null when file matches size + MIME', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 500_000)
    assert.equal(
      validateFileUpload(file, 2 * 1024 * 1024, ['image/jpeg', 'image/png']),
      null
    )
  })

  test('rejects when size exceeds maxBytes (uses ceil-Mb math)', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 3 * 1024 * 1024)
    const err = validateFileUpload(file, 2 * 1024 * 1024, ['image/jpeg'])
    assert.match(err ?? '', /maximale est de 2 Mo/)
  })

  test('rejects when MIME is not in the allow-list', () => {
    const file = makeFile('virus.exe', 'application/x-msdownload', 100)
    const err = validateFileUpload(file, 2 * 1024 * 1024, ['image/jpeg', 'image/png'])
    assert.match(err ?? '', /Formats acceptés/)
  })
})

describe('page_image validation (V2.2c)', () => {
  test('accepts a valid JPEG/PNG/WebP under 5 MB', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
      assert.equal(validatePageImageFile(makeFile('x', mime, 1_000_000)), null)
    }
  })

  test('rejects a file over 5 MB with the human message', () => {
    const err = validatePageImageFile(makeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024))
    assert.equal(err, 'L\'image doit faire moins de 5 Mo.')
  })

  test('rejects a GIF with the format message', () => {
    const err = validatePageImageFile(makeFile('anim.gif', 'image/gif', 1_000))
    assert.equal(err, 'Formats acceptés : JPEG, PNG, WEBP.')
  })

  test('dimension guard mirrors the server limits', () => {
    assert.equal(validatePageImageDimensions(2000, 1500), null)
    assert.equal(
      validatePageImageDimensions(4001, 100),
      'L\'image ne doit pas dépasser 4 000 px de côté.'
    )
    assert.equal(
      validatePageImageDimensions(4000, 3000),
      'L\'image est trop grande (maximum 10 mégapixels).'
    )
  })

  test('contract constants mirror ASSET_LIMITS.page_image', () => {
    assert.equal(PAGE_IMAGE_MAX_BYTES, 5 * 1024 * 1024)
    assert.equal(PAGE_IMAGE_MAX_DIMENSION, 4000)
    assert.equal(PAGE_IMAGE_MAX_PIXELS, 10_000_000)
  })

  test('formatUploadError maps page_image server codes to human copy', () => {
    assert.equal(
      formatUploadError(new Error('SEO_UPLOAD_DIMENSIONS_EXCEEDED'), 'page_image'),
      'L\'image ne doit pas dépasser 4 000 px de côté.'
    )
    assert.equal(
      formatUploadError(new Error('SEO_UPLOAD_PIXELS_EXCEEDED'), 'page_image'),
      'L\'image est trop grande (maximum 10 mégapixels).'
    )
    assert.equal(
      formatUploadError(new Error('SEO_UPLOAD_TOO_LARGE'), 'page_image'),
      'L\'image doit faire moins de 5 Mo.'
    )
    assert.equal(
      formatUploadError(new Error('SEO_UPLOAD_INVALID_MIME'), 'page_image'),
      'Format d\'image non reconnu. Utilisez un fichier JPEG, PNG ou WebP valide.'
    )
  })
})
