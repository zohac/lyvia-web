import { normalizeHostname } from './platform-host'

export type DomainRole = 'b2c' | 'b2b' | 'white-label'

export interface DomainContext {
  role: DomainRole
  isPlatform: boolean
  isB2C: boolean
  isB2B: boolean
  isWhiteLabel: boolean
  hostname: string
  robotsDisallowPaths: readonly string[]
}

const DISALLOW_AUTH = [
  '/client/',
  '/provider/',
  '/admin/',
  '/api/',
  '/login',
  '/reset-password',
  '/verify-email',
  '/forgot-password'
] as const

const DISALLOW_B2B_EXTRA = ['/coaches', '/coach/'] as const

const DISALLOW_WHITE_LABEL_EXTRA = ['/coaches'] as const

function matchesDomain(hostname: string, domain: string): boolean {
  if (!domain) return false
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

function buildDisallowPaths(role: DomainRole): readonly string[] {
  switch (role) {
    case 'b2c':
      return DISALLOW_AUTH
    case 'b2b':
      return [...DISALLOW_AUTH, ...DISALLOW_B2B_EXTRA]
    case 'white-label':
      return [...DISALLOW_AUTH, ...DISALLOW_WHITE_LABEL_EXTRA]
  }
}

function resolveRole(
  normalized: string,
  platformDomain: string,
  platformDomainB2B?: string
): DomainRole {
  if (!normalized) return 'b2b'

  const normalizedPlatform = normalizeHostname(platformDomain)
  const normalizedB2B = platformDomainB2B ? normalizeHostname(platformDomainB2B) : ''

  // When B2B domain is configured, distinguish B2C from B2B
  if (normalizedB2B) {
    if (matchesDomain(normalized, normalizedPlatform)) return 'b2c'
    if (matchesDomain(normalized, normalizedB2B)) return 'b2b'
  } else {
    // Legacy: no B2B domain → all platform matches are b2b
    if (matchesDomain(normalized, normalizedPlatform)) return 'b2b'
  }

  // Dev hosts → b2b (app SaaS)
  const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
  if (DEV_HOSTS.has(normalized)) return 'b2b'

  return 'white-label'
}

export function getDomainContext(
  hostname: string,
  platformDomain: string,
  platformDomainB2B?: string
): DomainContext {
  const normalized = normalizeHostname(hostname)
  const role = resolveRole(normalized, platformDomain, platformDomainB2B)
  const isPlatform = role === 'b2c' || role === 'b2b'

  return {
    role,
    isPlatform,
    isB2C: role === 'b2c',
    isB2B: role === 'b2b',
    isWhiteLabel: role === 'white-label',
    hostname: normalized,
    robotsDisallowPaths: buildDisallowPaths(role)
  }
}

/**
 * Returns the SEO reference origin for Schema.org @id, canonical, and hreflang.
 *
 * B2B (keova.app) → `https://keova.fr` (SEO reference domain)
 * B2C (keova.fr) / WL (sophiejouan.fr) → `https://{actual host}`
 */
export function getSeoReferenceOrigin(
  ctx: DomainContext,
  platformDomain: string
): string {
  if (ctx.isB2B) {
    return `https://${normalizeHostname(platformDomain)}`
  }
  return `https://${ctx.hostname}`
}
