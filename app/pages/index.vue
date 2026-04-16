<script setup lang="ts">
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import CoachPublicPageTemplate from '~/components/templates/CoachPublicPageTemplate.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'
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

// Shared composable — same key+handler as useGlobalSchemaOrg (no duplicate key warning)
const { data: tenant } = await usePublicTenantHome()

if (!isPlatformDomain.value && !tenant.value) {
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
const b2bDescription = 'Keova réunit agenda en ligne, paiements et suivi client pour les coachs ménopause. Logiciel co-construit avec les praticiennes. Beta privée gratuite.'
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
      navLinks: [
        { label: 'Comprendre', href: '#education' },
        { label: 'Symptômes', href: '#symptomes' },
        { label: 'Spécialistes', href: '#specialistes' },
        { label: 'FAQ', href: '#faq' }
      ],
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
      navLinks: [
        { label: 'Le problème', href: '#pourquoi' },
        { label: 'La solution', href: '#atelier' },
        { label: 'Témoignages', href: '#temoignage' },
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
  <CoachUnavailableTemplate
    v-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />

  <CoachPublicPageTemplate
    v-else-if="tenant"
    :tenant="tenant"
    cta-to="/onboarding/discovery"
  />

  <MarketingLandingB2C v-else-if="ctx.isB2C" />

  <MarketingLandingB2B v-else />
</template>
