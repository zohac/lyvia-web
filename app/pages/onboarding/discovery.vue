<template>
  <div v-if="tenant">
    <CoachUnavailableTemplate
      v-if="!tenant.isActive"
      :coach-name="tenant.brand.displayName"
    />
    <div v-else>
      <AtomsBreadcrumbNav :items="bookingBreadcrumbs" />
      <DiscoveryBookingWizard />
      <!-- U1.4a: Medical disclaimer (YMYL obligation) -->
      <AtomsMedicalDisclaimer />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useBookingSchemaOrg } from '~/features/seo/useBookingSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
import { buildBookingBreadcrumbs } from '~/features/seo/breadcrumb-helpers'
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

const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

// Schema.org: Service + BreadcrumbList (AC-4)
useBookingSchemaOrg(tenant.value.slug, () => brandName.value)

usePageTracking(providerId)

// U1.4b: Visible breadcrumbs — white-label (no coach intermediary)
const bookingBreadcrumbs = computed(() =>
  buildBookingBreadcrumbs(brandName.value, tenant.value?.slug ?? '', false)
)

// Keep in sync with coach/[slug]/onboarding/discovery.vue
const canonicalHref = () => resolveCanonical(seo.value?.canonicalUrl, origin) ?? `${origin}/onboarding/discovery`

useSeoMeta({
  title: () => seo.value?.title ?? `Appel découverte | ${brandName.value}`,
  description: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte gratuite`,
  ogTitle: () => seo.value?.title ?? `Appel découverte | ${brandName.value}`,
  ogDescription: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte gratuite`,
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
