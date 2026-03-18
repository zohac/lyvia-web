const DEV_PLATFORM_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, '')
}

export function isPlatformHost(
  hostname: string,
  platformDomain: string,
  platformDomainB2B?: string
): boolean {
  const normalizedHost = normalizeHostname(hostname)

  if (!normalizedHost) return true
  if (DEV_PLATFORM_HOSTS.has(normalizedHost)) return true

  const d1 = normalizeHostname(platformDomain)
  if (d1 && (normalizedHost === d1 || normalizedHost.endsWith(`.${d1}`))) return true

  if (platformDomainB2B) {
    const d2 = normalizeHostname(platformDomainB2B)
    if (d2 && (normalizedHost === d2 || normalizedHost.endsWith(`.${d2}`))) return true
  }

  return false
}
