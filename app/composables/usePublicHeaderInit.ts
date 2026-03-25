import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicHeaderState } from '~/features/public/state/public-header.state'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'

/**
 * Initializes the public header state at app.vue level (before layout render).
 * This ensures SSR and client render the same header — the layout renders
 * the header BEFORE the page's setup runs, so we must set the correct state here.
 *
 * Pages (index.vue, coach/[slug], etc.) can override later with page-specific nav links.
 */
export async function usePublicHeaderInit() {
  const requestUrl = useRequestURL()
  const hostname = requestUrl.hostname.toLowerCase()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  if (ctx.isPlatform) {
    return
  }

  // Capture useState ref BEFORE await — after await, Nuxt context is lost.
  const headerState = usePublicHeaderState()

  // White-label: fetch tenant and set header state before the layout renders.
  const { data: tenant } = await usePublicTenantHome()

  if (tenant.value) {
    const coachName = tenant.value.brand.displayName || 'Votre coach'
    headerState.value = {
      ...headerState.value,
      variant: 'white-label',
      layoutStyle: 'dock',
      brandLabel: coachName,
      brandLogoSrc: '/images/logo_aurea_menopause_inline.png',
      brandTo: '/',
      showBrandIcon: false,
      navLinks: [],
      loginLabel: 'Espace cliente',
      loginTo: '/login',
      ctaLabel: 'Prendre RDV',
      ctaTo: '/onboarding/discovery'
    }
  }
}
