import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  B2C_NAV_ITEMS,
  resolveB2CNavLinks
} from '../../app/features/public/navigation/b2c-nav'

// --- Structure / ordre (Convention A44 — verrouiller le nombre d'items de nav) ---

describe('B2C_NAV_ITEMS', () => {
  it('exposes exactly 5 items', () => {
    assert.equal(B2C_NAV_ITEMS.length, 5)
  })

  it('keeps a stable order : Comprendre · Symptômes · Spécialistes · Articles · FAQ', () => {
    const labels = B2C_NAV_ITEMS.map(i => i.label)
    assert.deepStrictEqual(labels, [
      'Comprendre',
      'Symptômes',
      'Spécialistes',
      'Articles',
      'FAQ'
    ])
  })

  it('includes Articles pointing to /articles (not an anchor)', () => {
    const articles = B2C_NAV_ITEMS.find(i => i.label === 'Articles')
    assert.ok(articles, 'Articles missing from nav')
    assert.equal(articles!.href, '/articles')
  })
})

// --- resolveB2CNavLinks ---

describe('resolveB2CNavLinks', () => {
  it('returns raw anchors on homepage (homeAnchorsAbsolute=false)', () => {
    const links = resolveB2CNavLinks({ homeAnchorsAbsolute: false })
    assert.equal(links.length, 5)
    assert.equal(links[0]!.href, '#education')
    assert.equal(links[1]!.href, '#symptomes')
    assert.equal(links[2]!.href, '#specialistes')
    assert.equal(links[3]!.href, '/articles')
    assert.equal(links[4]!.href, '#faq')
  })

  it('prefixes anchors with "/" on non-homepage (homeAnchorsAbsolute=true)', () => {
    const links = resolveB2CNavLinks({ homeAnchorsAbsolute: true })
    assert.equal(links.length, 5)
    assert.equal(links[0]!.href, '/#education')
    assert.equal(links[1]!.href, '/#symptomes')
    assert.equal(links[2]!.href, '/#specialistes')
    // Path items are not re-prefixed
    assert.equal(links[3]!.href, '/articles')
    assert.equal(links[4]!.href, '/#faq')
  })

  it('returns a fresh array (does not mutate B2C_NAV_ITEMS)', () => {
    const a = resolveB2CNavLinks({ homeAnchorsAbsolute: true })
    const b = resolveB2CNavLinks({ homeAnchorsAbsolute: false })
    // Source unchanged
    assert.equal(B2C_NAV_ITEMS[0]!.href, '#education')
    // Independent instances
    assert.notEqual(a, b)
    assert.notEqual(a[0], b[0])
  })
})
