import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolveAlternateHref } from '../../shared/utils/resolve-alternate-href'

test('resolveAlternateHref: B2B fallback uses own domain (keova.app)', () => {
  assert.equal(resolveAlternateHref({
    hostname: 'keova.app',
    pathname: '/coach/sophie-jouan',
    platformDomain: 'keova.fr',
    platformDomainB2B: 'keova.app'
  }), 'https://keova.app/coach/sophie-jouan')
})

test('resolveAlternateHref: white-label fallback uses actual host', () => {
  assert.equal(resolveAlternateHref({
    hostname: 'sophiejouan.fr',
    pathname: '/onboarding/discovery',
    platformDomain: 'keova.fr',
    platformDomainB2B: 'keova.app'
  }), 'https://sophiejouan.fr/onboarding/discovery')
})

test('resolveAlternateHref: canonical override wins exactly', () => {
  assert.equal(resolveAlternateHref({
    hostname: 'keova.fr',
    pathname: '/coach/sophie-jouan',
    platformDomain: 'keova.fr',
    platformDomainB2B: 'keova.app',
    canonicalHref: 'https://sophiejouan.fr/'
  }), 'https://sophiejouan.fr/')
})
