import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

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
      { loc: `${origin}/`, changefreq: 'monthly', priority: 1.0 }
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

test('sitemap B2B (tri-modal): returns only landing with monthly changefreq (AC-3)', () => {
  const urls = buildSitemapUrlsTriModal('keova.app', MOCK_PROVIDERS)
  assert.equal(urls.length, 1)
  assert.equal(urls[0].loc, 'https://keova.app/')
  assert.equal(urls[0].changefreq, 'monthly')
  assert.equal(urls[0].priority, 1.0)
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

// --- YC2.4: Hub vs full page sitemap priorities ---

const MOCK_PROVIDERS_WITH_DOMAIN = [
  { slug: 'sophie-jouan', updatedAt: '2026-03-01T00:00:00.000Z', hasVerifiedDomain: true },
  { slug: 'marie-dupont', updatedAt: '2026-03-02T00:00:00.000Z', hasVerifiedDomain: false }
]

function buildSitemapUrlsWithDomain(
  host: string,
  providers: Array<{ slug: string, updatedAt: string, hasVerifiedDomain?: boolean }>
): SitemapEntry[] {
  const ctx = getDomainContext(host, PLATFORM, PLATFORM_B2B)
  const origin = `https://${ctx.hostname}`

  if (ctx.isWhiteLabel || ctx.isB2B) return []

  return providers.flatMap((p) => {
    const profilePriority = p.hasVerifiedDomain ? 0.5 : 0.8
    return [
      { loc: `${origin}/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: profilePriority },
      { loc: `${origin}/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
    ]
  })
}

test('YC2.4 sitemap: coach with WL domain gets priority 0.5 (hub)', () => {
  const urls = buildSitemapUrlsWithDomain('keova.fr', MOCK_PROVIDERS_WITH_DOMAIN)
  const sophie = urls.find(u => u.loc === 'https://keova.fr/coach/sophie-jouan')
  assert.equal(sophie?.priority, 0.5)
})

test('YC2.4 sitemap: coach without WL domain gets priority 0.8 (full page)', () => {
  const urls = buildSitemapUrlsWithDomain('keova.fr', MOCK_PROVIDERS_WITH_DOMAIN)
  const marie = urls.find(u => u.loc === 'https://keova.fr/coach/marie-dupont')
  assert.equal(marie?.priority, 0.8)
})

test('YC2.4 sitemap: booking pages always get priority 0.6 regardless of WL domain', () => {
  const urls = buildSitemapUrlsWithDomain('keova.fr', MOCK_PROVIDERS_WITH_DOMAIN)
  const sophieBooking = urls.find(u => u.loc === 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
  const marieBooking = urls.find(u => u.loc === 'https://keova.fr/coach/marie-dupont/onboarding/discovery')
  assert.equal(sophieBooking?.priority, 0.6)
  assert.equal(marieBooking?.priority, 0.6)
})

// --- Story 0-22: blog articles /articles/* (B2C uniquement) ---

interface ArticleDoc {
  path: string
  publishedAt: string
  updatedAt?: string
}

const MOCK_ARTICLES: ArticleDoc[] = [
  { path: '/articles/bouffees-de-chaleur-menopause', publishedAt: '2026-04-17', updatedAt: '2026-04-19' },
  { path: '/articles/insomnie-menopause', publishedAt: '2026-04-10' }
]

// Reproduit la logique du handler urls.ts pour la branche B2C uniquement —
// permet de tester l'émission des URLs /articles/* sans mocker h3/@nuxt/content.
function buildB2CSitemapSegment(
  host: string,
  providers: Array<{ slug: string, updatedAt: string, hasVerifiedDomain?: boolean }>,
  articles: ArticleDoc[]
): SitemapEntry[] {
  const ctx = getDomainContext(host, PLATFORM, PLATFORM_B2B)
  const origin = `https://${ctx.hostname}`

  // White-label + B2B : pas d'articles
  if (ctx.isWhiteLabel || ctx.isB2B) return []

  const coachUrls = providers.flatMap((p) => {
    const profilePriority = p.hasVerifiedDomain ? 0.5 : 0.8
    return [
      { loc: `${origin}/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: profilePriority },
      { loc: `${origin}/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
    ]
  })

  const articleUrls = articles.map(a => ({
    loc: `${origin}${a.path}`,
    lastmod: (a.updatedAt ?? a.publishedAt),
    changefreq: 'weekly' as const,
    priority: 0.6
  }))

  return [
    { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
    ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` })),
    ...coachUrls,
    ...articleUrls
  ]
}

test('story 0-22 sitemap B2C: embarque toutes les URLs /articles/* fournies', () => {
  const urls = buildB2CSitemapSegment('keova.fr', MOCK_PROVIDERS, MOCK_ARTICLES)
  const locs = urls.map(u => u.loc)
  assert.ok(locs.includes('https://keova.fr/articles/bouffees-de-chaleur-menopause'))
  assert.ok(locs.includes('https://keova.fr/articles/insomnie-menopause'))
})

test('story 0-22 sitemap B2C: URLs article ont priority 0.6 et changefreq weekly', () => {
  const urls = buildB2CSitemapSegment('keova.fr', MOCK_PROVIDERS, MOCK_ARTICLES)
  const first = urls.find(u => u.loc === 'https://keova.fr/articles/bouffees-de-chaleur-menopause')
  assert.equal(first?.priority, 0.6)
  assert.equal(first?.changefreq, 'weekly')
})

test('story 0-22 sitemap B2C: URL article utilise updatedAt si présent, publishedAt sinon', () => {
  const urls = buildB2CSitemapSegment('keova.fr', [], MOCK_ARTICLES)
  const withUpdate = urls.find(u => u.loc === 'https://keova.fr/articles/bouffees-de-chaleur-menopause')
  const withoutUpdate = urls.find(u => u.loc === 'https://keova.fr/articles/insomnie-menopause')
  assert.equal(withUpdate?.lastmod, '2026-04-19')
  assert.equal(withoutUpdate?.lastmod, '2026-04-10')
})

test('story 0-22 sitemap B2B: n\'embarque PAS les URLs /articles/*', () => {
  const urls = buildB2CSitemapSegment('keova.app', MOCK_PROVIDERS, MOCK_ARTICLES)
  assert.equal(urls.length, 0, 'B2B segment returns 0 article URLs')
})

test('story 0-22 sitemap white-label: n\'embarque PAS les URLs /articles/*', () => {
  const urls = buildB2CSitemapSegment('sophie-jouan.fr', MOCK_PROVIDERS, MOCK_ARTICLES)
  assert.equal(urls.length, 0, 'WL segment returns 0 article URLs')
})

// --- Test structural : le handler réel (urls.ts) ne doit pas dériver de la logique testée ---

describe('sitemap handler structural (urls.ts)', () => {
  const handlerPath = path.resolve(process.cwd(), 'server/api/__sitemap__/urls.ts')
  const source = fs.readFileSync(handlerPath, 'utf-8')

  test('queries the @nuxt/content collection named "articles"', () => {
    assert.match(source, /queryCollection\(event,\s*'articles'\)/)
  })

  test('builds /articles/* loc from article.path', () => {
    assert.match(source, /\$\{origin\}\$\{a\.path\}/)
  })

  test('articles branch is gated behind the B2C path (ctx.isWhiteLabel + ctx.isB2B returns before)', () => {
    const whiteLabelReturnIndex = source.indexOf('if (ctx.isWhiteLabel)')
    const b2bReturnIndex = source.indexOf('if (ctx.isB2B)')
    const articlesQueryIndex = source.indexOf('queryCollection(event, \'articles\')')
    assert.ok(whiteLabelReturnIndex > -1, 'white-label branch exists')
    assert.ok(b2bReturnIndex > -1, 'B2B branch exists')
    assert.ok(articlesQueryIndex > whiteLabelReturnIndex)
    assert.ok(articlesQueryIndex > b2bReturnIndex)
  })

  test('article URLs use priority 0.6 (info content vs commercial coach pages at 0.8)', () => {
    const articlesSection = source.split('queryCollection(event, \'articles\')')[1] ?? ''
    assert.match(articlesSection, /priority:\s*0\.6/)
  })

  // Story V1.3 — Dynamic pages in sitemap
  test('queries /public/pages for dynamic pages in white-label branch', () => {
    const wlSection = source.split('if (ctx.isWhiteLabel)')[1]?.split('if (ctx.isB2B)')[0] ?? ''
    assert.match(wlSection, /\/public\/pages/)
    assert.match(wlSection, /priority:\s*0\.7/)
  })

  test('queries /public/pages for dynamic pages per provider in B2C platform branch', () => {
    const b2cSection = source.split('// B2C (keova.fr):')[1] ?? ''
    assert.match(b2cSection, /\/public\/pages/)
    assert.match(b2cSection, /Host:\s*platformDomain/)
    assert.match(b2cSection, /\$\{origin\}\/coach\/\$\{p\.slug\}\/\$\{page\.slug\}/)
    assert.match(b2cSection, /p\.hasVerifiedDomain \? 0\.5 : 0\.7/)
  })

  test('dynamic pages are gated behind try/catch to ensure graceful error handling', () => {
    assert.match(source, /catch\s*\{[\s\S]*?\/\/ API unreachable or tenant resolution fails/)
    assert.match(source, /catch\s*\{[\s\S]*?\/\/ Dynamic pages unreachable/)
  })
})

describe('Story V1.3: Dynamic pages sitemap url generation logic', () => {
  interface DynamicPageMock {
    slug: string
    publishedAt: string
  }

  function buildSitemapWithDynamicPages(
    host: string,
    providers: Array<{ slug: string, updatedAt: string, hasVerifiedDomain?: boolean }>,
    dynamicPagesByProvider: Record<string, DynamicPageMock[]>
  ): SitemapEntry[] {
    const ctx = getDomainContext(host, PLATFORM, PLATFORM_B2B)
    const origin = `https://${ctx.hostname}`

    if (ctx.isWhiteLabel) {
      const wlPages = dynamicPagesByProvider['default'] || []
      return [
        { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
        { loc: `${origin}/onboarding/discovery`, changefreq: 'weekly', priority: 0.6 },
        ...wlPages.map(p => ({
          loc: `${origin}/${p.slug}`,
          lastmod: p.publishedAt,
          changefreq: 'weekly' as const,
          priority: 0.7
        })),
        ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` }))
      ]
    }

    if (ctx.isB2B) {
      return [
        { loc: `${origin}/`, lastmod: '2026-09-13' },
        ...LEGAL_PAGES.map(p => ({ loc: `${origin}${p.loc}`, lastmod: '2026-09-13' }))
      ]
    }

    const coachUrls = providers.flatMap(p => [
      { loc: `${origin}/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: p.hasVerifiedDomain ? 0.5 : 0.8 },
      { loc: `${origin}/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
    ])

    const dynamicUrls = providers.flatMap((p) => {
      const pages = dynamicPagesByProvider[p.slug] || []
      const priority = p.hasVerifiedDomain ? 0.5 : 0.7
      return pages.map(page => ({
        loc: `${origin}/coach/${p.slug}/${page.slug}`,
        lastmod: page.publishedAt,
        changefreq: 'weekly' as const,
        priority
      }))
    })

    return [
      { loc: `${origin}/`, changefreq: 'weekly', priority: 1.0 },
      ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` })),
      ...coachUrls,
      ...dynamicUrls
    ]
  }

  const mockDynamicPages = {
    'default': [
      { slug: 'mon-approche', publishedAt: '2026-09-10T12:00:00.000Z' },
      { slug: 'ateliers', publishedAt: '2026-09-11T15:00:00.000Z' }
    ],
    'sophie-jouan': [
      { slug: 'mon-approche', publishedAt: '2026-09-10T12:00:00.000Z' }
    ],
    'marie-dupont': [
      { slug: 'faq', publishedAt: '2026-09-12T09:00:00.000Z' }
    ]
  }

  test('white-label sitemap includes dynamic pages with priority 0.7 and lastmod', () => {
    const urls = buildSitemapWithDynamicPages('sophiejouan.fr', [], mockDynamicPages)
    const approcheUrl = urls.find(u => u.loc === 'https://sophiejouan.fr/mon-approche')
    assert.ok(approcheUrl, 'mon-approche must be in white-label sitemap')
    assert.equal(approcheUrl!.priority, 0.7)
    assert.equal(approcheUrl!.changefreq, 'weekly')
    assert.equal(approcheUrl!.lastmod, '2026-09-10T12:00:00.000Z')
  })

  test('platform B2C sitemap includes /coach/:slug/:pageSlug with priority 0.5 for verified domain coach', () => {
    const providers = [
      { slug: 'sophie-jouan', updatedAt: '2026-09-01T00:00:00.000Z', hasVerifiedDomain: true }
    ]
    const urls = buildSitemapWithDynamicPages('keova.fr', providers, mockDynamicPages)
    const coachPageUrl = urls.find(u => u.loc === 'https://keova.fr/coach/sophie-jouan/mon-approche')
    assert.ok(coachPageUrl, 'coach subpage must be in platform sitemap')
    assert.equal(coachPageUrl!.priority, 0.5, 'Priority should be 0.5 when coach has verified custom domain (YC2.4)')
    assert.equal(coachPageUrl!.lastmod, '2026-09-10T12:00:00.000Z')
  })

  test('platform B2C sitemap uses priority 0.7 when coach has NO verified domain', () => {
    const providers = [
      { slug: 'marie-dupont', updatedAt: '2026-09-01T00:00:00.000Z', hasVerifiedDomain: false }
    ]
    const urls = buildSitemapWithDynamicPages('keova.fr', providers, mockDynamicPages)
    const coachPageUrl = urls.find(u => u.loc === 'https://keova.fr/coach/marie-dupont/faq')
    assert.ok(coachPageUrl, 'coach subpage must be in platform sitemap')
    assert.equal(coachPageUrl!.priority, 0.7, 'Priority should be 0.7 when coach has no custom domain')
  })

  test('platform B2B sitemap (keova.app) excludes coach dynamic pages', () => {
    const urls = buildSitemapWithDynamicPages('keova.app', [], mockDynamicPages)
    const locs = urls.map(u => u.loc)
    assert.ok(!locs.some(l => l.includes('mon-approche')))
    assert.ok(!locs.some(l => l.includes('/coach/')))
  })
})
