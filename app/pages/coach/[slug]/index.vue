<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
import { setPublicHeader } from '~/features/public/state/public-header.state'
import CoachPublicPageTemplate from '~/components/templates/CoachPublicPageTemplate.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'

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

// Schema.org: Person + ProfessionalService + BreadcrumbList (AC-1: platform coach)
await useCoachSchemaOrg(slug.value, { isPlatform: true })

usePageTracking(providerId)

const requiredTenant = computed(() => tenant.value as PublicTenantResponse)

const ctaTo = computed(() => `/coach/${tenant.value?.slug ?? slug.value}/onboarding/discovery`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

const canonicalHref = () => resolveCanonical(seo.value?.canonicalUrl, origin) ?? `${origin}/coach/${slug.value}`

useSeoMeta({
  title: () => seo.value?.title ?? `${brandName.value} — Coach`,
  description: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogTitle: () => seo.value?.title ?? `${brandName.value} — Coach`,
  ogDescription: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogImage: () => seo.value?.ogImageUrl ?? undefined,
  ogUrl: canonicalHref,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [{ rel: 'canonical', href: canonicalHref }]
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
  <CoachUnavailableTemplate
    v-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />
  <CoachPublicPageTemplate
    v-else
    :tenant="requiredTenant"
    :cta-to="ctaTo"
  />
</template>
