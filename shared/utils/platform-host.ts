const DEV_PLATFORM_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, '')
}

export function isPlatformHost(hostname: string, platformDomain: string): boolean {
  const normalizedHost = normalizeHostname(hostname)
  const normalizedPlatformDomain = normalizeHostname(platformDomain)

  if (!normalizedHost) return true
  if (DEV_PLATFORM_HOSTS.has(normalizedHost)) return true
  if (!normalizedPlatformDomain) return false
  if (normalizedHost === normalizedPlatformDomain) return true

  return normalizedHost.endsWith(`.${normalizedPlatformDomain}`)
}
