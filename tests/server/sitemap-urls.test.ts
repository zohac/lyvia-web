import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext } from '../../shared/utils/domain-context'

const PLATFORM = 'kaora.app'

const LEGAL_PAGES = [
  { loc: '/legal/cgu', changefreq: 'monthly' as const, priority: 0.3 },
  { loc: '/legal/confidentialite', changefreq: 'monthly' as const, priority: 0.3 },
  { loc: '/legal/mentions-legales', changefreq: 'monthly' as const, priority: 0.3 }
]

const MOCK_PROVIDERS = [
  { slug: 'sophie-jouan', updatedAt: '2026-03-01T00:00:00.000Z' },
  { slug: 'marie-dupont', updatedAt: '2026-03-02T00:00:00.000Z' }
]

interface SitemapEntry {
  loc: string
  changefreq?: string
  priority?: number
  lastmod?: string
}

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

// --- platform ---

test('sitemap platform: includes home page', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  assert.ok(urls.some(u => u.loc === '/'))
})

test('sitemap platform: includes legal pages', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/legal/cgu'))
  assert.ok(locs.includes('/legal/confidentialite'))
  assert.ok(locs.includes('/legal/mentions-legales'))
})

test('sitemap platform: includes coach profile pages for each provider', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/coach/sophie-jouan'))
  assert.ok(locs.includes('/coach/marie-dupont'))
})

test('sitemap platform: includes coach booking pages', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('/coach/sophie-jouan/onboarding/discovery'))
  assert.ok(locs.includes('/coach/marie-dupont/onboarding/discovery'))
})

test('sitemap platform: coach pages have lastmod from provider updatedAt', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  const sophie = urls.find(u => u.loc === '/coach/sophie-jouan')
  assert.equal(sophie?.lastmod, '2026-03-01T00:00:00.000Z')
})

test('sitemap platform: does NOT include generic /onboarding/discovery', () => {
  const urls = buildSitemapUrls('kaora.app', MOCK_PROVIDERS)
  assert.equal(urls.some(u => u.loc === '/onboarding/discovery'), false)
})

// --- platform with no providers ---

test('sitemap platform no providers: includes home and legal, no coach pages', () => {
  const urls = buildSitemapUrls('kaora.app', [])
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
