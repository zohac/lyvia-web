<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { isPlatformHost } from '~/features/public/domain/platform-host'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
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
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'kaora.app'

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

// Tracking page views for white-label coach pages (custom domain)
usePageTracking(computed(() => isPlatformDomain.value ? undefined : providerId.value))

const whiteLabelBrandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

useSeoMeta({
  title: () =>
    isPlatformDomain.value
      ? 'Kaora - Simplifiez vos accompagnements ménopause | Agenda, paiements, suivi client'
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  description: () =>
    isPlatformDomain.value
      ? 'Kaora aide les coachs ménopause et praticiennes du bien-être à fluidifier leurs accompagnements : page publique, agenda, paiements et ressources client, dans une expérience calme. Essai gratuit, sans carte bancaire.'
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogTitle: () =>
    isPlatformDomain.value
      ? 'Kaora - L\u2019espace pro qui simplifie vos accompagnements ménopause'
      : seo.value?.title ?? `${whiteLabelBrandName.value} - Coach`,
  ogDescription: () =>
    isPlatformDomain.value
      ? 'Page publique, agenda, paiements, ressources : Kaora structure votre pratique sans alourdir votre charge mentale. Essai gratuit, sans carte bancaire.'
      : seo.value?.description ?? `${whiteLabelBrandName.value} - Coaching et accompagnement`,
  ogImage: () => !isPlatformDomain.value ? seo.value?.ogImageUrl ?? undefined : undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: (title?: string) => isPlatformDomain.value ? `${title} | Kaora` : (title || ''),
  link: [{ rel: 'canonical', href: () => !isPlatformDomain.value ? resolveCanonical(seo.value?.canonicalUrl, origin) : undefined }]
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
    brandLabel: 'Kaora',
    brandTo: '/',
    showBrandIcon: true,
    navLinks: [
      { label: 'L\'Essence', href: '#essence' },
      { label: 'Atelier', href: '#atelier' },
      { label: 'Parcours', href: '#parcours' }
    ],
    loginLabel: 'Se connecter',
    loginTo: '/login',
    ctaLabel: 'Essayer Kaora',
    ctaTo: '/login'
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
