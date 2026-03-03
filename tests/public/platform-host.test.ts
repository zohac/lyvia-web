import * as assert from 'node:assert/strict'
import test from 'node:test'

import { isPlatformHost } from '../../app/features/public/domain/platform-host'

test('isPlatformHost: matches exact platform domain', () => {
  assert.equal(isPlatformHost('kaora.app', 'kaora.app'), true)
})

test('isPlatformHost: matches subdomain of platform domain', () => {
  assert.equal(isPlatformHost('www.kaora.app', 'kaora.app'), true)
  assert.equal(isPlatformHost('staging.kaora.app', 'kaora.app'), true)
})

test('isPlatformHost: treats localhost hosts as platform hosts', () => {
  assert.equal(isPlatformHost('localhost', 'kaora.app'), true)
  assert.equal(isPlatformHost('127.0.0.1', 'kaora.app'), true)
  assert.equal(isPlatformHost('0.0.0.0', 'kaora.app'), true)
})

test('isPlatformHost: returns false for white-label custom domain', () => {
  assert.equal(isPlatformHost('sophiejouan.test', 'kaora.app'), false)
  assert.equal(isPlatformHost('coach.example.org', 'kaora.app'), false)
})

test('isPlatformHost: normalizes casing and surrounding spaces', () => {
  assert.equal(isPlatformHost('  WWW.KAORA.APP  ', ' Kaora.App '), true)
  assert.equal(isPlatformHost('  sophiejouan.test ', ' kaora.app '), false)
})

test('isPlatformHost: empty hostname falls back to platform behavior', () => {
  assert.equal(isPlatformHost('', 'kaora.app'), true)
})
