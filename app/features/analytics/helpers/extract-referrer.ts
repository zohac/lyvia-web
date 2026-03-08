export function extractReferrerDomain(referrer: string, currentHostname: string): string | undefined {
  if (!referrer) return undefined
  try {
    const url = new URL(referrer)
    if (url.hostname === currentHostname) return undefined
    return url.hostname
  } catch {
    return undefined
  }
}
