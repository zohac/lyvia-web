import { isPlatformHost, normalizeHostname } from './platform-host'

export interface DomainContext {
  isPlatform: boolean
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

const DISALLOW_WHITE_LABEL_EXTRA = ['/coaches'] as const

export function getDomainContext(
  hostname: string,
  platformDomain: string
): DomainContext {
  const isPlatform = isPlatformHost(hostname, platformDomain)
  const normalized = normalizeHostname(hostname)

  return {
    isPlatform,
    hostname: normalized,
    robotsDisallowPaths: isPlatform
      ? DISALLOW_AUTH
      : [...DISALLOW_AUTH, ...DISALLOW_WHITE_LABEL_EXTRA]
  }
}
