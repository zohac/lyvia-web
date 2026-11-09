import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  IGNORE_ERRORS,
  isIgnoredError
} from '../../app/features/observability/sentry-ignore-errors'

test('ignoreErrors: does not contain a catch-all', () => {
  assert.equal(IGNORE_ERRORS.some(e => e === '/.*/' || (e instanceof RegExp && e.source === '.*')), false)
})

test('ignoreErrors: does not contain unsafe-eval', () => {
  assert.equal(IGNORE_ERRORS.includes('unsafe-eval'), false)
})

test('ignoreErrors: a typical application exception is not ignored', () => {
  assert.equal(isIgnoredError('TypeError: Cannot read properties of undefined (reading "foo")'), false)
})

test('ignoreErrors: known browser noise is ignored', () => {
  assert.equal(isIgnoredError('ResizeObserver loop limit exceeded'), true)
  assert.equal(isIgnoredError('Failed to fetch'), true)
})
