import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatReleaseFallbackWarning,
  resolveRelease,
  warnOnUnresolvedRelease,
  type ResolvedRelease
} from '../../app/features/observability/resolve-release'

test('resolveRelease: CONTAINER_VERSION is preferred over SOURCE_VERSION', () => {
  const result = resolveRelease({
    CONTAINER_VERSION: 'container-sha',
    SOURCE_VERSION: 'source-sha'
  })
  assert.equal(result.release, 'container-sha')
  assert.equal(result.reason, 'container-version')
  assert.deepEqual(result.rejected, [])
})

test('resolveRelease: SOURCE_VERSION is used when CONTAINER_VERSION is absent', () => {
  const result = resolveRelease({ SOURCE_VERSION: 'source-sha' })
  assert.equal(result.release, 'source-sha')
  assert.equal(result.reason, 'source-version')
  assert.deepEqual(result.rejected, [])
})

test('resolveRelease: falls back to unknown when both are absent', () => {
  const result = resolveRelease({})
  assert.equal(result.release, 'unknown')
  assert.equal(result.reason, 'fallback')
  assert.deepEqual(result.rejected, [])
})

test('resolveRelease: blank values are treated as absent', () => {
  const result = resolveRelease({ CONTAINER_VERSION: '   ', SOURCE_VERSION: '' })
  assert.equal(result.release, 'unknown')
  assert.equal(result.reason, 'fallback')
})

test('resolveRelease: a semantic version is rejected and falls through', () => {
  const result = resolveRelease({ CONTAINER_VERSION: '1.2.3', SOURCE_VERSION: 'source-sha' })
  assert.equal(result.release, 'source-sha')
  assert.equal(result.reason, 'source-version')
  assert.equal(result.rejected.length, 1)
  assert.equal(result.rejected[0].variable, 'CONTAINER_VERSION')
  assert.equal(result.rejected[0].shape, 'semver')
})

test('resolveRelease: a version with a pre-release tag is rejected', () => {
  const result = resolveRelease({ CONTAINER_VERSION: 'v1.2.3-rc.1' })
  assert.equal(result.release, 'unknown')
  assert.equal(result.reason, 'fallback')
  assert.equal(result.rejected[0].shape, 'semver')
})

test('resolveRelease: a date is rejected and falls through', () => {
  const result = resolveRelease({ CONTAINER_VERSION: '2026-11-09', SOURCE_VERSION: 'source-sha' })
  assert.equal(result.release, 'source-sha')
  assert.equal(result.reason, 'source-version')
  assert.equal(result.rejected[0].shape, 'date')
})

test('resolveRelease: a date with a time is rejected', () => {
  const result = resolveRelease({ CONTAINER_VERSION: '2026-11-09T12:00:00Z' })
  assert.equal(result.release, 'unknown')
  assert.equal(result.reason, 'fallback')
  assert.equal(result.rejected[0].shape, 'date')
})

test('resolveRelease: a non-SHA-shaped value that is not semver/date passes through', () => {
  const result = resolveRelease({ CONTAINER_VERSION: 'abc123def' })
  assert.equal(result.release, 'abc123def')
  assert.equal(result.reason, 'container-version')
  assert.deepEqual(result.rejected, [])
})

test('resolveRelease: undefined env is handled', () => {
  const result = resolveRelease(undefined as unknown as Record<string, string | undefined>)
  assert.equal(result.release, 'unknown')
  assert.equal(result.reason, 'fallback')
})

test('resolveRelease: is pure — no console output even on fallback', () => {
  const originalWarn = console.warn
  const originalError = console.error
  let warned = false
  let errored = false
  console.warn = () => {
    warned = true
  }
  console.error = () => {
    errored = true
  }
  try {
    resolveRelease({})
    resolveRelease({ CONTAINER_VERSION: '1.2.3' })
  } finally {
    console.warn = originalWarn
    console.error = originalError
  }
  assert.equal(warned, false)
  assert.equal(errored, false)
})

test('resolveRelease: does not read process.env', () => {
  const previous = process.env.CONTAINER_VERSION
  process.env.CONTAINER_VERSION = 'from-process-env'
  try {
    const result = resolveRelease({})
    assert.equal(result.release, 'unknown')
    assert.equal(result.reason, 'fallback')
  } finally {
    if (previous === undefined) delete process.env.CONTAINER_VERSION
    else process.env.CONTAINER_VERSION = previous
  }
})

test('formatReleaseFallbackWarning: null when nothing to report', () => {
  const resolved: ResolvedRelease = { release: 'abc', reason: 'container-version', rejected: [] }
  assert.equal(formatReleaseFallbackWarning(resolved), null)
})

test('warnOnUnresolvedRelease: emits the fallback warn naming the variables and the value', () => {
  const calls: unknown[][] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    calls.push(args)
  }
  try {
    warnOnUnresolvedRelease(resolveRelease({}))
  } finally {
    console.warn = originalWarn
  }
  assert.equal(calls.length, 1)
  assert.equal(
    calls[0][0],
    '[observability] Sentry release fallback: CONTAINER_VERSION and SOURCE_VERSION are both absent or unusable; using unknown'
  )
})

test('warnOnUnresolvedRelease: emits one warn per rejected value', () => {
  const calls: unknown[][] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    calls.push(args)
  }
  try {
    warnOnUnresolvedRelease(resolveRelease({ CONTAINER_VERSION: '1.2.3' }))
  } finally {
    console.warn = originalWarn
  }
  assert.equal(calls.length, 2)
  assert.match(String(calls[0][0]), /ignoring CONTAINER_VERSION="1.2.3" \(semver/)
  assert.match(String(calls[1][0]), /Sentry release fallback/)
})
