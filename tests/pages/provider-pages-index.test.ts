/**
 * V2.2a — Behavioural tests for the `/provider/pages` view selection rules.
 *
 * The page maps these pure decisions to components; the gating short-circuit
 * and the loading/error/empty/list branch selection are asserted here.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  resolveProviderPagesViewState,
  shouldLoadProviderPages
} from '../../app/features/pages/domain/pages-list-view'

const base = {
  unlocked: true,
  pending: false,
  loaded: true,
  errorMessage: null,
  pageCount: 0
}

describe('pages-list-view — gating', () => {
  test('locked sessions never load', () => {
    assert.equal(shouldLoadProviderPages(false), false)
    assert.equal(shouldLoadProviderPages(true), true)
  })

  test('locked wins over every other state', () => {
    assert.equal(
      resolveProviderPagesViewState({ ...base, unlocked: false, pageCount: 3 }),
      'locked'
    )
  })
})

describe('pages-list-view — branch selection', () => {
  test('pending wins while a load is in flight', () => {
    assert.equal(resolveProviderPagesViewState({ ...base, pending: true, pageCount: 3 }), 'loading')
  })

  test('the error message selects the error branch', () => {
    assert.equal(resolveProviderPagesViewState({ ...base, errorMessage: 'boom' }), 'error')
  })

  test('a not-yet-loaded screen is loading', () => {
    assert.equal(resolveProviderPagesViewState({ ...base, loaded: false }), 'loading')
  })

  test('empty and list are selected from the page count', () => {
    assert.equal(resolveProviderPagesViewState(base), 'empty')
    assert.equal(resolveProviderPagesViewState({ ...base, pageCount: 2 }), 'list')
  })
})
