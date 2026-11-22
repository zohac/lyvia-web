import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateContentForm,
  resolveContentServerError,
  isContentPublishable,
  hasContentFormErrors
} from '../../app/features/contents/domain/content-form'

test('validateContentForm requires title and type', () => {
  const errors = validateContentForm({ title: '', type: '' })
  assert.equal(errors.title, 'Le titre est obligatoire')
  assert.equal(errors.type, 'Le type est obligatoire')
  assert.equal(hasContentFormErrors(errors), true)
})

test('validateContentForm accepts valid input', () => {
  const errors = validateContentForm({ title: 'Hello', type: 'article' })
  assert.deepEqual(errors, {})
  assert.equal(hasContentFormErrors(errors), false)
})

test('validateContentForm rejects invalid slug and url', () => {
  const errors = validateContentForm({ title: 'Hello', type: 'article', slug: 'Bad Slug', coverImageUrl: 'not-a-url' })
  assert.ok(errors.slug)
  assert.ok(errors.coverImageUrl)
})

test('resolveContentServerError maps codes', () => {
  assert.deepEqual(resolveContentServerError('SLUG_ALREADY_TAKEN'), { field: 'slug', message: 'Cette adresse est déjà utilisée.' })
  assert.deepEqual(resolveContentServerError('CONTENT_NOT_PUBLISHABLE').field, null)
})

test('isContentPublishable requires title and body', () => {
  assert.equal(isContentPublishable({ title: 'T', body: 'B' }), true)
  assert.equal(isContentPublishable({ title: 'T', body: '' }), false)
  assert.equal(isContentPublishable({ title: '', body: 'B' }), false)
})