/**
 * V2.2b — Guided link catalogue + validation.
 *
 * Locked decisions: no bare anchor, discovery = booking route, programmes →
 * `/#tarifs`, published pages only, external links must be https/mailto with a
 * secured `target="_blank"`.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  EXTERNAL_LINK_INVALID_MESSAGE,
  EXTERNAL_LINK_REQUIRED_MESSAGE,
  GUIDED_PRICING_ANCHOR,
  buildGuidedDestinations,
  buildPageHref,
  buildSiteHref,
  selectGuidedPages,
  validateExternalLink
} from '../../app/features/pages/domain/guided-links'

describe('pages/domain — guided destinations (platform)', () => {
  const platform = buildGuidedDestinations({
    site: '/coach/sophie',
    booking: '/coach/sophie/onboarding/discovery',
    pages: [{ slug: 'mes-conseils', title: 'Mes conseils' }]
  })

  test('exposes discovery, pricing, programmes and published pages in order', () => {
    assert.deepEqual(platform.map(entry => entry.id), [
      'discovery',
      'pricing',
      'programs',
      'page:mes-conseils'
    ])
  })

  test('discovery points at the booking route (no #decouverte anchor)', () => {
    const discovery = platform[0]!
    assert.equal(discovery.href, '/coach/sophie/onboarding/discovery')
    assert.ok(!platform.some(entry => entry.href.includes('#decouverte')))
  })

  test('pricing and programmes point at /#tarifs (never a bare anchor)', () => {
    const pricing = platform.find(entry => entry.id === 'pricing')!
    const programs = platform.find(entry => entry.id === 'programs')!
    assert.equal(pricing.href, '/coach/sophie/#tarifs')
    assert.equal(programs.href, '/coach/sophie/#tarifs')
    assert.ok(pricing.href.endsWith(GUIDED_PRICING_ANCHOR))
  })

  test('a published page resolves to the real site path', () => {
    const page = platform.find(entry => entry.id === 'page:mes-conseils')!
    assert.equal(page.href, '/coach/sophie/mes-conseils')
    assert.equal(page.label, 'Mes conseils')
  })
})

describe('pages/domain — guided destinations (custom domain)', () => {
  test('absolute custom-domain URLs keep the anchor relative to the domain', () => {
    const custom = buildGuidedDestinations({
      site: 'https://sophiejouan.fr',
      booking: 'https://sophiejouan.fr/onboarding/discovery',
      pages: []
    })
    assert.equal(custom.find(entry => entry.id === 'pricing')!.href, 'https://sophiejouan.fr/#tarifs')
    assert.equal(custom[0]!.href, 'https://sophiejouan.fr/onboarding/discovery')
  })
})

describe('pages/domain — href builders', () => {
  test('buildSiteHref strips a trailing slash and normalizes the path', () => {
    assert.equal(buildSiteHref('https://sophiejouan.fr/', '/#tarifs'), 'https://sophiejouan.fr/#tarifs')
    assert.equal(buildSiteHref('/coach/sophie/', 'mes-conseils'), '/coach/sophie/mes-conseils')
  })

  test('buildPageHref always produces a leading slash', () => {
    assert.equal(buildPageHref('/coach/sophie', 'mes-conseils'), '/coach/sophie/mes-conseils')
  })
})

describe('pages/domain — guided page selection', () => {
  const pages = [
    { id: 'p1', slug: 'publiee', title: 'Publiée', status: 'published' as const },
    { id: 'p2', slug: 'brouillon', title: 'Brouillon', status: 'draft' as const },
    { id: 'current', slug: 'courante', title: 'Courante', status: 'published' as const }
  ]

  test('keeps only published pages', () => {
    const selected = selectGuidedPages(pages, 'other')
    assert.deepEqual(selected.map(page => page.slug), ['publiee', 'courante'])
  })

  test('excludes the page currently being edited', () => {
    const selected = selectGuidedPages(pages, 'current')
    assert.deepEqual(selected.map(page => page.slug), ['publiee'])
  })
})

describe('pages/domain — external link validation', () => {
  test('requires a non-empty URL', () => {
    const result = validateExternalLink({ url: '   ', newTab: false })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.message, EXTERNAL_LINK_REQUIRED_MESSAGE)
  })

  test('rejects http and javascript protocols with a field message', () => {
    for (const url of ['http://example.com', 'javascript:alert(1)', 'ftp://example.com']) {
      const result = validateExternalLink({ url, newTab: false })
      assert.equal(result.ok, false, `${url} must be rejected`)
      if (!result.ok) assert.equal(result.message, EXTERNAL_LINK_INVALID_MESSAGE)
    }
  })

  test('rejects an internal relative path (guided destinations own those)', () => {
    const result = validateExternalLink({ url: '/mes-conseils', newTab: false })
    assert.equal(result.ok, false)
  })

  test('accepts https without new tab', () => {
    const result = validateExternalLink({ url: 'https://example.com', newTab: false })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.href, 'https://example.com')
      assert.equal(result.target, undefined)
    }
  })

  test('accepts mailto', () => {
    const result = validateExternalLink({ url: 'mailto:contact@sophiejouan.fr', newTab: false })
    assert.equal(result.ok, true)
  })

  test('new tab always carries rel="noopener noreferrer"', () => {
    const result = validateExternalLink({ url: 'https://example.com', newTab: true })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.target, '_blank')
      assert.equal(result.rel, 'noopener noreferrer')
    }
  })

  test('ignores the new-tab option for mailto links', () => {
    const result = validateExternalLink({ url: 'mailto:contact@sophiejouan.fr', newTab: true })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.target, undefined)
      assert.equal(result.rel, undefined)
    }
  })
})
