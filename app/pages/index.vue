<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { isPlatformHost } from '#shared/utils/platform-host'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import CoachPublicPageTemplate from '~/components/templates/CoachPublicPageTemplate.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'
import MarketingLandingB2B from '~/components/templates/MarketingLandingB2B.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true
  }
})

const requestUrl = useRequestURL()
const origin = requestUrl.origin
const hostname = computed(() => requestUrl.hostname.toLowerCase())

const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'

const isPlatformDomain = computed(() => isPlatformHost(hostname.value, platformDomain))

const { data: tenant } = await useAsyncData<PublicTenantResponse | null>('public-tenant-home', async () => {
  try {
    return await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && (err.apiError.code === 'TENANT_NOT_FOUND' || err.apiError.code === 'SLUG_REQUIRED')) {
      return null
    }
    return null
  }
}, { default: () => null })

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

useSeoMeta({
  title: () =>
    isPlatformDomain.value
      ? 'Keova \u2014 L\u2019espace pro pour sp\u00e9cialistes m\u00e9nopause et bien-\u00eatre | Beta priv\u00e9e'
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  description: () =>
    isPlatformDomain.value
      ? 'Beta priv\u00e9e \u2014 rejoignez la liste d\u2019attente. Keova simplifie les accompagnements m\u00e9nopause : agenda, paiements, suivi client dans un espace con\u00e7u pour les sp\u00e9cialistes.'
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogTitle: () =>
    isPlatformDomain.value
      ? 'Keova \u2014 L\u2019espace pro pour sp\u00e9cialistes m\u00e9nopause et bien-\u00eatre | Beta priv\u00e9e'
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  ogDescription: () =>
    isPlatformDomain.value
      ? 'Beta priv\u00e9e \u2014 rejoignez la liste d\u2019attente. Keova simplifie les accompagnements m\u00e9nopause.'
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogImage: () => !isPlatformDomain.value ? seo.value?.ogImageUrl ?? undefined : undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: (title?: string) => isPlatformDomain.value ? (title || '') : (title || ''),
  link: [{
    rel: 'canonical',
    href: () => {
      // Both platform and white-label home: canonical is self-referencing
      // The API fallback returns /coach/{slug} which is correct for /coach/[slug]
      // but not for the home page — override with origin root
      return `${origin}/`
    }
  }]
})

watchEffect(() => {
  if (tenant.value) {
    const coachName = tenant.value.brand.displayName || 'Votre coach'
    setPublicHeader({
      variant: 'white-label',
      layoutStyle: 'dock',
      brandLabel: coachName,
      brandLogoSrc: '/images/logo_aurea_menopause_inline.png',
      brandTo: '/',
      showBrandIcon: false,
      navLinks: [
        { label: 'L\'Essence', href: '#essence' },
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: coachName, href: '#qui-suis-je' }
      ],
      loginLabel: 'Espace cliente',
      loginTo: '/login',
      ctaLabel: 'Prendre RDV',
      ctaTo: '/onboarding/discovery'
    })
    return
  }

  setPublicHeader({
    variant: 'marketing',
    layoutStyle: 'dock',
    brandLabel: 'Keova',
    brandTo: '/',
    showBrandIcon: true,
    navLinks: [
      { label: 'Pourquoi Keova', href: '#pourquoi' },
      { label: 'L\'atelier', href: '#atelier' },
      { label: 'Témoignage', href: '#temoignage' }
    ],
    loginLabel: 'Se connecter',
    loginTo: '/login',
    ctaLabel: 'Rejoindre la beta',
    ctaTo: '#waitlist'
  })
})
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

  <MarketingLandingB2B v-else />
</template>
