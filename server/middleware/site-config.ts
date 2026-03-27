/**
 * Dynamic site config per request — makes Schema.org @id and OG tags domain-aware.
 *
 * nuxt-site-config uses site.url from nuxt.config as default. In multi-domain
 * (B2C keova.fr / B2B keova.app / white-label sophiejouan.fr), each request
 * must resolve @id base URLs from the SEO reference domain:
 * - B2C (keova.fr) → https://keova.fr
 * - B2B (keova.app) → https://keova.fr (SEO reference, not keova.app)
 * - White-label (sophiejouan.fr) → https://sophiejouan.fr
 */
import { getDomainContext, getSeoReferenceOrigin } from '#shared/utils/domain-context'

export default defineEventHandler((event) => {
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  if (!host) return

  const config = useRuntimeConfig()
  const platformDomain = (config.public.platformDomain as string)?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (config.public.platformDomainB2B as string)?.toLowerCase() || ''

  const ctx = getDomainContext(host, platformDomain, platformDomainB2B || undefined)
  const seoOrigin = getSeoReferenceOrigin(ctx, platformDomain)

  updateSiteConfig(event, { url: seoOrigin })
})
