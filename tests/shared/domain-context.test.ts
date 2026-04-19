import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext, getSeoReferenceOrigin } from '../../shared/utils/domain-context'

const PLATFORM = 'keova.fr'
const PLATFORM_B2B = 'keova.app'

const AUTH_PATHS = [
  '/client/',
  '/provider/',
  '/admin/',
  '/api/',
  '/login',
  '/reset-password',
  '/verify-email',
  '/forgot-password'
]

// ========================================
// LEGACY MODE (2 params — backward compat)
// ========================================

test('getDomainContext [legacy]: exact platform domain → isPlatform true', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM)
  assert.equal(ctx.isPlatform, true)
})

test('getDomainContext [legacy]: subdomain www.keova.fr → isPlatform true', () => {
  assert.equal(getDomainContext('www.keova.fr', PLATFORM).isPlatform, true)
})

test('getDomainContext [legacy]: subdomain staging.keova.fr → isPlatform true', () => {
  assert.equal(getDomainContext('staging.keova.fr', PLATFORM).isPlatform, true)
})

test('getDomainContext [legacy]: localhost variants → isPlatform true', () => {
  assert.equal(getDomainContext('localhost', PLATFORM).isPlatform, true)
  assert.equal(getDomainContext('127.0.0.1', PLATFORM).isPlatform, true)
  assert.equal(getDomainContext('0.0.0.0', PLATFORM).isPlatform, true)
})

test('getDomainContext [legacy]: localhost with port → isPlatform true', () => {
  assert.equal(getDomainContext('localhost:3000', PLATFORM).isPlatform, true)
})

test('getDomainContext [legacy]: white-label domain → isPlatform false', () => {
  assert.equal(getDomainContext('sophie-jouan.fr', PLATFORM).isPlatform, false)
  assert.equal(getDomainContext('custom-domain.com', PLATFORM).isPlatform, false)
})

test('getDomainContext [legacy]: empty hostname → isPlatform true (safe fallback)', () => {
  assert.equal(getDomainContext('', PLATFORM).isPlatform, true)
})

test('getDomainContext [legacy]: mixed casing → normalized hostname', () => {
  const ctx = getDomainContext('  WWW.KEOVA.FR  ', PLATFORM)
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.hostname, 'www.keova.fr')
})

// --- hostname normalization ---

test('getDomainContext: strips port from hostname', () => {
  assert.equal(getDomainContext('keova.fr:443', PLATFORM).hostname, 'keova.fr')
})

test('getDomainContext: trims whitespace', () => {
  assert.equal(getDomainContext('  sophie-jouan.fr  ', PLATFORM).hostname, 'sophie-jouan.fr')
})

test('getDomainContext: lowercases hostname', () => {
  assert.equal(getDomainContext('Sophie-Jouan.FR', PLATFORM).hostname, 'sophie-jouan.fr')
})

// --- legacy robotsDisallowPaths ---

test('getDomainContext [legacy]: platform has auth paths + b2b extra + /articles', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM)
  // Legacy mode: platform = b2b → includes /coaches, /coach/, /articles
  assert.deepStrictEqual(
    [...ctx.robotsDisallowPaths],
    [...AUTH_PATHS, '/coaches', '/coach/', '/articles']
  )
})

test('getDomainContext [legacy]: white-label has auth paths + /coaches + /articles', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM)
  for (const path of AUTH_PATHS) {
    assert.ok(ctx.robotsDisallowPaths.includes(path), `missing ${path}`)
  }
  assert.ok(ctx.robotsDisallowPaths.includes('/coaches'))
  assert.ok(ctx.robotsDisallowPaths.includes('/articles'))
})

test('getDomainContext [legacy]: localhost same as platform', () => {
  const ctx = getDomainContext('localhost', PLATFORM)
  assert.equal(ctx.isPlatform, true)
})

// --- legacy role field ---

test('getDomainContext [legacy]: platform domain → role b2b (legacy fallback)', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM)
  assert.equal(ctx.role, 'b2b')
  assert.equal(ctx.isB2B, true)
  assert.equal(ctx.isB2C, false)
})

test('getDomainContext [legacy]: white-label → role white-label', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM)
  assert.equal(ctx.role, 'white-label')
  assert.equal(ctx.isWhiteLabel, true)
  assert.equal(ctx.isPlatform, false)
})

// ========================================
// TRI-MODAL MODE (3 params)
// ========================================

test('getDomainContext [tri-modal]: keova.fr → role b2c, isPlatform true', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2c')
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.isB2C, true)
  assert.equal(ctx.isB2B, false)
  assert.equal(ctx.isWhiteLabel, false)
})

test('getDomainContext [tri-modal]: www.keova.fr → role b2c (subdomain)', () => {
  const ctx = getDomainContext('www.keova.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2c')
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.isB2C, true)
})

test('getDomainContext [tri-modal]: keova.app → role b2b, isPlatform true', () => {
  const ctx = getDomainContext('keova.app', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2b')
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.isB2B, true)
  assert.equal(ctx.isB2C, false)
  assert.equal(ctx.isWhiteLabel, false)
})

test('getDomainContext [tri-modal]: www.keova.app → role b2b (subdomain)', () => {
  const ctx = getDomainContext('www.keova.app', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2b')
  assert.equal(ctx.isB2B, true)
})

test('getDomainContext [tri-modal]: localhost → role b2b (dev default)', () => {
  const ctx = getDomainContext('localhost', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2b')
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.isB2B, true)
})

test('getDomainContext [tri-modal]: empty hostname → role b2b (safe fallback)', () => {
  const ctx = getDomainContext('', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'b2b')
  assert.equal(ctx.isPlatform, true)
})

test('getDomainContext [tri-modal]: sophie-jouan.fr → role white-label', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(ctx.role, 'white-label')
  assert.equal(ctx.isPlatform, false)
  assert.equal(ctx.isWhiteLabel, true)
  assert.equal(ctx.isB2C, false)
  assert.equal(ctx.isB2B, false)
})

// --- tri-modal robotsDisallowPaths ---

test('getDomainContext [tri-modal]: b2c has auth paths only (allows /articles)', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM, PLATFORM_B2B)
  assert.deepStrictEqual([...ctx.robotsDisallowPaths], AUTH_PATHS)
  // Story 0-22: /articles doit être crawlable sur B2C
  assert.ok(!ctx.robotsDisallowPaths.includes('/articles'))
})

test('getDomainContext [tri-modal]: b2b has auth paths + /coaches + /coach/ + /articles', () => {
  const ctx = getDomainContext('keova.app', PLATFORM, PLATFORM_B2B)
  assert.deepStrictEqual(
    [...ctx.robotsDisallowPaths],
    [...AUTH_PATHS, '/coaches', '/coach/', '/articles']
  )
})

test('getDomainContext [tri-modal]: white-label has auth paths + /coaches + /articles', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  assert.deepStrictEqual(
    [...ctx.robotsDisallowPaths],
    [...AUTH_PATHS, '/coaches', '/articles']
  )
})

test('getDomainContext [tri-modal]: empty B2B domain behaves like legacy mode', () => {
  const platformCtx = getDomainContext('keova.fr', PLATFORM, '')
  assert.equal(platformCtx.role, 'b2b')
  assert.equal(platformCtx.isPlatform, true)
  assert.equal(platformCtx.isB2B, true)
  assert.equal(platformCtx.isB2C, false)

  const whiteLabelCtx = getDomainContext('sophie-jouan.fr', PLATFORM, '')
  assert.equal(whiteLabelCtx.role, 'white-label')
  assert.equal(whiteLabelCtx.isPlatform, false)
  assert.equal(whiteLabelCtx.isWhiteLabel, true)
})

// ========================================
// getSeoReferenceOrigin
// ========================================

test('getSeoReferenceOrigin: B2C → actual host origin', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(getSeoReferenceOrigin(ctx, PLATFORM), 'https://keova.fr')
})

test('getSeoReferenceOrigin: B2B → own domain (keova.app), not keova.fr', () => {
  const ctx = getDomainContext('keova.app', PLATFORM, PLATFORM_B2B)
  assert.equal(getSeoReferenceOrigin(ctx, PLATFORM), 'https://keova.app')
})

test('getSeoReferenceOrigin: white-label → actual host origin', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(getSeoReferenceOrigin(ctx, PLATFORM), 'https://sophie-jouan.fr')
})

test('getSeoReferenceOrigin: localhost (B2B dev) → own hostname', () => {
  const ctx = getDomainContext('localhost', PLATFORM, PLATFORM_B2B)
  assert.equal(getSeoReferenceOrigin(ctx, PLATFORM), 'https://localhost')
})

test('getSeoReferenceOrigin [legacy]: platform → platform origin', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM)
  // Legacy mode: keova.fr is B2B → returns platform origin
  assert.equal(getSeoReferenceOrigin(ctx, PLATFORM), 'https://keova.fr')
})
