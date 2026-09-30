<template>
  <CoachUnavailableTemplate
    v-if="tenant && !tenant.isActive"
    :coach-name="tenant.brand.displayName"
  />
  <div v-else>
    <AtomsBreadcrumbNav :items="bookingBreadcrumbs" />
    <DiscoveryBookingWizard :slug="slug" />
    <!-- U1.4a: Medical disclaimer (YMYL obligation) -->
    <AtomsMedicalDisclaimer />
  </div>
</template>

<script setup lang="ts">
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useBookingSchemaOrg } from '~/features/seo/useBookingSchemaOrg'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import { resolveCanonical } from '~/features/seo/resolveCanonical'
import { buildBookingBreadcrumbs } from '~/features/seo/breadcrumb-helpers'
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { usePublicTenant } from '~/composables/usePublicTenant'
import { usePublicProviderProfile } from '~/composables/usePublicProviderProfile'
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'
import CoachUnavailableTemplate from '~/components/templates/CoachUnavailableTemplate.vue'

definePageMeta({
  layout: 'focus'
})

const route = useRoute()
const origin = useRequestURL().origin
const slug = computed(() => String(route.params.slug ?? '').trim())

const { data: tenant } = await usePublicTenant(slug.value)

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const providerId = computed(() => tenant.value?.providerId)
const { seo } = usePublicSeo('coach_booking', providerId)

await usePublicProviderProfile(slug.value)

const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

setPublicHeader({
  variant: 'coach',
  layoutStyle: 'bar',
  brandLabel: 'Keova',
  brandTo: '/',
  showBrandIcon: true,
  navLinks: [],
  loginLabel: 'Se connecter',
  loginTo: '/login',
  ctaLabel: 'Réserver',
  ctaTo: `/coach/${slug.value}/onboarding/discovery`
})

// Schema.org: Service + BreadcrumbList (AC-3)
useBookingSchemaOrg(slug.value, () => brandName.value)

usePageTracking(providerId)

// U1.4b: Visible breadcrumbs — always platform here (route has /coach/[slug])
const bookingBreadcrumbs = computed(() =>
  buildBookingBreadcrumbs(brandName.value, slug.value, true)
)

// Keep in sync with onboarding/discovery.vue (white-label)
const canonicalHref = computed(() =>
  resolveCanonical(seo.value?.canonicalUrl, origin) ?? `${origin}/coach/${slug.value}/onboarding/discovery`
)

useSeoMeta({
  title: () => seo.value?.title ?? `Appel découverte | ${brandName.value}`,
  description: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte gratuite`,
  ogTitle: () => seo.value?.title ?? `Appel découverte | ${brandName.value}`,
  ogDescription: () => seo.value?.description ?? `Prenez rendez-vous avec ${brandName.value} pour une séance découverte gratuite`,
  ogImage: () => seo.value?.ogImageUrl || null,
  ogUrl: () => canonicalHref.value,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: (title?: string) => title || ''
})

usePublicCanonicalHead(canonicalHref)
</script>
