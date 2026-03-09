import { defineEventHandler, getRequestHost, getRequestProtocol, setResponseHeader } from 'h3'

import { getDomainContext } from '#shared/utils/domain-context'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const platformDomain = config.public.platformDomain as string || 'kaora.app'

  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const origin = `${protocol}://${host}`

  const ctx = getDomainContext(host, platformDomain)

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...ctx.robotsDisallowPaths.map(p => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`
  ]

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return lines.join('\n') + '\n'
})
