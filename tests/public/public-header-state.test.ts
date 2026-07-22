import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Regression tests for B2B landing header state defaults.
 *
 * We can't import public-header.state.ts directly (it uses Nuxt's useState
 * which is unavailable in test context). Instead we verify the source file
 * content to ensure the default values match B2B expectations.
 *
 * This catches regressions where someone changes the defaults back to stale
 * values (L'Essence, Atelier, Parcours, Essayer Keova, layoutStyle: 'bar').
 */

const STATE_FILE = path.resolve(
  process.cwd(),
  'app/features/public/state/public-header.state.ts'
)
const source = fs.readFileSync(STATE_FILE, 'utf-8')

// ── Default header state (SSR consistency) ──

describe('PublicHeaderState defaults (source verification)', () => {
  it('layoutStyle should default to "dock" for SSR B2B consistency', () => {
    assert.ok(
      source.includes("layoutStyle: 'dock'"),
      'DEFAULT_HEADER_STATE should have layoutStyle: \'dock\''
    )
  })

  it('ctaLabel should be "Je réserve ma place"', () => {
    assert.ok(
      source.includes("ctaLabel: 'Je réserve ma place'"),
      'DEFAULT_HEADER_STATE should have ctaLabel: \'Je réserve ma place\''
    )
  })

  it('ctaTo should point to waitlist section', () => {
    assert.ok(
      source.includes("ctaTo: '#waitlist'"),
      'DEFAULT_HEADER_STATE should have ctaTo: \'#waitlist\''
    )
  })

  it('navLinks should contain "Le problème"', () => {
    assert.ok(
      source.includes("label: 'Le problème'"),
      'navLinks should include \'Le problème\''
    )
  })

  it('navLinks should contain "La solution"', () => {
    assert.ok(
      source.includes("label: 'La solution'"),
      'navLinks should include \'La solution\''
    )
  })

  // Libellé aligné sur `app/pages/index.vue` et `usePublicHeaderInit.ts` en code review
  // du 2026-07-22 : les 3 sources divergeaient (« Témoignage » au singulier ici et dans
  // le composable, « Témoignages » au pluriel dans index.vue), ce qui provoquait un
  // changement de libellé entre le premier paint et l'hydratation.
  it('navLinks should contain "Témoignages"', () => {
    assert.ok(
      source.includes("label: 'Témoignages'"),
      'navLinks should include \'Témoignages\''
    )
  })

  it('navLinks should contain "Tarifs" pointing at the pricing anchor', () => {
    assert.ok(
      source.includes("{ label: 'Tarifs', href: '#tarifs' }"),
      'navLinks should include the Tarifs entry'
    )
  })

  it('should not contain stale label "L\'Essence"', () => {
    assert.ok(
      !source.includes("label: 'L\\'Essence'"),
      'should not contain stale label L\'Essence'
    )
  })

  it('should not contain stale CTA "Essayer Keova"', () => {
    assert.ok(
      !source.includes("ctaLabel: 'Essayer Keova'"),
      'should not contain stale CTA Essayer Keova'
    )
  })

  it('should not default to layoutStyle "bar"', () => {
    // Ensure 'bar' does not appear as the default in DEFAULT_HEADER_STATE
    // (it can appear in type definitions, just not as the default value)
    const defaultBlock = source.substring(
      source.indexOf('DEFAULT_HEADER_STATE'),
      source.indexOf('}', source.indexOf('DEFAULT_HEADER_STATE')) + 1
    )
    assert.ok(
      !defaultBlock.includes("layoutStyle: 'bar'"),
      'DEFAULT_HEADER_STATE should not default to layoutStyle: \'bar\''
    )
  })
})

// ── usePublicHeaderInit B2B seeding ──

const INIT_FILE = path.resolve(
  process.cwd(),
  'app/composables/usePublicHeaderInit.ts'
)
const initSource = fs.readFileSync(INIT_FILE, 'utf-8')

describe('usePublicHeaderInit B2B seeding (source verification)', () => {
  it('should seed header state for platform domains (not return early)', () => {
    // The old code had `if (ctx.isPlatform) { return }` — it should now set the header
    assert.ok(
      initSource.includes("layoutStyle: 'dock'"),
      'usePublicHeaderInit should set layoutStyle dock for platform domains'
    )
  })

  it('should set B2B navLinks with correct labels', () => {
    assert.ok(
      initSource.includes("label: 'Le problème'"),
      'usePublicHeaderInit should include Le problème for B2B'
    )
  })

  it('should set B2B CTA', () => {
    assert.ok(
      initSource.includes("ctaLabel: 'Je réserve ma place'"),
      'usePublicHeaderInit should set B2B CTA'
    )
  })

  it('should also seed B2C header for B2C domains', () => {
    assert.ok(
      initSource.includes("ctaLabel: 'Trouver ma spécialiste'"),
      'usePublicHeaderInit should set B2C CTA for B2C domains'
    )
  })
})
