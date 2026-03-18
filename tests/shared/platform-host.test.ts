import * as assert from 'node:assert/strict'
import test from 'node:test'

import { isPlatformHost } from '../../shared/utils/platform-host'

test('isPlatformHost: matches exact platform domain', () => {
  assert.equal(isPlatformHost('keova.fr', 'keova.fr'), true)
})

test('isPlatformHost: matches subdomain of platform domain', () => {
  assert.equal(isPlatformHost('www.keova.fr', 'keova.fr'), true)
  assert.equal(isPlatformHost('staging.keova.fr', 'keova.fr'), true)
})

test('isPlatformHost: treats localhost hosts as platform hosts', () => {
  assert.equal(isPlatformHost('localhost', 'keova.fr'), true)
  assert.equal(isPlatformHost('127.0.0.1', 'keova.fr'), true)
  assert.equal(isPlatformHost('0.0.0.0', 'keova.fr'), true)
})

test('isPlatformHost: returns false for white-label custom domain', () => {
  assert.equal(isPlatformHost('sophiejouan.test', 'keova.fr'), false)
  assert.equal(isPlatformHost('coach.example.org', 'keova.fr'), false)
})

test('isPlatformHost: normalizes casing and surrounding spaces', () => {
  assert.equal(isPlatformHost('  WWW.KEOVA.FR  ', ' Keova.Fr '), true)
  assert.equal(isPlatformHost('  sophiejouan.test ', ' keova.fr '), false)
})

test('isPlatformHost: empty hostname falls back to platform behavior', () => {
  assert.equal(isPlatformHost('', 'keova.fr'), true)
})

test('isPlatformHost: strips port before comparison (server-side hosts)', () => {
  assert.equal(isPlatformHost('localhost:3000', 'keova.fr'), true)
  assert.equal(isPlatformHost('keova.fr:443', 'keova.fr'), true)
  assert.equal(isPlatformHost('sophiejouan.test:3000', 'keova.fr'), false)
})
