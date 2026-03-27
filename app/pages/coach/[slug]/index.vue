<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicSeo } from '~/features/seo/usePublicSeo'
import { useCoachSchemaOrg } from '~/features/seo/useCoachSchemaOrg'
import { resolveOgImageStrategy } from '~/features/seo/og-image-helpers'
import { buildCoachBreadcrumbs } from '~/features/seo/breadcrumb-helpers'
import { getDomainContext } from '#shared/utils/domain-context'
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

// Schema.org: Person + ProfessionalService + BreadcrumbList (AC-1)
await useCoachSchemaOrg(slug.value)

usePageTracking(providerId)

// OG image: Satori generation when no custom image (Story U1.3)
// Specialties sourced from the enriched profile fetched by useCoachSchemaOrg
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
const { isPlatform, isB2B } = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)

const { data: coachProfile } = useNuxtData<{ specialties?: string[], displayName?: string }>(`public-provider-profile:${slug.value}`)

const ogStrategy = computed(() => resolveOgImageStrategy({
  customOgImageUrl: seo.value?.ogImageUrl,
  displayName: tenant.value?.brand.displayName ?? 'Coach',
  specialties: coachProfile.value?.specialties ?? [],
  domain: requestUrl.host,
  isPlatform
}))

// OG image: Satori generation via CoachProfile component (Story U1.3)
// Custom OG from seo_metadata takes priority (handled in useSeoMeta ogImage below)
if (ogStrategy.value.kind === 'satori') {
  defineOgImage({
    ...ogStrategy.value.props
  } as Record<string, unknown>)
}

const requiredTenant = computed(() => tenant.value as PublicTenantResponse)

const ctaTo = computed(() => `/coach/${tenant.value?.slug ?? slug.value}/onboarding/discovery`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

// U1.4b: Visible breadcrumbs — use coachProfile.displayName (same source as Schema.org BreadcrumbList)
// to guarantee AC-6 synchronization between UI breadcrumbs and JSON-LD
const breadcrumbDisplayName = computed(() => coachProfile.value?.displayName || brandName.value)
const breadcrumbItems = computed(() => buildCoachBreadcrumbs(breadcrumbDisplayName.value, isPlatform))

// Canonical cross-domaine: coach pages accessed via keova.app point to keova.fr (SEO reference domain)
// On B2B, force canonical to keova.fr regardless of any absolute canonical in seo_metadata (CR1-RFU-1)
const canonicalOrigin = isB2B ? `https://${platformDomain}` : origin
const b2bCanonical = `${canonicalOrigin}/coach/${slug.value}`
const canonicalHref = computed(() =>
  isB2B ? b2bCanonical : (resolveCanonical(seo.value?.canonicalUrl, canonicalOrigin) ?? b2bCanonical)
)

useSeoMeta({
  title: () => seo.value?.title ?? `${brandName.value} — Coach`,
  description: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogTitle: () => seo.value?.title ?? `${brandName.value} — Coach`,
  ogDescription: () => seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`,
  ogImage: () => ogStrategy.value.kind === 'custom' ? ogStrategy.value.url : null,
  ogUrl: () => canonicalHref.value,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

usePublicCanonicalHead(canonicalHref)

watchEffect(() => {
  setPublicHeader({
    variant: 'coach',
    layoutStyle: 'dock',
    brandLabel: 'Keova',
    brandTo: '/',
    showBrandIcon: true,
    navLinks: [
      { label: 'Accompagnement', href: '#accompagnement' },
      { label: 'Tarifs', href: '#tarifs' },
      { label: 'Témoignages', href: '#temoignages' },
      { label: 'Qui suis-je', href: '#qui-suis-je' }
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
  <div v-else>
    <AtomsBreadcrumbNav :items="breadcrumbItems" />
    <CoachPublicPageTemplate
      :tenant="requiredTenant"
      :cta-to="ctaTo"
    />
  </div>
</template>
