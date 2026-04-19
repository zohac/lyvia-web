import { defineEventHandler, getRequestHost } from 'h3'
import { queryCollection } from '@nuxt/content/server'

import { getDomainContext } from '#shared/utils/domain-context'
import { LEGAL_PAGES } from '#shared/utils/legal-pages'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const platformDomain = (config.public.platformDomain as string) || 'keova.fr'
  const platformDomainB2B = (config.public.platformDomainB2B as string) || ''
  const apiBase = (config.apiBase as string) || 'http://localhost:3001'
  const host = getRequestHost(event)

  const ctx = getDomainContext(host, platformDomain, platformDomainB2B || undefined)
  const origin = `https://${ctx.hostname}`

  // White-label: coach-scoped sitemap
  if (ctx.isWhiteLabel) {
    return [
      { loc: `${origin}/`, changefreq: 'weekly' as const, priority: 1.0 },
      { loc: `${origin}/onboarding/discovery`, changefreq: 'weekly' as const, priority: 0.6 },
      ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` }))
    ]
  }

  // B2B (keova.app): homepage + legal pages with lastmod (AC-16)
  if (ctx.isB2B) {
    const lastmod = new Date().toISOString().slice(0, 10)
    return [
      { loc: `${origin}/`, lastmod },
      ...LEGAL_PAGES.map(p => ({ loc: `${origin}${p.loc}`, lastmod }))
    ]
  }

  // B2C (keova.fr): full sitemap with coach pages
  let providers: Array<{ slug: string, updatedAt: string, hasVerifiedDomain?: boolean }> = []
  try {
    providers = await $fetch<Array<{ slug: string, updatedAt: string, hasVerifiedDomain?: boolean }>>(
      `${apiBase}/public/sitemap/providers`
    )
  } catch {
    // API unreachable — return static-only sitemap to avoid 500 on /sitemap.xml
  }

  // YC2.4: hub pages (coach with WL domain) get lower priority (0.5) than full pages (0.8)
  const coachUrls = providers.flatMap((p) => {
    const profilePriority = p.hasVerifiedDomain ? 0.5 : 0.8
    return [
      { loc: `${origin}/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: profilePriority },
      { loc: `${origin}/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
    ]
  })

  // Story 0-22: blog articles /articles/* (B2C uniquement)
  let articleUrls: Array<{ loc: string, lastmod?: string, changefreq: 'weekly', priority: number }> = []
  try {
    const articles = await queryCollection(event, 'articles')
      .select('path', 'publishedAt', 'updatedAt')
      .all()
    articleUrls = articles.map(a => ({
      loc: `${origin}${a.path}`,
      lastmod: (a.updatedAt ?? a.publishedAt) as string,
      changefreq: 'weekly' as const,
      priority: 0.6
    }))
  } catch {
    // Si la collection n'est pas prête, on n'empêche pas le sitemap
  }

  return [
    { loc: `${origin}/`, changefreq: 'weekly' as const, priority: 1.0 },
    ...LEGAL_PAGES.map(p => ({ ...p, loc: `${origin}${p.loc}` })),
    ...coachUrls,
    ...articleUrls
  ]
})
