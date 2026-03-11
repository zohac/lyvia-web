<template>
  <CoachUnavailableTemplate
    v-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />
  <DiscoveryBookingWizard
    v-else
    :slug="slug"
  />
</template>

<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useBookingSchemaOrg } from '~/features/seo/useBookingSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'

definePageMeta({
  layout: 'focus'
})

const route = useRoute()
const origin = useRequestURL().origin
const slug = computed(() => String(route.params.slug ?? '').trim())

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
const { seo } = usePublicSeo('coach_booking', providerId)

const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

// Schema.org: Service + BreadcrumbList (AC-3)
useBookingSchemaOrg(slug.value, () => brandName.value)

usePageTracking(providerId)

// Keep in sync with onboarding/discovery.vue (white-label)
const canonicalHref = () => resolveCanonical(seo.value?.canonicalUrl, origin) ?? `${origin}/coach/${slug.value}/onboarding/discovery`

useSeoMeta({
  title: () => seo.value?.title ?? `Réserver avec ${brandName.value}`,
  description: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte`,
  ogTitle: () => seo.value?.title ?? `Réserver avec ${brandName.value}`,
  ogDescription: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte`,
  ogImage: () => seo.value?.ogImageUrl ?? undefined,
  ogUrl: canonicalHref,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: (title?: string) => title || '',
  link: [{ rel: 'canonical', href: canonicalHref }]
})
</script>
