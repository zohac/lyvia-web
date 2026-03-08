import { defineEventHandler, getRequestHost, getRequestProtocol, setResponseHeader } from 'h3'

import { isPlatformHost } from '~~/shared/utils/platform-host'

const DISALLOW_COMMON = [
  '/client/',
  '/provider/',
  '/admin/',
  '/api/',
  '/login',
  '/reset-password',
  '/verify-email',
  '/forgot-password'
]

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const platformDomain = config.public.platformDomain as string || 'kaora.app'

  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const origin = `${protocol}://${host}`

  const disallowPaths = [...DISALLOW_COMMON]

  if (!isPlatformHost(host, platformDomain)) {
    disallowPaths.push('/coaches')
  }

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...disallowPaths.map(p => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`
  ]

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return lines.join('\n') + '\n'
})
