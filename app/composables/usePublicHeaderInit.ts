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
    // Seed the B2B or B2C header state before layout renders (SSR consistency)
    const headerState = usePublicHeaderState()

    if (ctx.isB2C) {
      headerState.value = {
        ...headerState.value,
        variant: 'marketing',
        layoutStyle: 'dock',
        brandLabel: 'Keova',
        brandTo: '/',
        showBrandIcon: true,
        navLinks: [
          { label: 'Accompagnement', href: '#education' },
          { label: 'Spécialistes', href: '#specialistes' },
          { label: 'Symptômes', href: '#symptomes' }
        ],
        loginLabel: 'Se connecter',
        loginTo: '/login',
        ctaLabel: 'Trouver ma spécialiste',
        ctaTo: '#specialistes'
      }
    } else {
      headerState.value = {
        ...headerState.value,
        variant: 'marketing',
        layoutStyle: 'dock',
        brandLabel: 'Keova',
        brandTo: '/',
        showBrandIcon: true,
        // ⚠️ Doit rester identique à `app/pages/index.vue` et `public-header.state.ts`
        // (voir le commentaire dans index.vue : divergence = flicker de la nav au paint).
        navLinks: [
          { label: 'Le problème', href: '#pourquoi' },
          { label: 'La solution', href: '#atelier' },
          { label: 'Témoignages', href: '#temoignage' },
          { label: 'Tarifs', href: '#tarifs' },
          { label: 'FAQ', href: '#faq' }
        ],
        loginLabel: 'Se connecter',
        loginTo: '/login',
        ctaLabel: 'Je réserve ma place',
        ctaTo: '#waitlist'
      }
    }

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
      brandLogoSrc: '/images/keova-logo-white-label.webp',
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
