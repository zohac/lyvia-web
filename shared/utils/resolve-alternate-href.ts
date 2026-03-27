import { getDomainContext, getSeoReferenceOrigin } from './domain-context'

export function resolveAlternateHref(opts: {
  hostname: string
  pathname: string
  platformDomain: string
  platformDomainB2B?: string
  canonicalHref?: string | null
}): string {
  if (opts.canonicalHref) {
    return opts.canonicalHref
  }

  const ctx = getDomainContext(opts.hostname, opts.platformDomain, opts.platformDomainB2B || undefined)
  const seoOrigin = getSeoReferenceOrigin(ctx, opts.platformDomain)

  return `${seoOrigin}${opts.pathname}`
}
