import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext } from '../../shared/utils/domain-context'

const PLATFORM = 'kaora.app'

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

// --- platform detection ---

test('getDomainContext: exact platform domain → isPlatform true', () => {
  const ctx = getDomainContext('kaora.app', PLATFORM)
  assert.equal(ctx.isPlatform, true)
})

test('getDomainContext: subdomain www.kaora.app → isPlatform true', () => {
  assert.equal(getDomainContext('www.kaora.app', PLATFORM).isPlatform, true)
})

test('getDomainContext: subdomain staging.kaora.app → isPlatform true', () => {
  assert.equal(getDomainContext('staging.kaora.app', PLATFORM).isPlatform, true)
})

test('getDomainContext: localhost variants → isPlatform true', () => {
  assert.equal(getDomainContext('localhost', PLATFORM).isPlatform, true)
  assert.equal(getDomainContext('127.0.0.1', PLATFORM).isPlatform, true)
  assert.equal(getDomainContext('0.0.0.0', PLATFORM).isPlatform, true)
})

test('getDomainContext: localhost with port → isPlatform true', () => {
  assert.equal(getDomainContext('localhost:3000', PLATFORM).isPlatform, true)
})

test('getDomainContext: white-label domain → isPlatform false', () => {
  assert.equal(getDomainContext('sophie-jouan.fr', PLATFORM).isPlatform, false)
  assert.equal(getDomainContext('custom-domain.com', PLATFORM).isPlatform, false)
})

test('getDomainContext: empty hostname → isPlatform true (safe fallback)', () => {
  assert.equal(getDomainContext('', PLATFORM).isPlatform, true)
})

test('getDomainContext: mixed casing → normalized hostname', () => {
  const ctx = getDomainContext('  WWW.KAORA.APP  ', PLATFORM)
  assert.equal(ctx.isPlatform, true)
  assert.equal(ctx.hostname, 'www.kaora.app')
})

// --- hostname normalization ---

test('getDomainContext: strips port from hostname', () => {
  assert.equal(getDomainContext('kaora.app:443', PLATFORM).hostname, 'kaora.app')
})

test('getDomainContext: trims whitespace', () => {
  assert.equal(getDomainContext('  sophie-jouan.fr  ', PLATFORM).hostname, 'sophie-jouan.fr')
})

test('getDomainContext: lowercases hostname', () => {
  assert.equal(getDomainContext('Sophie-Jouan.FR', PLATFORM).hostname, 'sophie-jouan.fr')
})

// --- robotsDisallowPaths ---

test('getDomainContext: platform has auth paths only, no /coaches', () => {
  const ctx = getDomainContext('kaora.app', PLATFORM)
  assert.deepStrictEqual(ctx.robotsDisallowPaths, AUTH_PATHS)
})

test('getDomainContext: white-label has auth paths + /coaches', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM)
  for (const path of AUTH_PATHS) {
    assert.ok(ctx.robotsDisallowPaths.includes(path), `missing ${path}`)
  }
  assert.ok(ctx.robotsDisallowPaths.includes('/coaches'))
})

test('getDomainContext: localhost same as platform (no /coaches)', () => {
  const ctx = getDomainContext('localhost', PLATFORM)
  assert.equal(ctx.robotsDisallowPaths.includes('/coaches'), false)
})
