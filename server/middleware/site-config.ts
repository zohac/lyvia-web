/**
 * Dynamic site config per request — makes Schema.org @id and OG tags domain-aware.
 *
 * nuxt-site-config uses site.url from nuxt.config as default. In multi-domain
 * (B2C keova.fr / B2B keova.app / white-label sophiejouan.fr), each request
 * must resolve @id base URLs from the actual Host header.
 */
export default defineEventHandler((event) => {
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  if (host) {
    updateSiteConfig(event, {
      url: `https://${host.split(':')[0]}`
    })
  }
})
