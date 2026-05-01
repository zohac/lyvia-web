import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-28 — wiring tests for the `previewMode` prop added to
 * CoachPageSignature + CoachPageEssentiel and the resulting side-effect
 * neutralisation (sticky CTA, scroll-reveal, exit-intent, layout header
 * hide). The page publique `/coach/[slug]` must keep its original
 * behaviour when `previewMode === false` (default).
 */

const appRoot = path.resolve(process.cwd(), 'app')
const SIGNATURE_PATH = 'components/templates/coach-pages/CoachPageSignature.vue'
const ESSENTIEL_PATH = 'components/templates/coach-pages/CoachPageEssentiel.vue'
const SCROLL_REVEAL_PATH = 'composables/useScrollReveal.ts'

function read(p: string): string {
  return fs.readFileSync(path.join(appRoot, p), 'utf-8')
}

describe('0-28 — previewMode prop on coach templates', () => {
  test('CoachPageSignature defines previewMode?: boolean on its props', () => {
    const source = read(SIGNATURE_PATH)
    assert.match(
      source,
      /previewMode\?:\s*boolean/,
      'CoachPageSignature must expose previewMode?: boolean prop'
    )
  })

  test('CoachPageEssentiel defines previewMode?: boolean on its props', () => {
    const source = read(ESSENTIEL_PATH)
    assert.match(
      source,
      /previewMode\?:\s*boolean/,
      'CoachPageEssentiel must expose previewMode?: boolean prop'
    )
  })

  test('Signature opts out of useScrollReveal when previewMode is true', () => {
    const source = read(SIGNATURE_PATH)
    assert.match(
      source,
      /useScrollReveal\(\{\s*disabled:\s*props\.previewMode\s*\}\)/,
      'CoachPageSignature must call useScrollReveal({ disabled: props.previewMode })'
    )
  })

  test('Essentiel opts out of useScrollReveal when previewMode is true', () => {
    const source = read(ESSENTIEL_PATH)
    assert.match(
      source,
      /useScrollReveal\(\{\s*disabled:\s*props\.previewMode\s*\}\)/,
      'CoachPageEssentiel must call useScrollReveal({ disabled: props.previewMode })'
    )
  })

  test('Signature skips useExitIntent when previewMode is true', () => {
    const source = read(SIGNATURE_PATH)
    // The if (!props.previewMode) block guards the useExitIntent registration.
    assert.match(
      source,
      /if\s*\(\s*!props\.previewMode\s*\)\s*\{[\s\S]*?useExitIntent\(/,
      'CoachPageSignature must guard useExitIntent registration with !props.previewMode'
    )
  })

  test('Essentiel skips hide-layout-header side-effect when previewMode is true', () => {
    const source = read(ESSENTIEL_PATH)
    assert.match(
      source,
      /if\s*\(\s*!props\.previewMode\s*\)\s*\{[\s\S]*?hideLayoutHeader\.value\s*=\s*true/,
      'CoachPageEssentiel must guard hideLayoutHeader mutation with !props.previewMode'
    )
  })

  test('Signature hides StickyCtaMobile + spacer in preview mode', () => {
    const source = read(SIGNATURE_PATH)
    assert.match(
      source,
      /<StickyCtaMobile[\s\S]*?v-if="!previewMode"/,
      'CoachPageSignature must guard <StickyCtaMobile> with v-if="!previewMode"'
    )
  })

  test('Essentiel hides StickyCtaMobile + spacer in preview mode', () => {
    const source = read(ESSENTIEL_PATH)
    assert.match(
      source,
      /<StickyCtaMobile[\s\S]*?v-if="!previewMode"/,
      'CoachPageEssentiel must guard <StickyCtaMobile> with v-if="!previewMode"'
    )
  })

  test('useScrollReveal accepts a disabled flag and short-circuits to a no-op', () => {
    const source = read(SCROLL_REVEAL_PATH)
    // The composable must accept the disabled option…
    assert.match(
      source,
      /options\?:\s*\{[^}]*disabled\?:\s*boolean/,
      'useScrollReveal must accept an options.disabled?: boolean'
    )
    // …and short-circuit before creating any IntersectionObserver / lifecycle.
    assert.match(
      source,
      /if\s*\(\s*options\?\.disabled\s*\)\s*\{[\s\S]*?return\s*\{[\s\S]*?reveal:[\s\S]*?isReady[\s\S]*?\}/,
      'useScrollReveal must early-return a no-op { reveal, isReady } when disabled'
    )
  })
})
