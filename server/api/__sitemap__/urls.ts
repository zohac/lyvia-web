import { defineEventHandler, getRequestHost } from 'h3'

import { isPlatformHost } from '~~/shared/utils/platform-host'

const LEGAL_PAGES = [
  { loc: '/legal/cgu', changefreq: 'monthly' as const, priority: 0.3 },
  { loc: '/legal/confidentialite', changefreq: 'monthly' as const, priority: 0.3 },
  { loc: '/legal/mentions-legales', changefreq: 'monthly' as const, priority: 0.3 }
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const platformDomain = (config.public.platformDomain as string) || 'kaora.app'
  const apiBase = (config.apiBase as string) || 'http://localhost:3001'
  const host = getRequestHost(event)

  if (!isPlatformHost(host, platformDomain)) {
    return [
      { loc: '/', changefreq: 'weekly' as const, priority: 1.0 },
      { loc: '/onboarding/discovery', changefreq: 'weekly' as const, priority: 0.6 },
      ...LEGAL_PAGES
    ]
  }

  const providers = await $fetch<Array<{ slug: string, updatedAt: string }>>(
    `${apiBase}/public/sitemap/providers`
  )

  const coachUrls = providers.flatMap(p => [
    { loc: `/coach/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.8 },
    { loc: `/coach/${p.slug}/onboarding/discovery`, lastmod: p.updatedAt, changefreq: 'weekly' as const, priority: 0.6 }
  ])

  return [
    { loc: '/', changefreq: 'weekly' as const, priority: 1.0 },
    ...LEGAL_PAGES,
    ...coachUrls
  ]
})
