import * as assert from 'node:assert/strict'
import test from 'node:test'

import { buildSentryOptions } from '../../app/features/observability/sentry-options'
import {
  BROWSER_RELEASE_FALLBACK_WARNING,
  applyReleaseToPublicConfig,
  normaliseBrowserRelease
} from '../../app/features/observability/release-transport'
import { resolveRelease } from '../../app/features/observability/resolve-release'

const FULL_SHA = '0123456789abcdef0123456789abcdef01234567'

// These tests execute the two functions that decide what the browser SDK
// actually receives. They are the mutation-proof of AC-6 #4 (an empty release
// sent to the browser) and #5 (a semantic version carried by the `release`
// tag): both mutations live in `normaliseBrowserRelease`, not in the resolver.

test('transport: a deployment SHA passes through unchanged', () => {
  assert.equal(normaliseBrowserRelease('abc123def456'), 'abc123def456')
  assert.equal(normaliseBrowserRelease(FULL_SHA), FULL_SHA)
})

test('transport: surrounding whitespace is trimmed, not rejected', () => {
  assert.equal(normaliseBrowserRelease('  abc123def456\n'), 'abc123def456')
})

test('transport: an empty or blank value becomes the explicit unknown', () => {
  assert.equal(normaliseBrowserRelease(''), 'unknown')
  assert.equal(normaliseBrowserRelease('   '), 'unknown')
})

test('transport: a missing or non-string value becomes unknown', () => {
  assert.equal(normaliseBrowserRelease(undefined), 'unknown')
  assert.equal(normaliseBrowserRelease(null), 'unknown')
  assert.equal(normaliseBrowserRelease(42), 'unknown')
  assert.equal(normaliseBrowserRelease({ release: 'abc' }), 'unknown')
})

test('transport: a semantic version never reaches the SDK as a release', () => {
  assert.equal(normaliseBrowserRelease('1.2.3'), 'unknown')
  assert.equal(normaliseBrowserRelease('v1.2.3-rc.1'), 'unknown')
  assert.equal(normaliseBrowserRelease('0.0.1'), 'unknown')
})

test('transport: a date never reaches the SDK as a release', () => {
  assert.equal(normaliseBrowserRelease('2026-11-09'), 'unknown')
  assert.equal(normaliseBrowserRelease('2026-11-09T12:00:00Z'), 'unknown')
})

test('transport: the browser fallback warning names the fallback and the tag', () => {
  assert.match(BROWSER_RELEASE_FALLBACK_WARNING, /Sentry release is unresolved/)
  assert.match(BROWSER_RELEASE_FALLBACK_WARNING, /"unknown"/)
})

test('transport: the release is written into a public runtime config object', () => {
  const publicConfig: Record<string, unknown> = { release: '', sentryDsn: 'https://k@x.test/1' }
  assert.equal(applyReleaseToPublicConfig(publicConfig, 'abc123def456'), true)
  assert.equal(publicConfig.release, 'abc123def456')
  // Untouched neighbours: the injection must not drop the rest of the config.
  assert.equal(publicConfig.sentryDsn, 'https://k@x.test/1')
})

test('transport: an absent config target is reported, not thrown', () => {
  assert.equal(applyReleaseToPublicConfig(undefined, 'abc123def456'), false)
  assert.equal(applyReleaseToPublicConfig(null, 'abc123def456'), false)
})

test('transport: resolved release, normalised value and SDK option are the same SHA', () => {
  const resolved = resolveRelease({ CONTAINER_VERSION: 'abc123def456' })
  const options = buildSentryOptions({
    dsn: 'https://k@x.test/1',
    tenant: 'keova.fr',
    release: normaliseBrowserRelease(resolved.release)
  })
  assert.equal(options.release, 'abc123def456')
})

test('transport: an unresolved config yields the explicit unknown in the SDK options', () => {
  const options = buildSentryOptions({
    dsn: 'https://k@x.test/1',
    tenant: 'keova.fr',
    release: normaliseBrowserRelease('')
  })
  assert.equal(options.release, 'unknown')
})
