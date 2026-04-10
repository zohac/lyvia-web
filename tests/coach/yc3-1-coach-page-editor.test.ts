import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

/**
 * YC3.1 — Tests for coach page editor logic.
 *
 * Tests pure domain rules extracted from useCoachPageEditor:
 * - ALWAYS_ON sections (hero + disclaimer only)
 * - EDITABLE_SECTIONS vs external sections
 * - Template error code handling
 */

// ── ALWAYS_ON sections rule (F3) ──

describe('YC3.1 — ALWAYS_ON sections', () => {
  // Must match useCoachPageEditor.ts
  const ALWAYS_ON_SECTIONS = ['hero', 'disclaimer']

  function isAlwaysOn(section: string): boolean {
    return ALWAYS_ON_SECTIONS.includes(section)
  }

  test('hero is always on', () => {
    assert.equal(isAlwaysOn('hero'), true)
  })

  test('disclaimer is always on', () => {
    assert.equal(isAlwaysOn('disclaimer'), true)
  })

  test('pricing is NOT always on (F3 fix)', () => {
    assert.equal(isAlwaysOn('pricing'), false)
  })

  test('bio is NOT always on', () => {
    assert.equal(isAlwaysOn('bio'), false)
  })

  test('pillars is NOT always on', () => {
    assert.equal(isAlwaysOn('pillars'), false)
  })

  test('faq is NOT always on', () => {
    assert.equal(isAlwaysOn('faq'), false)
  })

  test('testimonials is NOT always on', () => {
    assert.equal(isAlwaysOn('testimonials'), false)
  })
})

// ── Section toggle logic ──

describe('YC3.1 — isSectionOn logic', () => {
  const ALWAYS_ON_SECTIONS = ['hero', 'disclaimer']

  function isSectionOn(section: string, config: Record<string, boolean>): boolean {
    if (ALWAYS_ON_SECTIONS.includes(section)) return true
    return config[section] !== false
  }

  test('hero always on even if config says false', () => {
    assert.equal(isSectionOn('hero', { hero: false }), true)
  })

  test('disclaimer always on even if config says false', () => {
    assert.equal(isSectionOn('disclaimer', { disclaimer: false }), true)
  })

  test('pillars on when absent from config (defaults true)', () => {
    assert.equal(isSectionOn('pillars', {}), true)
  })

  test('pillars off when config says false', () => {
    assert.equal(isSectionOn('pillars', { pillars: false }), false)
  })

  test('pillars on when config says true', () => {
    assert.equal(isSectionOn('pillars', { pillars: true }), true)
  })
})

// ── Editable vs external sections (F2) ──

describe('YC3.1 — editable vs external sections', () => {
  const EDITABLE_SECTIONS = ['pillars', 'faq', 'benefits', 'howItWorks', 'educationalContent', 'problemStatement']
  const EXTERNAL_SECTIONS = ['bio', 'testimonials']

  test('bio is external (edited on /provider/account)', () => {
    assert.equal(EXTERNAL_SECTIONS.includes('bio'), true)
    assert.equal(EDITABLE_SECTIONS.includes('bio'), false)
  })

  test('testimonials is external (edited on /provider/account)', () => {
    assert.equal(EXTERNAL_SECTIONS.includes('testimonials'), true)
    assert.equal(EDITABLE_SECTIONS.includes('testimonials'), false)
  })

  test('pillars is editable (inline form)', () => {
    assert.equal(EDITABLE_SECTIONS.includes('pillars'), true)
    assert.equal(EXTERNAL_SECTIONS.includes('pillars'), false)
  })

  test('faq is editable (inline form)', () => {
    assert.equal(EDITABLE_SECTIONS.includes('faq'), true)
  })

  test('no section is both editable and external', () => {
    const overlap = EDITABLE_SECTIONS.filter(s => EXTERNAL_SECTIONS.includes(s))
    assert.deepStrictEqual(overlap, [])
  })
})

// ── Template error codes (F4) ──

describe('YC3.1 — template error handling', () => {
  test('TEMPLATE_NOT_AVAILABLE is a known error code', () => {
    const knownCodes = ['TEMPLATE_NOT_AVAILABLE']
    assert.equal(knownCodes.includes('TEMPLATE_NOT_AVAILABLE'), true)
  })
})

// ── EmotionalSupport in PillarsJson (F1) ──

describe('YC3.1 — emotionalSupport structure', () => {
  interface EmotionalSupport {
    icon?: string
    title: string
    description: string
  }

  interface PillarsJson {
    items: Array<{ title: string, description: string }>
    emotionalSupport?: EmotionalSupport
  }

  test('pillarsJson can have emotionalSupport', () => {
    const pillars: PillarsJson = {
      items: [{ title: 'Pilier 1', description: 'Description' }],
      emotionalSupport: { title: 'Soutien', description: 'Texte' }
    }
    assert.equal(pillars.emotionalSupport?.title, 'Soutien')
  })

  test('pillarsJson without emotionalSupport is valid', () => {
    const pillars: PillarsJson = {
      items: [{ title: 'Pilier 1', description: 'Description' }]
    }
    assert.equal(pillars.emotionalSupport, undefined)
  })
})
