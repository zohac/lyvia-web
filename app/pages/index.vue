<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
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

const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

const ctx = computed(() => getDomainContext(hostname.value, platformDomain, platformDomainB2B || undefined))
const isPlatformDomain = computed(() => ctx.value.isPlatform)

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

const b2bTitle = 'Keova — L\'espace pro pour spécialistes ménopause et bien-être | Beta privée'
const b2bDescription = 'Beta privée — rejoignez la liste d\'attente. Keova simplifie les accompagnements ménopause : agenda, paiements, suivi client dans un espace conçu pour les spécialistes.'
const b2cTitle = 'Keova — Trouvez votre spécialiste ménopause et périménopause'
const b2cDescription = 'Découvrez des spécialistes vérifiées pour un accompagnement ménopause personnalisé. Périménopause, ménopause : trouvez votre spécialiste.'

function platformTitle() {
  return ctx.value.isB2C ? b2cTitle : b2bTitle
}
function platformDescription() {
  return ctx.value.isB2C ? b2cDescription : b2bDescription
}

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
  ogImage: () => !isPlatformDomain.value ? seo.value?.ogImageUrl ?? undefined : undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
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
    // B2C login redirects to the B2B app domain (keova.app in prod, localhost in dev)
    const b2bOrigin = platformDomainB2B
      ? `${requestUrl.protocol}//${platformDomainB2B}${requestUrl.port ? `:${requestUrl.port}` : ''}`
      : ''
    const loginUrl = b2bOrigin ? `${b2bOrigin}/login` : '/login'

    setPublicHeader({
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
      loginTo: loginUrl,
      ctaLabel: 'Trouver ma spécialiste',
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
        { label: 'Pourquoi Keova', href: '#pourquoi' },
        { label: 'L\'atelier', href: '#atelier' },
        { label: 'Témoignage', href: '#temoignage' }
      ],
      loginLabel: 'Se connecter',
      loginTo: '/login',
      ctaLabel: 'Rejoindre la beta',
      ctaTo: '#waitlist'
    })
  }
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
    :seo-title="seo?.title ?? null"
    cta-to="/onboarding/discovery"
  />

  <MarketingLandingB2C v-else-if="ctx.isB2C" />

  <MarketingLandingB2B v-else />
</template>
