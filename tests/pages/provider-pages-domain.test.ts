/**
 * V2.2a — Pure domain rules for provider pages (slug, status, limit, create form).
 *
 * The wording asserted here is UI copy defined by the story ACs: paraphrasing it
 * in a component is a regression.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { slugify, isValidPageSlug, isReservedPageSlug } from '../../app/features/pages/domain/slugify'
import { PAGE_STATUS_META, resolvePageStatus } from '../../app/features/pages/domain/page-status'
import {
  MAX_PROVIDER_PAGES,
  PAGE_LIMIT_BADGE_LABEL,
  isPageLimitReached,
  remainingPageSlots
} from '../../app/features/pages/domain/page-limits'
import {
  CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE,
  CREATE_PAGE_TITLE_REQUIRED_MESSAGE,
  CREATE_PAGE_TITLE_TOO_LONG_MESSAGE,
  resolveCreatePageServerError,
  resolveCreatePageSlug,
  validateCreatePageForm
} from '../../app/features/pages/domain/create-page-form'

describe('pages/domain — slugify', () => {
  test('strips accents and produces kebab-case', () => {
    assert.equal(slugify('Mon approche de la périménopause'), 'mon-approche-de-la-perimenopause')
  })

  test('lowercases and collapses non-alphanumerics', () => {
    assert.equal(slugify('  Ma Méthode & vous ! '), 'ma-methode-vous')
  })

  test('trims leading and trailing dashes', () => {
    assert.equal(slugify('---Hello---'), 'hello')
  })

  test('transliterates œ/æ ligatures instead of mangling them', () => {
    assert.equal(slugify('Cœur et équilibre'), 'coeur-et-equilibre')
    assert.equal(slugify('Æquo'), 'aequo')
  })

  test('returns an empty string for empty or punctuation-only input', () => {
    assert.equal(slugify(''), '')
    assert.equal(slugify('!!! ???'), '')
  })

  test('truncates to 200 characters without a trailing dash', () => {
    const result = slugify('a'.repeat(250))
    assert.equal(result.length, 200)
    assert.equal(/-$/.test(result), false)
  })

  test('a slugified title always passes validation when non-empty', () => {
    assert.equal(isValidPageSlug(slugify('Conseils pour bien dormir')), true)
  })
})

describe('pages/domain — slug validation', () => {
  test('accepts kebab-case slugs', () => {
    assert.equal(isValidPageSlug('mon-approche'), true)
    assert.equal(isValidPageSlug('a1b2'), true)
  })

  test('rejects empty, uppercase, spaces and double dashes', () => {
    assert.equal(isValidPageSlug(''), false)
    assert.equal(isValidPageSlug('Mon-Approche'), false)
    assert.equal(isValidPageSlug('mon approche'), false)
    assert.equal(isValidPageSlug('mon--approche'), false)
  })

  test('rejects slugs longer than 200 characters', () => {
    assert.equal(isValidPageSlug('a'.repeat(201)), false)
  })

  test('detects reserved slugs', () => {
    assert.equal(isReservedPageSlug('tarifs'), true)
    assert.equal(isReservedPageSlug('TARIFS'), true)
    assert.equal(isReservedPageSlug('mon-approche'), false)
  })
})

describe('pages/domain — status meta', () => {
  test('draft maps to « Brouillon »', () => {
    assert.equal(PAGE_STATUS_META.draft.label, 'Brouillon')
    assert.equal(PAGE_STATUS_META.draft.color, 'warning')
  })

  test('published without changes maps to « En ligne »', () => {
    assert.equal(PAGE_STATUS_META.published.label, 'En ligne')
    assert.equal(PAGE_STATUS_META.published.color, 'success')
  })

  test('published with changes maps to « Modifications non publiées »', () => {
    assert.equal(PAGE_STATUS_META.published_with_changes.label, 'Modifications non publiées')
    assert.equal(PAGE_STATUS_META.published_with_changes.color, 'warning')
  })

  test('resolvePageStatus derives the third status from hasUnpublishedChanges', () => {
    assert.equal(resolvePageStatus({ status: 'draft', hasUnpublishedChanges: true }), 'draft')
    assert.equal(resolvePageStatus({ status: 'published', hasUnpublishedChanges: true }), 'published_with_changes')
    assert.equal(resolvePageStatus({ status: 'published', hasUnpublishedChanges: false }), 'published')
  })
})

describe('pages/domain — limit counter', () => {
  test('MAX_PROVIDER_PAGES mirrors the API value', () => {
    assert.equal(MAX_PROVIDER_PAGES, 10)
  })

  test('remainingPageSlots counts down and never goes negative', () => {
    assert.equal(remainingPageSlots(0), 10)
    assert.equal(remainingPageSlots(3), 7)
    assert.equal(remainingPageSlots(10), 0)
    assert.equal(remainingPageSlots(12), 0)
  })

  test('isPageLimitReached is true exactly at the limit', () => {
    assert.equal(isPageLimitReached(9), false)
    assert.equal(isPageLimitReached(10), true)
    assert.equal(isPageLimitReached(11), true)
  })

  test('limit badge copy is verbatim', () => {
    assert.equal(PAGE_LIMIT_BADGE_LABEL, 'Limite de 10 pages atteinte')
  })
})

describe('pages/domain — create form', () => {
  test('requires a non-empty title with the exact AC wording', () => {
    const errors = validateCreatePageForm({ title: '   ', slug: 'mon-approche' })
    assert.equal(errors.title, CREATE_PAGE_TITLE_REQUIRED_MESSAGE)
    assert.equal(errors.title, 'Le titre est obligatoire')
  })

  test('rejects a title longer than 300 characters with a dedicated message', () => {
    const errors = validateCreatePageForm({ title: 'a'.repeat(301), slug: 'mon-approche' })
    assert.equal(errors.title, CREATE_PAGE_TITLE_TOO_LONG_MESSAGE)
    assert.equal(errors.title, 'Le titre ne doit pas dépasser 300 caractères.')
  })

  test('accepts a title of exactly 300 characters', () => {
    const errors = validateCreatePageForm({ title: 'a'.repeat(300), slug: 'mon-approche' })
    assert.equal(errors.title, undefined)
  })

  test('derives the slug from the title when the slug is empty', () => {
    assert.equal(resolveCreatePageSlug({ title: 'Mes conseils', slug: '' }), 'mes-conseils')
  })

  test('an explicit slug wins over the derived one', () => {
    assert.equal(resolveCreatePageSlug({ title: 'Mes conseils', slug: 'autre-adresse' }), 'autre-adresse')
  })

  test('accepts a title-only submission (slug derived)', () => {
    const errors = validateCreatePageForm({ title: 'Mes conseils', slug: '' })
    assert.deepEqual(errors, {})
  })

  test('rejects a reserved slug with a message covering reserved or taken', () => {
    const errors = validateCreatePageForm({ title: 'Tarifs', slug: 'tarifs' })
    assert.equal(errors.slug, CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE)
    assert.equal(errors.slug, 'Cette adresse est réservée ou déjà utilisée.')
  })

  test('rejects a slug already present in the list with the same message', () => {
    const errors = validateCreatePageForm({
      title: 'Mes conseils',
      slug: 'mes-conseils',
      existingSlugs: ['mes-conseils']
    })
    assert.equal(errors.slug, CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE)
  })

  test('rejects a malformed slug', () => {
    const errors = validateCreatePageForm({ title: 'Mes conseils', slug: 'Mes Conseils' })
    assert.equal(errors.slug, 'Cette adresse est invalide.')
  })

  test('maps the PAGE_LIMIT_REACHED code to a generic message', () => {
    const mapped = resolveCreatePageServerError('PAGE_LIMIT_REACHED')
    assert.equal(mapped.field, null)
    assert.equal(mapped.message, 'Vous avez atteint la limite de 10 pages.')
  })

  test('maps slug conflicts to the slug field with the combined message', () => {
    assert.deepEqual(
      resolveCreatePageServerError('PAGE_SLUG_RESERVED'),
      { field: 'slug', message: CREATE_PAGE_SLUG_UNAVAILABLE_MESSAGE }
    )
  })

  test('maps PAGE_CONTENT_INVALID (over-long title) to the title field', () => {
    assert.deepEqual(
      resolveCreatePageServerError('PAGE_CONTENT_INVALID'),
      { field: 'title', message: CREATE_PAGE_TITLE_TOO_LONG_MESSAGE }
    )
  })

  test('falls back to a generic message for unknown codes', () => {
    const mapped = resolveCreatePageServerError('SOMETHING_ELSE')
    assert.equal(mapped.field, null)
    assert.equal(mapped.message, 'Impossible de créer la page. Veuillez réessayer.')
  })
})
