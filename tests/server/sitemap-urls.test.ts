import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext } from '../../shared/utils/domain-context'
import { LEGAL_PAGES } from '../../shared/utils/legal-pages'

const PLATFORM = 'keova.fr'
const PLATFORM_B2B = 'keova.app'

const MOCK_PROVIDERS = [
  { slug: 'sophie-jouan', updatedAt: '2026-03-01T00:00:00.000Z' },
  { slug: 'marie-dupont', updatedAt: '2026-03-02T00:00:00.000Z' }
]

// Tests the domain-context contract as used by the sitemap handler — not a handler integration test.
// The h3 event wiring (defineEventHandler, $fetch) is not exercised here.
interface SitemapEntry {
  loc: string
  changefreq?: string
  priority?: number
  lastmod?: string
}

// Legacy 2-param mode (backward compat tests)
function buildSitemapUrls(host: string, providers: Array<{ slug: string, updatedAt: string }>): SitemapEntry[] {
  const ctx = getDomainContext(host, PLATFORM)

  if (!ctx.isPlatform) {
    return [
      { loc: '/', changefreq: 'weekly', priority: 1.0 },
      { loc: '/onboarding/discovery', changefreq: 'weekly', priority: 0.6 },
      ...LEGAL_PAGES
    ]
  }

  const coachUrls = providers.flatMap(p => [
    { loc: `/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.8 },
    { loc: `/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
  ])

  return [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    ...LEGAL_PAGES,
    ...coachUrls
  ]
}

// Tri-modal 3-param mode (mirrors actual handler logic with absolute URLs)
function buildSitemapUrlsTriModal(host: string, providers: Array<{ slug: string, updatedAt: string }>): SitemapEntry[] {
  const ctx = getDomainContext(host, PLATFORM, PLATFORM_B2B)
  const origin = `https://${ctx.hostname}`

  if (ctx.isWhiteLabel) {
    return [
      { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
      { loc: `${origin}/onboarding/discovery`, changefreq: 'weekly', priority: 0.6 },
      ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` }))
    ]
  }

  if (ctx.isB2B) {
    return [
      { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
      ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` }))
    ]
  }

  const coachUrls = providers.flatMap(p => [
    { loc: `${origin}/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.8 },
    { loc: `${origin}/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
  ])

  return [
    { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
    ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` })),
    ...coachUrls
  ]
}

// --- platform ---

test('sitemap platform: includes home page', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  assert.ok(urls.some(u => u.loc === '/'))
})

test('sitemap platform: includes legal pages', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/legal/cgu'))
  assert.ok(locs.includes('/legal/confidentialite'))
  assert.ok(locs.includes('/legal/mentions-legales'))
})

test('sitemap platform: includes coach profile pages for each provider', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/coach/sophie-jouan'))
  assert.ok(locs.includes('/coach/marie-dupont'))
})

test('sitemap platform: includes coach booking pages', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/coach/sophie-jouan/onboarding/discovery'))
  assert.ok(locs.includes('/coach/marie-dupont/onboarding/discovery'))
})

test('sitemap platform: coach pages have lastmod from provider updatedAt', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  const sophie = urls.find(u => u.loc === '/coach/sophie-jouan')
  assert.equal(sophie?.lastmod, '2026-03-01T00:00:00.000Z')
})

test('sitemap platform: does NOT include generic /onboarding/discovery', () => {
  const urls = buildSitemapUrls('keova.fr', MOCK_PROVIDERS)
  assert.equal(urls.some(u => u.loc === '/onboarding/discovery'), false)
})

// --- platform with no providers ---

test('sitemap platform no providers: includes home and legal, no coach pages', () => {
  const urls = buildSitemapUrls('keova.fr', [])
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/'))
  assert.ok(locs.includes('/legal/cgu'))
  assert.equal(locs.filter(l => l.startsWith('/coach/')).length, 0)
})

// --- white-label ---

test('sitemap white-label: includes home and /onboarding/discovery', () => {
  const urls = buildSitemapUrls('sophie-jouan.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/'))
  assert.ok(locs.includes('/onboarding/discovery'))
})

test('sitemap white-label: includes legal pages', () => {
  const urls = buildSitemapUrls('sophie-jouan.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/legal/cgu'))
})

test('sitemap white-label: does NOT include /coach/* pages', () => {
  const urls = buildSitemapUrls('sophie-jouan.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.equal(locs.filter(l => l.startsWith('/coach/')).length, 0)
})

test('sitemap white-label: exactly 5 entries (home + discovery + 3 legal)', () => {
  const urls = buildSitemapUrls('sophie-jouan.fr', MOCK_PROVIDERS)
  assert.equal(urls.length, 5)
})

// --- TRI-MODAL MODE (3 params — absolute URLs) ---

test('sitemap B2B (tri-modal): returns only home + legal with absolute URLs', () => {
  const urls = buildSitemapUrlsTriModal('keova.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('https://keova.app/'))
  assert.ok(locs.includes('https://keova.app/legal/cgu'))
  assert.ok(locs.includes('https://keova.app/legal/confidentialite'))
  assert.ok(locs.includes('https://keova.app/legal/mentions-legales'))
  assert.equal(urls.length, 4)
})

test('sitemap B2B (tri-modal): does NOT include coach pages', () => {
  const urls = buildSitemapUrlsTriModal('keova.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.equal(locs.filter(l => l.includes('/coach/')).length, 0)
})

test('sitemap B2B (tri-modal): does NOT include /onboarding/discovery', () => {
  const urls = buildSitemapUrlsTriModal('keova.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.equal(locs.filter(l => l.includes('/onboarding/discovery')).length, 0)
})

test('sitemap B2C (tri-modal): includes coach pages with absolute URLs', () => {
  const urls = buildSitemapUrlsTriModal('keova.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('https://keova.fr/'))
  assert.ok(locs.includes('https://keova.fr/coach/sophie-jouan'))
  assert.ok(locs.includes('https://keova.fr/coach/marie-dupont'))
  assert.ok(locs.includes('https://keova.fr/coach/sophie-jouan/onboarding/discovery'))
})

test('sitemap B2C (tri-modal): legal pages have absolute URLs', () => {
  const urls = buildSitemapUrlsTriModal('keova.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('https://keova.fr/legal/cgu'))
})

test('sitemap white-label (tri-modal): includes /onboarding/discovery with absolute URL', () => {
  const urls = buildSitemapUrlsTriModal('sophie-jouan.fr', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('https://sophie-jouan.fr/'))
  assert.ok(locs.includes('https://sophie-jouan.fr/onboarding/discovery'))
  assert.ok(locs.includes('https://sophie-jouan.fr/legal/cgu'))
  assert.equal(urls.length, 5)
})
