import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicHeaderState } from '~/features/public/state/public-header.state'
import { buildCoachLayoutSeed } from '~/features/public/state/coach-layout-seed'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import { usePublicTenant } from '~/composables/usePublicTenant'
import { usePublicProviderProfile } from '~/composables/usePublicProviderProfile'
import { usePublicPagesMenu } from '~/composables/usePublicPagesMenu'
import { templateRendersOwnHeader } from '~/composables/coach-template-registry'

/**
 * Initializes the public header state at app.vue level (before layout render).
 * This ensures SSR and client render the same header — the layout renders
 * the header BEFORE the page's setup runs, so we must set the correct state here.
 *
 * Pages (index.vue, coach/[slug], etc.) can override later with page-specific nav links.
 *
 * ⚠️ Le contexte Nuxt (et `useState`/`useAsyncData`) n'est PLUS accessible après un
 * `await`. Tous les resolvers et refs sont donc capturés AVANT le premier await,
 * puis seulement awaités.
 */

function isPreviewQuery(query: Record<string, unknown> | undefined): boolean {
  return query?.preview === 'true' || query?.preview === '1'
}

/** Nombre de segments d'un chemin, hors slashes de bord. */
function pathSegmentCount(path: string): number {
  return path.split('/').filter(Boolean).length
}

/** Slug coach pour tout chemin `/coach/<slug>...` (page coach OU sous-route). */
function coachSlugForAnyPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean)
  if (segments[0] !== 'coach' || segments.length < 2) return null
  return segments[1] ?? null
}

export async function usePublicHeaderInit() {
  const requestUrl = useRequestURL()
  const route = useRoute()
  const hostname = requestUrl.hostname.toLowerCase()
  const isPreview = isPreviewQuery(route.query as Record<string, unknown>)

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  // Capturés AVANT tout await — le contexte Nuxt est perdu après.
  const headerState = usePublicHeaderState()
  const hideLayoutHeader = useState('hide-layout-header', () => false)
  const nuxtApp = useNuxtApp()

  if (ctx.isPlatform) {
    // Seed the B2B or B2C header state before layout renders (SSR consistency)
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
          { label: 'Ce que fait Keova', href: '#atelier' },
          { label: 'Preuve', href: '#preuve' },
          { label: 'Tarifs', href: '#tarifs' },
          { label: 'FAQ', href: '#faq' }
        ],
        loginLabel: 'Se connecter',
        loginTo: '/login',
        ctaLabel: 'Demander un accès',
        ctaTo: '#waitlist'
      }
    }

    // Page coach complète sur la plateforme : sème l'état header/footer AVANT le
    // rendu du layout (sinon header ET footer divergent à l'hydratation). Les
    // sous-routes `/coach/<slug>/...` (page dynamique) ne reçoivent que le
    // tenant : leur header est posé par la page, mais le footer
    // (`LegalFooterLinks`) a besoin du tenant avant son rendu.
    const coachSlug = coachSlugForAnyPath(route.path)
    if (coachSlug) {
      const isFullCoachPage = pathSegmentCount(route.path) === 2
      const tenantResolver = usePublicTenant(coachSlug, isPreview)
      const profileResolver = isFullCoachPage ? usePublicProviderProfile(coachSlug, isPreview) : null
      const menuResolver = isFullCoachPage ? usePublicPagesMenu(coachSlug) : null

      const { data: tenant } = await tenantResolver

      if (tenant.value && profileResolver && menuResolver) {
        const { data: profile } = await profileResolver
        const { menuPages } = await menuResolver
        const seed = buildCoachLayoutSeed({
          slug: coachSlug,
          profile: profile.value,
          menuPages: menuPages.value,
          isHubPage: !!tenant.value.brand.domain,
          ctaTo: `/coach/${tenant.value.slug ?? coachSlug}/onboarding/discovery`
        })
        headerState.value = { ...headerState.value, ...seed.header }
        hideLayoutHeader.value = seed.hideLayoutHeader
      }
    }

    return
  }

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

    // Le slug n'est connu qu'après l'await : on rappelle le resolver dans le
    // contexte Nuxt restauré, puis on n'utilise plus que des refs capturées.
    const { data: profile } = await nuxtApp.runWithContext(() =>
      usePublicProviderProfile(tenant.value!.slug, isPreview)
    )
    // Le template n'est rendu que si la page existe réellement (publiée ou aperçu).
    const rendersTemplate = tenant.value.isActive && (tenant.value.isPublished || !!tenant.value.isPreview)
    hideLayoutHeader.value = rendersTemplate && templateRendersOwnHeader(profile.value?.templateCode)
  }
}
