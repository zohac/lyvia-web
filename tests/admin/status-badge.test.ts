import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getStatusBadgeClasses, STATUS_BADGE_BASE, STATUS_DOT_BASE } from '../../app/composables/useAdminBadges'

test('getStatusBadgeClasses: success variant uses DS success tokens', () => {
  const result = getStatusBadgeClasses('success')
  assert.ok(result.badge.includes(STATUS_BADGE_BASE))
  assert.ok(result.badge.includes('--color-success'))
  assert.ok(result.dot.includes(STATUS_DOT_BASE))
  assert.ok(result.dot.includes('--color-success'))
})

test('getStatusBadgeClasses: error variant uses DS error tokens', () => {
  const result = getStatusBadgeClasses('error')
  assert.ok(result.badge.includes(STATUS_BADGE_BASE))
  assert.ok(result.badge.includes('--color-error'))
  assert.ok(result.dot.includes('--color-error'))
})

test('getStatusBadgeClasses: warning variant uses DS sunset tokens', () => {
  const result = getStatusBadgeClasses('warning')
  assert.ok(result.badge.includes('--color-sunset'))
  assert.ok(result.dot.includes('--color-sunset'))
})

test('getStatusBadgeClasses: neutral variant uses DS neutral tokens', () => {
  const result = getStatusBadgeClasses('neutral')
  assert.ok(result.badge.includes('--color-neutral'))
  assert.ok(result.dot.includes('--color-neutral'))
})

test('getStatusBadgeClasses: all variants include base classes and use CSS var tokens', () => {
  const variants = ['success', 'error', 'warning', 'neutral'] as const
  for (const v of variants) {
    const result = getStatusBadgeClasses(v)
    assert.ok(result.badge.includes(STATUS_BADGE_BASE), `${v} badge missing base`)
    assert.ok(result.dot.includes(STATUS_DOT_BASE), `${v} dot missing base`)
    assert.ok(result.badge.includes('var(--color-'), `${v} badge should use CSS var tokens`)
    assert.ok(result.dot.includes('var(--color-'), `${v} dot should use CSS var tokens`)
  }
})
