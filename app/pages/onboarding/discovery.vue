<template>
  <CoachUnavailableTemplate
    v-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />
  <DiscoveryBookingWizard v-else />
</template>

<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'

definePageMeta({
  layout: 'focus'
})

const origin = useRequestURL().origin

// Resolve tenant for white-label (Host header resolution, no slug)
const { data: tenant } = await useAsyncData<PublicTenantResponse | null>('public-tenant-discovery', async () => {
  try {
    return await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false
    })
  } catch {
    return null
  }
}, { default: () => null })

// Guard 404: white-label route requires a resolved tenant
// Covers: unknown domain (tenant not found) and platform domain without slug (SLUG_REQUIRED → null)
if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const providerId = computed(() => tenant.value?.providerId)
const { seo } = usePublicSeo('coach_booking', providerId)

usePageTracking(providerId)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

useSeoMeta({
  title: () => seo.value?.title ?? `Réserver avec ${brandName.value}`,
  description: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte`,
  ogTitle: () => seo.value?.title ?? `Réserver avec ${brandName.value}`,
  ogDescription: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte`,
  ogImage: () => seo.value?.ogImageUrl ?? undefined,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: (title?: string) => title || '',
  link: [{ rel: 'canonical', href: () => resolveCanonical(seo.value?.canonicalUrl, origin) ?? `${origin}/onboarding/discovery` }]
})
</script>
