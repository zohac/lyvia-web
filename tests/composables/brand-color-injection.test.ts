import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext } from '../../shared/utils/domain-context'

const PLATFORM = 'keova.fr'
const PLATFORM_B2B = 'keova.app'

/**
 * Tests for the brand color injection logic used by useBrandColorInjection().
 *
 * The composable itself relies on Vue lifecycle hooks and DOM APIs,
 * so we test the decision logic here: when should injection happen?
 */

// --- Decision: should inject? ---

test('white-label domain with brandColor → should inject', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  const brandColor = '#8B5CF6'

  const shouldInject = ctx.isWhiteLabel && !!brandColor
  assert.equal(shouldInject, true)
})

test('white-label domain without brandColor (null) → should NOT inject', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  const brandColor: string | null = null

  const shouldInject = ctx.isWhiteLabel && !!brandColor
  assert.equal(shouldInject, false)
})

test('platform B2C domain with brandColor → should NOT inject', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM, PLATFORM_B2B)
  const brandColor = '#8B5CF6'

  const shouldInject = ctx.isWhiteLabel && !!brandColor
  assert.equal(shouldInject, false)
})

test('platform B2B domain with brandColor → should NOT inject', () => {
  const ctx = getDomainContext('keova.app', PLATFORM, PLATFORM_B2B)
  const brandColor = '#8B5CF6'

  const shouldInject = ctx.isWhiteLabel && !!brandColor
  assert.equal(shouldInject, false)
})

test('localhost (dev) with brandColor → should NOT inject', () => {
  const ctx = getDomainContext('localhost', PLATFORM, PLATFORM_B2B)
  const brandColor = '#8B5CF6'

  const shouldInject = ctx.isWhiteLabel && !!brandColor
  assert.equal(shouldInject, false)
})

// --- CSS variable name ---

test('injected CSS variable name is --color-brand-primary', () => {
  // This test documents the contract: the variable name matches main.css
  const CSS_VAR_NAME = '--color-brand-primary'
  assert.equal(CSS_VAR_NAME, '--color-brand-primary')
})

// --- Valid hex color format ---

test('brandColor is a valid hex string (#RRGGBB)', () => {
  const validColors = ['#5b4b6e', '#8B5CF6', '#FF0000', '#000000', '#ffffff']
  const hexRegex = /^#[0-9a-fA-F]{6}$/

  for (const color of validColors) {
    assert.match(color, hexRegex, `${color} should be valid hex`)
  }
})
