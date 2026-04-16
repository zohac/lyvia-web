import { resolveCanonical } from './resolveCanonical'

export type CoachProfilePageVariant = 'hub' | 'full'

export function normalizeVerifiedWhiteLabelDomain(domain: string | null | undefined): string | null {
  const normalized = domain?.trim().toLowerCase() ?? ''
  return normalized.length > 0 ? normalized : null
}

export function resolveCoachProfilePageVariant(
  isPlatform: boolean,
  verifiedWhiteLabelDomain: string | null | undefined
): CoachProfilePageVariant {
  return isPlatform && normalizeVerifiedWhiteLabelDomain(verifiedWhiteLabelDomain) ? 'hub' : 'full'
}

export function buildCoachHubTitle(brandName: string, mainSpecialty?: string | null): string {
  const parts = [brandName]
  if (mainSpecialty) parts.push(`Coach ${mainSpecialty}`)
  parts.push('Keova')
  return parts.join(' — ')
}

export function buildCoachHubDescription(brandName: string, bio?: string | null): string {
  const content = bio?.trim() ?? ''
  if (content.length === 0) {
    return `Découvrez ${brandName}, spécialiste accompagnement ménopause sur Keova.`
  }
  if (content.length <= 160) return content
  return `${content.slice(0, 157).trimEnd()}...`
}

export function resolveCoachProfileCanonical(input: {
  variant: CoachProfilePageVariant
  isB2B: boolean
  platformDomain: string
  slug: string
  seoCanonicalUrl?: string | null
  origin: string
}): string {
  const platformCanonical = `https://${input.platformDomain}/coach/${input.slug}`
  if (input.variant === 'hub' || input.isB2B) return platformCanonical

  const canonicalOrigin = input.isB2B ? `https://${input.platformDomain}` : input.origin
  return resolveCanonical(input.seoCanonicalUrl, canonicalOrigin) ?? platformCanonical
}
