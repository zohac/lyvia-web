import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  CONTENT_SLUG_INVALID_MESSAGE,
  CONTENT_VALIDATION_ERROR_MESSAGE,
  MAX_CONTENT_TITLE_LENGTH,
  validateContentForm,
  resolveContentServerError,
  isContentPublishable,
  hasContentFormErrors
} from '../../app/features/contents/domain/content-form'

describe('validateContentForm', () => {
  test('requires a title and a type', () => {
    const errors = validateContentForm({ title: '', type: '' })
    assert.equal(errors.title, 'Le titre est obligatoire.')
    assert.equal(errors.type, 'Le type est obligatoire.')
    assert.equal(hasContentFormErrors(errors), true)
  })

  test('accepts a valid input', () => {
    const errors = validateContentForm({ title: 'Hello', type: 'article' })
    assert.deepEqual(errors, {})
    assert.equal(hasContentFormErrors(errors), false)
  })

  test('refuses a title longer than the server limit', () => {
    const errors = validateContentForm({ title: 'a'.repeat(MAX_CONTENT_TITLE_LENGTH + 1), type: 'article' })
    assert.equal(errors.title, `Le titre ne doit pas dépasser ${MAX_CONTENT_TITLE_LENGTH} caractères.`)
  })

  test('refuses a slug with a space', () => {
    const errors = validateContentForm({ title: 'Hello', type: 'article', slug: 'Bad Slug' })
    assert.equal(errors.slug, CONTENT_SLUG_INVALID_MESSAGE)
  })

  test('refuses an uppercase slug, which the server pattern rejects', () => {
    // `lyvia-api` enforces /^[a-z0-9]+(?:-[a-z0-9]+)*$/ with no `i` flag: a
    // case-insensitive client pattern let `MonArticle` through to a 422 the
    // form could not attribute to a field.
    for (const slug of ['MonArticle', 'mon-Article', 'ARTICLE']) {
      const errors = validateContentForm({ title: 'Hello', type: 'article', slug })
      assert.equal(errors.slug, CONTENT_SLUG_INVALID_MESSAGE, `${slug} must be refused`)
    }
  })

  test('accepts a kebab-case slug', () => {
    assert.deepEqual(validateContentForm({ title: 'Hello', type: 'article', slug: 'mon-article-2' }), {})
  })

  test('refuses a cover URL that is not http(s)', () => {
    for (const coverImageUrl of ['not-a-url', 'javascript:alert(1)', 'data:image/png;base64,AAA', 'ftp://example.com/a.png']) {
      const errors = validateContentForm({ title: 'Hello', type: 'article', coverImageUrl })
      assert.ok(errors.coverImageUrl, `${coverImageUrl} must be refused`)
    }
    assert.deepEqual(validateContentForm({ title: 'Hello', type: 'article', coverImageUrl: 'https://example.com/a.png' }), {})
  })
})

describe('resolveContentServerError', () => {
  test('maps the slug conflict onto the slug field', () => {
    assert.deepEqual(resolveContentServerError('SLUG_ALREADY_TAKEN'), {
      field: 'slug',
      message: 'Cette adresse est déjà utilisée.'
    })
  })

  test('maps every code the provider content API emits', () => {
    assert.deepEqual(resolveContentServerError('CONTENT_NOT_PUBLISHABLE'), {
      field: null,
      message: 'Le titre et le contenu sont requis pour publier.'
    })
    assert.deepEqual(resolveContentServerError('VALIDATION_ERROR'), {
      field: null,
      message: CONTENT_VALIDATION_ERROR_MESSAGE
    })
    assert.deepEqual(resolveContentServerError('CONTENT_NOT_FOUND'), {
      field: null,
      message: 'Ce contenu est introuvable.'
    })
    assert.deepEqual(resolveContentServerError('FORBIDDEN'), {
      field: null,
      message: 'Accès refusé.'
    })
    // diffusion-2 AC9: a title with no usable ASCII letter answers 422 with this
    // code, and the provider must read why instead of the generic sentence.
    assert.deepEqual(resolveContentServerError('CONTENT_SLUG_UNRESOLVABLE'), {
      field: null,
      message: 'Impossible de générer une adresse à partir de ce titre.'
    })
  })

  test('maps the three document refusals of diffusion-12 to French sentences (AC5)', () => {
    const documentCodes: Array<[string, string]> = [
      ['CONTENT_DOCUMENT_NOT_FOUND', 'Ce document est introuvable.'],
      ['CONTENT_DOCUMENT_INVALID_TYPE', 'Seuls les PDF sont acceptés.'],
      ['CONTENT_DOCUMENT_ALREADY_ATTACHED', 'Ce document est déjà rattaché à un autre contenu.']
    ]

    for (const [code, message] of documentCodes) {
      const mapped = resolveContentServerError(code)
      assert.equal(mapped.message, message, `${code} must name its own French sentence`)
      assert.notEqual(
        mapped.message,
        'Impossible d’enregistrer le contenu. Veuillez réessayer.',
        `${code} must not fall back to the generic message`
      )
      assert.equal(mapped.field, null, `${code} is not attributable to a form field`)
    }
  })

  test('falls back to a French generic message for an unknown code', () => {
    assert.deepEqual(resolveContentServerError('SOMETHING_NEW'), {
      field: null,
      message: 'Impossible d’enregistrer le contenu. Veuillez réessayer.'
    })
    assert.deepEqual(resolveContentServerError(undefined).field, null)
  })
})

describe('isContentPublishable', () => {
  test('requires a title and a body', () => {
    assert.equal(isContentPublishable({ title: 'T', body: 'B' }), true)
    assert.equal(isContentPublishable({ title: 'T', body: '' }), false)
    assert.equal(isContentPublishable({ title: '', body: 'B' }), false)
  })

  test('treats whitespace-only values as empty, like the server does', () => {
    assert.equal(isContentPublishable({ title: '   ', body: 'B' }), false)
    assert.equal(isContentPublishable({ title: 'T', body: '\n  \t' }), false)
    assert.equal(isContentPublishable({ title: null, body: null }), false)
  })
})
