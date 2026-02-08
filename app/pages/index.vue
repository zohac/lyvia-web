<script setup lang="ts">
import type { PublicTenantResponse } from '../features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '../services/api/api-error'
import { apiFetch } from '../services/api/apiFetch'
import { setPublicHeader } from '../features/public/state/public-header.state'
import CoachPublicPageTemplate from '../components/templates/CoachPublicPageTemplate.vue'
import MarketingLandingB2B from '../components/templates/MarketingLandingB2B.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true
  }
})

const requestUrl = useRequestURL()
const hostname = computed(() => requestUrl.hostname.toLowerCase())

const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'kaora.app'

const isPlatformDomain = computed(() => {
  // Always allow localhost for local development
  const devHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
  if (devHosts.has(hostname.value)) return true

  // Exact match (e.g., kaora.app or lyvia-web.vercel.app)
  if (hostname.value === platformDomain) return true

  // Subdomain match (e.g., www.kaora.app, staging.kaora.app)
  if (hostname.value.endsWith(`.${platformDomain}`)) return true

  return false
})

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

useSeoMeta({
  title: () => tenant.value?.brand.displayName
    ? `${tenant.value.brand.displayName} — Accompagnement global pour femmes en périménopause et ménopause`
    : 'Kaora — Coaching Platform',
  description: () =>
    tenant.value
      ? 'Retrouvez équilibre, énergie et sérénité pendant la ménopause avec un accompagnement humain, global et personnalisé.'
      : 'Réservez vos rendez-vous, payez en ligne en toute sécurité, et accédez à des contenus utiles — dans une interface apaisante pensée pour durer.',
  ogTitle: () => tenant.value?.brand.displayName
    ? `${tenant.value.brand.displayName} — Coaching bienveillant pour femmes en périménopause et ménopause`
    : undefined,
  ogDescription: () => tenant.value
    ? 'Fatigue, insomnies, bouffées de chaleur ? Offrez-vous un accompagnement humain, global et gratuit.'
    : undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

watchEffect(() => {
  if (tenant.value) {
    setPublicHeader({
      variant: 'white-label',
      layoutStyle: 'dock',
      brandLabel: tenant.value.brand.displayName || 'Votre coach',
      brandLogoSrc: '/images/logo_aurea_menopause_inline.png',
      brandTo: '/',
      showBrandIcon: false,
      navLinks: [
        { label: 'L\'Essence', href: '#essence' },
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: 'Sophie', href: '#qui-suis-je' }
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
  <div v-if="tenant">
    <CoachPublicPageTemplate
      :tenant="tenant"
      cta-to="/onboarding/discovery"
    />
  </div>

  <MarketingLandingB2B v-else />
</template>
