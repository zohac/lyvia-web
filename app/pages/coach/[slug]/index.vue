<script setup lang="ts">
import type { PublicTenantResponse } from '../../../features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '../../../services/api/api-error'
import { apiFetch } from '../../../services/api/apiFetch'
import { usePublicSeo } from '../../../features/seo/usePublicSeo'
import { usePageTracking } from '../../../features/analytics/usePageTracking'
import { resolveCanonical } from '../../../features/seo/resolveCanonical'
import { setPublicHeader } from '../../../features/public/state/public-header.state'
import CoachPublicPageTemplate from '../../../components/templates/CoachPublicPageTemplate.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true
  }
})

const route = useRoute()
const origin = useRequestURL().origin
const slug = computed(() => String(route.params.slug ?? '').trim())

if (!slug.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const { data: tenant } = await useAsyncData<PublicTenantResponse>(`public-tenant:${slug.value}`, async () => {
  try {
    return await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false,
      query: { slug: slug.value }
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && err.apiError.code === 'TENANT_NOT_FOUND') {
      throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
    }
    throw err
  }
})

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const providerId = computed(() => tenant.value?.providerId)
const { seo } = usePublicSeo('coach_profile', providerId)

usePageTracking(providerId)

const requiredTenant = computed(() => tenant.value as PublicTenantResponse)

const ctaTo = computed(() => `/coach/${tenant.value?.slug ?? slug.value}/onboarding/discovery`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

useSeoMeta({
  title: () => seo.value?.title ?? `${brandName.value} — Coach`,
  description: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogTitle: () => seo.value?.title ?? `${brandName.value} — Coach`,
  ogDescription: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogImage: () => seo.value?.ogImageUrl ?? undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [{ rel: 'canonical', href: () => resolveCanonical(seo.value?.canonicalUrl, origin) }]
})

watchEffect(() => {
  setPublicHeader({
    variant: 'coach',
    layoutStyle: 'dock',
    brandLabel: 'Kaora',
    brandTo: '/',
    showBrandIcon: true,
    navLinks: [
      { label: 'L\'Essence', href: '#essence' },
      { label: 'Accompagnement', href: '#accompagnement' },
      { label: brandName.value, href: '#qui-suis-je' }
    ],
    loginLabel: 'Se connecter',
    loginTo: '/login',
    ctaLabel: 'Réserver',
    ctaTo: ctaTo.value
  })
})
</script>

<template>
  <CoachPublicPageTemplate
    :tenant="requiredTenant"
    :cta-to="ctaTo"
  />
</template>
