import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL, readRawBody, setResponseHeader, setResponseStatus } from 'h3'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
])

// We rebuild the response body (JSON parse / byte buffer), so these headers
// must not be forwarded from the upstream response.
const UNSAFE_RESPONSE_HEADERS = new Set([
  'content-length',
  'content-encoding'
])

function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null
  const value = ip.trim()
  if (!value) return null
  // Common Node format when IPv4 is mapped into IPv6.
  if (value.startsWith('::ffff:')) return value.slice('::ffff:'.length)
  return value
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const upstreamBase = (config.apiBase as string | undefined) ?? 'http://localhost:3001'

  const requestUrl = getRequestURL(event)
  const upstreamPath = requestUrl.pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  const upstreamUrl = new URL(joinUrl(upstreamBase, upstreamPath))
  upstreamUrl.search = requestUrl.search

  const method = event.method.toUpperCase()

  const incomingContentType = getRequestHeader(event, 'content-type')
  const incomingAuthorization = getRequestHeader(event, 'authorization')
  const incomingCookie = getRequestHeader(event, 'cookie')
  const incomingAccept = getRequestHeader(event, 'accept')

  const headers = new Headers()
  if (incomingAccept) headers.set('accept', incomingAccept)
  if (incomingContentType) headers.set('content-type', incomingContentType)
  if (incomingAuthorization) headers.set('authorization', incomingAuthorization)
  if (incomingCookie) headers.set('cookie', incomingCookie)

  // Trust boundary: we DO NOT forward X-Forwarded-* from the browser.
  // The upstream expects them from a trusted proxy; Nitro acts as that proxy here.
  headers.set('x-forwarded-host', requestUrl.host)
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''))
  const forwardedPort = requestUrl.port || (requestUrl.protocol === 'https:' ? '443' : '80')
  headers.set('x-forwarded-port', forwardedPort)
  const clientIp = normalizeIp(event.node.req.socket.remoteAddress)
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
    headers.set('x-real-ip', clientIp)
  }

  const body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event)

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method,
    headers,
    body
  })

  setResponseStatus(event, upstreamResponse.status)

  // Forward headers (including Set-Cookie).
  for (const [key, value] of upstreamResponse.headers.entries()) {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) continue
    if (UNSAFE_RESPONSE_HEADERS.has(lower)) continue
    if (lower === 'set-cookie') continue
    setResponseHeader(event, key, value)
  }

  const setCookie = (upstreamResponse.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.()
  if (Array.isArray(setCookie) && setCookie.length) {
    for (const cookie of setCookie) appendResponseHeader(event, 'set-cookie', cookie)
  } else {
    const single = upstreamResponse.headers.get('set-cookie')
    if (single) appendResponseHeader(event, 'set-cookie', single)
  }

  const contentType = upstreamResponse.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await upstreamResponse.json()
  }

  const arrayBuffer = await upstreamResponse.arrayBuffer()
  return new Uint8Array(arrayBuffer)
})
