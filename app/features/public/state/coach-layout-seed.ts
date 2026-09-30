import { formatPageNavLinks } from '#shared/utils/page-seo-helpers'
import type { PublicHeaderState } from '~/features/public/state/public-header.state'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicPageMenuItem } from '~/composables/usePublicPagesMenu'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import { templateRendersOwnHeader } from '~/composables/coach-template-registry'

/**
 * Semence de l'état de layout d'une page coach (header public + masquage du
 * header global). Source unique partagée par `usePublicHeaderInit` (semée AVANT
 * le rendu du layout, ce qui rend le SSR cohérent avec le client) et par la page
 * `/coach/[slug]` (mise à jour réactive côté client).
 *
 * Sans cette semence pré-rendu, le layout (header ET footer) rend avec l'état
 * par défaut, puis le setup de la page le corrige — d'où les `Hydration node
 * mismatch` historiques sur `<Public>`, `AtomsLegalFooterLinks` et `UModal`.
 */
export interface CoachLayoutSeedInput {
  slug: string
  profile: PublicProviderProfile | null | undefined
  menuPages: PublicPageMenuItem[]
  isHubPage: boolean
  ctaTo: string
}

export interface CoachLayoutSeed {
  header: Partial<PublicHeaderState>
  hideLayoutHeader: boolean
}

export function buildCoachLayoutSeed(input: CoachLayoutSeedInput): CoachLayoutSeed {
  const { slug, profile, menuPages, isHubPage, ctaTo } = input
  const { show, isToggleOn } = useCoachSectionVisibility(() => profile)

  const links: Array<{ label: string, href: string }> = []
  if (!isHubPage) {
    if (show.benefits.value) links.push({ label: 'Accompagnement', href: '#accompagnement' })
    if (isToggleOn('pricing')) links.push({ label: 'Tarifs', href: '#tarifs' })
    if (show.testimonials.value) links.push({ label: 'Témoignages', href: '#temoignages' })
    if (show.bio.value) links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  }

  const dynamicLinks = formatPageNavLinks(menuPages, `/coach/${slug}`)

  return {
    header: {
      variant: 'coach',
      layoutStyle: 'dock',
      brandLabel: 'Keova',
      brandTo: '/',
      showBrandIcon: true,
      navLinks: [...links, ...dynamicLinks],
      loginLabel: 'Se connecter',
      loginTo: '/login',
      ctaLabel: isHubPage ? '' : 'Réserver',
      ctaTo: isHubPage ? '' : ctaTo
    },
    // Le hub rend le header global ; un template « auto-porté » (Essentiel,
    // Visuel, Alba) masque le header global et rend le sien.
    hideLayoutHeader: !isHubPage && templateRendersOwnHeader(profile?.templateCode)
  }
}
