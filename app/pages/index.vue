<script setup lang="ts">
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { resolveB2CNavLinks } from '~/features/public/navigation/b2c-nav'
import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import CoachPublicPageTemplate from '~/components/templates/CoachPublicPageTemplate.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'
import CoachWaitingTemplate from '~/components/templates/CoachWaitingTemplate.vue'
import CoachPreviewBanner from '~/components/molecules/CoachPreviewBanner.vue'
import MarketingLandingB2B from '~/components/templates/MarketingLandingB2B.vue'
import MarketingLandingB2C from '~/components/templates/MarketingLandingB2C.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true
  }
})

const requestUrl = useRequestURL()
const origin = requestUrl.origin
const hostname = computed(() => requestUrl.hostname.toLowerCase())

await useGlobalSchemaOrg()

const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

const ctx = computed(() => getDomainContext(hostname.value, platformDomain, platformDomainB2B || undefined))
const isPlatformDomain = computed(() => ctx.value.isPlatform)

const route = useRoute()
const isPreview = computed(() => route.query.preview === 'true' || route.query.preview === '1')

// Shared composable — same key+handler as useGlobalSchemaOrg (no duplicate key warning)
const { data: tenant, status: tenantStatus } = await usePublicTenantHome()

if (!isPlatformDomain.value && !tenant.value && !isPreview.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const providerId = computed(() => tenant.value?.providerId)
const { seo } = usePublicSeo('coach_profile', providerId)

// Schema.org: Person + ProfessionalService (AC-2: white-label coach, no breadcrumb)
// Only inject on white-label — platform home is B2B marketing (global schema from app.vue)
if (!isPlatformDomain.value && tenant.value?.slug) {
  await useCoachSchemaOrg(tenant.value.slug)
}

// Tracking page views for white-label coach pages (custom domain)
usePageTracking(computed(() => isPlatformDomain.value ? undefined : providerId.value))

const whiteLabelBrandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

const b2bTitle = 'Keova — Logiciel tout-en-un pour spécialistes ménopause'
const b2bDescription = 'Keova réunit agenda en ligne, paiements et suivi client pour les coachs ménopause. Logiciel co-construit avec les praticiennes. Beta privée sur invitation.'
const b2cTitle = 'Accompagnement ménopause — Spécialistes formées | Keova'
const b2cDescription = 'Périménopause, ménopause, post-ménopause : comprenez vos symptômes et trouvez une spécialiste près de chez vous. Premier appel gratuit. Keova.'

function platformTitle() {
  return ctx.value.isB2C ? b2cTitle : b2bTitle
}
function platformDescription() {
  return ctx.value.isB2C ? b2cDescription : b2bDescription
}

// B2B homepage canonical/og:url → keova.app (AC-1, AC-21)
const canonicalHref = computed(() => {
  if (ctx.value.isB2B) return `https://${platformDomainB2B || platformDomain}/`
  return `${origin}/`
})

useSeoMeta({
  title: () =>
    isPlatformDomain.value
      ? platformTitle()
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  description: () =>
    isPlatformDomain.value
      ? platformDescription()
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogTitle: () =>
    isPlatformDomain.value
      ? platformTitle()
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  ogDescription: () =>
    isPlatformDomain.value
      ? platformDescription()
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogImage: () => isPlatformDomain.value ? `${origin}/images/og-default.png` : (seo.value?.ogImageUrl || null),
  ogUrl: () => canonicalHref.value,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

usePublicCanonicalHead(canonicalHref)

// Preload LCP image for B2B landing (AC-19) : géré par l'attribut `preload`
// sur le `<NuxtImg>` du hero (MarketingLandingB2B.vue). Le preload manuel via
// `useHead` ciblait une URL IPX qui ne correspondait pas à celle réellement
// générée par NuxtImg (warning "preload unused"), donc retiré.

// Set header state synchronously during setup (runs on both SSR and client)
// to avoid hydration mismatch — watchEffect only ran on client, leaving SSR with defaults.
function updatePublicHeader() {
  if (tenant.value) {
    const coachName = tenant.value.brand.displayName || 'Votre coach'
    setPublicHeader({
      variant: 'white-label',
      layoutStyle: 'dock',
      brandLabel: coachName,
      brandLogoSrc: '/images/keova-logo-white-label.webp',
      brandTo: '/',
      showBrandIcon: false,
      navLinks: [
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: 'Tarifs', href: '#tarifs' },
        { label: 'Témoignages', href: '#temoignages' },
        { label: 'Qui suis-je', href: '#qui-suis-je' }
      ],
      loginLabel: 'Espace cliente',
      loginTo: '/login',
      ctaLabel: 'Prendre RDV',
      ctaTo: '/onboarding/discovery'
    })
    return
  }

  if (ctx.value.isB2C) {
    setPublicHeader({
      variant: 'marketing',
      layoutStyle: 'dock',
      brandLabel: 'Keova',
      brandTo: '/',
      showBrandIcon: true,
      navLinks: resolveB2CNavLinks({ homeAnchorsAbsolute: false }),
      loginLabel: 'Se connecter',
      loginTo: '/login',
      ctaLabel: 'Trouver une spécialiste',
      ctaTo: '#specialistes'
    })
  } else {
    setPublicHeader({
      variant: 'marketing',
      layoutStyle: 'dock',
      brandLabel: 'Keova',
      brandTo: '/',
      showBrandIcon: true,
      // ⚠️ Ce tableau est dupliqué dans `usePublicHeaderInit.ts` et
      // `public-header.state.ts` (le layout rend le header AVANT le setup de la page :
      // sans alignement, premier paint à N liens puis swap à M → flicker de la nav).
      // Toute modification ici doit être répercutée dans les deux autres.
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
    })
  }
}

// Synchronous call during setup — SSR and client render the same header
updatePublicHeader()

// Reactive watch for client-side navigation (tenant data may change)
watch([tenant, ctx], updatePublicHeader)
</script>

<template>
  <div
    v-if="!isPlatformDomain && isPreview && tenantStatus === 'pending'"
    class="min-h-screen flex items-center justify-center"
  >
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
  </div>

  <CoachUnavailableTemplate
    v-else-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />

  <CoachWaitingTemplate
    v-else-if="tenant && !tenant.isPublished && !tenant.isPreview"
    :tenant="tenant"
    :coach-name="tenant.brand.displayName"
  />

  <div v-else-if="tenant">
    <CoachPreviewBanner
      v-if="tenant.isPreview"
      :is-test="tenant.isTest"
    />
    <CoachPublicPageTemplate
      :tenant="tenant"
      cta-to="/onboarding/discovery"
    />
  </div>

  <div
    v-else-if="!isPlatformDomain && isPreview"
    class="min-h-screen flex items-center justify-center p-4 bg-warm-50"
  >
    <div class="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 text-center space-y-4">
      <div class="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
        <UIcon
          name="i-lucide-eye-off"
          class="w-6 h-6"
        />
      </div>
      <h1 class="text-xl font-bold text-neutral-900">
        Aperçu indisponible
      </h1>
      <p class="text-sm text-neutral-600">
        La page de cette praticienne n'est pas accessible en mode prévisualisation. Vérifiez que vous êtes bien connecté à votre compte.
      </p>
      <UButton
        to="/login"
        color="primary"
        class="mt-2"
      >
        Se connecter
      </UButton>
    </div>
  </div>

  <MarketingLandingB2C v-else-if="ctx.isB2C" />

  <MarketingLandingB2B v-else />
</template>
