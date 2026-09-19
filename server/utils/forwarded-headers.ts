import { getRequestURL, type H3Event } from 'h3'

/**
 * En-têtes de confiance `X-Forwarded-*` transmis à l'API.
 *
 * Frontière de confiance : le navigateur ne doit JAMAIS fournir ces en-têtes,
 * c'est Nitro qui agit comme proxy de confiance. Sans `x-forwarded-for`, l'API
 * (avec `TRUST_PROXY=true`) compte toutes les requêtes relayées sous l'IP du
 * conteneur Nitro — le rate limit par visiteuse devient alors global.
 *
 * Partagé par le proxy public (`server/api/[...path].ts`) et par le relais du
 * fallback sans JavaScript (`server/routes/waitlist-submit.post.ts`).
 */
export function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null
  const value = ip.trim()
  if (!value) return null
  // Common Node format when IPv4 is mapped into IPv6.
  if (value.startsWith('::ffff:')) return value.slice('::ffff:'.length)
  return value
}

export function setForwardedHeaders(headers: Headers, event: H3Event): void {
  const requestUrl = getRequestURL(event)
  headers.set('x-forwarded-host', requestUrl.host)
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''))
  const forwardedPort = requestUrl.port || (requestUrl.protocol === 'https:' ? '443' : '80')
  headers.set('x-forwarded-port', forwardedPort)

  const clientIp = normalizeIp(event.node.req.socket.remoteAddress)
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
    headers.set('x-real-ip', clientIp)
  }
}
