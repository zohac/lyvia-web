/**
 * Determines which OG image strategy to use for a coach page.
 * Convention 5: pure helper testable for composable SEO logic.
 *
 * Priority:
 * 1. Custom OG image from seo_metadata → use it directly
 * 2. No custom → generate via Satori (CoachProfile component)
 * 3. Satori fallback → global og-default.png (configured in nuxt.config.ts)
 */
export type OgImageStrategy
  = | { kind: 'custom', url: string }
    | { kind: 'satori', props: SatoriCoachProps }

export type SatoriCoachProps = {
  component: 'CoachProfile'
  displayName: string
  speciality: string
  domain: string
  isPlatform: boolean
}

export function resolveOgImageStrategy(input: {
  customOgImageUrl: string | null | undefined
  displayName: string
  specialties: string[]
  domain: string
  isPlatform: boolean
}): OgImageStrategy {
  if (input.customOgImageUrl) {
    return { kind: 'custom', url: input.customOgImageUrl }
  }

  return {
    kind: 'satori',
    props: {
      component: 'CoachProfile',
      displayName: input.displayName,
      speciality: input.specialties[0] ?? 'ménopause',
      domain: input.domain,
      isPlatform: input.isPlatform
    }
  }
}
