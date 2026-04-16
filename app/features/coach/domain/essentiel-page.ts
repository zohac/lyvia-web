import type { PublicProviderProfile } from '../../seo/api/public-provider-profile.contract'

export interface CoachEssentielNavLink {
  label: string
  href: string
}

export interface CoachEssentielNavState {
  showBenefits: boolean
  showBio: boolean
  hasPricing: boolean
  showTestimonials: boolean
}

type CoachEssentielBioSource = Pick<PublicProviderProfile, 'bio' | 'longBio'> | null | undefined

export function hasCoachEssentielPricing(
  consultationPlans: readonly unknown[],
  publicPrograms: readonly unknown[]
): boolean {
  return consultationPlans.length > 0 || publicPrograms.length > 0
}

export function getCoachEssentielBioParagraphs(profile: CoachEssentielBioSource): string[] {
  const longBio = profile?.longBio?.trim()
  if (longBio) {
    return longBio
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
  }

  const bio = profile?.bio?.trim()
  return bio ? [bio] : []
}

export function buildCoachEssentielNavLinks(state: CoachEssentielNavState): CoachEssentielNavLink[] {
  const links: CoachEssentielNavLink[] = []

  if (state.showBenefits) links.push({ label: 'Accompagnement', href: '#accompagnement' })
  if (state.showBio) links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  if (state.hasPricing) links.push({ label: 'Tarifs', href: '#tarifs' })
  if (state.showTestimonials) links.push({ label: 'Témoignages', href: '#temoignages' })

  return links
}
