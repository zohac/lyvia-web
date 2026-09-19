/**
 * V2.2a — Behavioural tests for the create-page modal state machine.
 *
 * The component delegates every transition to these pure helpers, so the
 * slug-tracking and submit-guard rules are asserted without a DOM renderer.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  applyCreatePageSlugChange,
  applyCreatePageTitleChange,
  createInitialCreatePageModalState,
  resolveCreatePageSubmit
} from '../../app/features/pages/domain/create-page-modal'

describe('create-page-modal — slug tracking', () => {
  test('typing a title derives the slug until the slug is touched', () => {
    const state = applyCreatePageTitleChange(createInitialCreatePageModalState(), 'Mes conseils')
    assert.equal(state.slug, 'mes-conseils')
    assert.equal(state.slugTouched, false)
  })

  test('editing the title does not overwrite a touched slug', () => {
    const touched = applyCreatePageSlugChange(
      applyCreatePageTitleChange(createInitialCreatePageModalState(), 'Mes conseils'),
      'mon-adresse'
    )
    const afterTitleEdit = applyCreatePageTitleChange(touched, 'Un autre titre')

    assert.equal(afterTitleEdit.slug, 'mon-adresse')
    assert.equal(afterTitleEdit.slugTouched, true)
  })

  test('clearing a touched slug falls back to the title-derived slug', () => {
    const touched = applyCreatePageSlugChange(
      applyCreatePageTitleChange(createInitialCreatePageModalState(), 'Mes conseils'),
      'mon-adresse'
    )
    const cleared = applyCreatePageSlugChange(touched, '')

    assert.equal(cleared.slug, 'mes-conseils')
    assert.equal(cleared.slugTouched, false)
  })
})

describe('create-page-modal — submit guard', () => {
  test('an invalid form does not submit', () => {
    const result = resolveCreatePageSubmit(createInitialCreatePageModalState())
    assert.deepEqual(result, { kind: 'invalid' })
  })

  test('a valid form submits the resolved slug', () => {
    const state = applyCreatePageTitleChange(createInitialCreatePageModalState(), 'Mes conseils')
    assert.deepEqual(resolveCreatePageSubmit(state), {
      kind: 'submit',
      title: 'Mes conseils',
      slug: 'mes-conseils'
    })
  })

  test('a slug already in the list blocks submission', () => {
    const state = applyCreatePageSlugChange(
      applyCreatePageTitleChange(createInitialCreatePageModalState(), 'Mes conseils'),
      'deja-pris'
    )
    assert.deepEqual(resolveCreatePageSubmit(state, ['deja-pris']), { kind: 'invalid' })
  })
})
