import { defineEventHandler, getRequestHost, getRequestProtocol, setResponseHeader } from 'h3'

const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

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

function isPlatformDomain(host: string, platformDomain: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, '')
  if (!h) return true
  if (DEV_HOSTS.has(h)) return true
  const pd = platformDomain.toLowerCase()
  if (!pd) return false
  return h === pd || h.endsWith(`.${pd}`)
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const platformDomain = config.public.platformDomain as string || 'kaora.app'

  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const origin = `${protocol}://${host}`

  const disallowPaths = [...DISALLOW_COMMON]

  if (!isPlatformDomain(host, platformDomain)) {
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
  return lines.join('\n')
})
