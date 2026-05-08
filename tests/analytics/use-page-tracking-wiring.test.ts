import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-32 — AC-6 wiring coverage of `usePageTracking`.
 *
 * The composable runs inside Vue's onMounted lifecycle and reads `window`
 * globals — running it in isolation requires a full Nuxt mount harness which
 * the test infrastructure of this project does not provide. We therefore use
 * the same structural approach as scheduling-page-wiring: read the `.ts`
 * source and assert the exact lines that implement the AC.
 *
 * Breaking either branch (extractor not invoked, payload always assigned, or
 * payload never assigned) makes one of these assertions fail.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const COMPOSABLE_PATH = 'features/analytics/usePageTracking.ts'

function readSource(): string {
  return fs.readFileSync(path.join(appRoot, COMPOSABLE_PATH), 'utf-8')
}

describe('0-32 — usePageTracking wiring (AC-6 paidClickIds)', () => {
  test('imports extractClickIds from the pure helper', () => {
    const source = readSource()
    assert.match(
      source,
      /import\s+\{\s*extractClickIds\s*\}\s+from\s+['"]\.\/helpers\/extract-click-ids['"]/
    )
  })

  test('invokes extractClickIds with window.location.search', () => {
    const source = readSource()
    assert.match(source, /extractClickIds\(\s*window\.location\.search\s*\)/)
  })

  test('only assigns paidClickIds to body when clickIds object is non-empty (AC-6 branch present)', () => {
    const source = readSource()
    // Conditional guard: must check Object.keys(clickIds).length > 0
    assert.match(
      source,
      /Object\.keys\(\s*clickIds\s*\)\.length\s*>\s*0/
    )
    // Then assigns into body.paidClickIds
    assert.match(source, /body\.paidClickIds\s*=\s*clickIds/)
  })

  test('does NOT include paidClickIds in the initial body literal (AC-6 branch absent)', () => {
    const source = readSource()
    // The base body object must NOT pre-set paidClickIds — otherwise the empty
    // case would always send paidClickIds: {} which is precisely what AC-6
    // forbids ("ne l'inclut PAS (clé absente du payload, pas null) si vide").
    const bodyLiteral
      = source.match(/const\s+body:\s*TrackPageViewRequest\s*=\s*\{[\s\S]*?\}/)?.[0]
    assert.ok(bodyLiteral, 'body literal must exist')
    assert.equal(
      /paidClickIds\s*:/.test(bodyLiteral as string),
      false,
      'paidClickIds must not be inside the initial body literal — only assigned conditionally afterwards'
    )
  })
})
