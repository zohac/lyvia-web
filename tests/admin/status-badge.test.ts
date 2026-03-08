import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getStatusBadgeClasses, STATUS_BADGE_BASE, STATUS_DOT_BASE } from '../../app/composables/useAdminBadges'

test('getStatusBadgeClasses: success variant includes base + success classes', () => {
  const result = getStatusBadgeClasses('success')
  assert.ok(result.badge.includes(STATUS_BADGE_BASE))
  assert.ok(result.badge.includes('success'))
  assert.ok(result.dot.includes(STATUS_DOT_BASE))
  assert.ok(result.dot.includes('success'))
})

test('getStatusBadgeClasses: error variant includes red classes', () => {
  const result = getStatusBadgeClasses('error')
  assert.ok(result.badge.includes(STATUS_BADGE_BASE))
  assert.ok(result.badge.includes('red'))
  assert.ok(result.dot.includes('red'))
})

test('getStatusBadgeClasses: warning variant includes amber classes', () => {
  const result = getStatusBadgeClasses('warning')
  assert.ok(result.badge.includes('amber'))
  assert.ok(result.dot.includes('amber'))
})

test('getStatusBadgeClasses: neutral variant includes neutral classes', () => {
  const result = getStatusBadgeClasses('neutral')
  assert.ok(result.badge.includes('neutral'))
  assert.ok(result.dot.includes('neutral'))
})

test('getStatusBadgeClasses: all variants include base classes', () => {
  const variants = ['success', 'error', 'warning', 'neutral'] as const
  for (const v of variants) {
    const result = getStatusBadgeClasses(v)
    assert.ok(result.badge.includes(STATUS_BADGE_BASE), `${v} badge missing base`)
    assert.ok(result.dot.includes(STATUS_DOT_BASE), `${v} dot missing base`)
  }
})
