<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
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
import CoachPageHub from '~/components/templates/coach-pages/CoachPageHub.vue'

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

// Domain context — computed early so Schema.org and hub logic can use it
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
const { isPlatform, isB2B } = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)

// YC2.4: hub = platform host + coach has verified WL domain
const hasWlDomain = !!tenant.value?.brand.domain

// Schema.org: Person + ProfessionalService + BreadcrumbList (AC-1)
// YC2.4: hubMode skips ProfessionalService (F2), sameAs cross-references WL site (AC-6)
await useCoachSchemaOrg(slug.value, {
  whiteLabeldomain: tenant.value?.brand.domain,
  hubMode: isPlatform && hasWlDomain
})

usePageTracking(providerId)

// YC2.4: widen type to PublicProviderProfile so both OG strategy and CoachPageHub can consume it
const { data: coachProfile } = useNuxtData<PublicProviderProfile>(`public-provider-profile:${slug.value}`)

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

// YC2.4 — Hub vs full page: on the platform host, if the coach has a verified
// white-label domain, render a minimal hub card (AD-Y6: condition in page, not middleware)
const isHubPage = computed(() => isPlatform && !!tenant.value?.brand.domain)

const ctaTo = computed(() => `/coach/${tenant.value?.slug ?? slug.value}/onboarding/discovery`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

// U1.4b: Visible breadcrumbs — use coachProfile.displayName (same source as Schema.org BreadcrumbList)
// to guarantee AC-6 synchronization between UI breadcrumbs and JSON-LD
const breadcrumbDisplayName = computed(() => coachProfile.value?.displayName || brandName.value)
const breadcrumbItems = computed(() => buildCoachBreadcrumbs(breadcrumbDisplayName.value, isPlatform))

// Canonical cross-domaine: coach pages accessed via keova.app point to keova.fr (SEO reference domain)
// On B2B, force canonical to keova.fr regardless of any absolute canonical in seo_metadata (CR1-RFU-1)
const canonicalOrigin = isB2B ? `https://${platformDomain}` : origin
const platformCanonical = `https://${platformDomain}/coach/${slug.value}`
const canonicalHref = computed(() => {
  // F1: Hub pages ALWAYS canonical to keova.fr/coach/{slug} — no SEO override
  if (isHubPage.value) return platformCanonical
  if (isB2B) return platformCanonical
  return resolveCanonical(seo.value?.canonicalUrl, canonicalOrigin) ?? platformCanonical
})

// F3: Hub-specific meta tags — "{coachName} — Coach {specialite} | Keova" + bio courte
const mainSpecialty = computed(() => coachProfile.value?.specialties?.[0] ?? null)
const hubTitle = computed(() => {
  const parts = [brandName.value]
  if (mainSpecialty.value) parts.push(`Coach ${mainSpecialty.value}`)
  parts.push('Keova')
  return parts.join(' — ')
})
const hubDescription = computed(() => {
  const bio = coachProfile.value?.bio ?? ''
  if (bio.length <= 160) return bio || `Découvrez ${brandName.value}, spécialiste accompagnement ménopause sur Keova.`
  return bio.slice(0, 157).trimEnd() + '...'
})

useSeoMeta({
  title: () => isHubPage.value ? hubTitle.value : (seo.value?.title ?? `${brandName.value} — Coach`),
  description: () => isHubPage.value ? hubDescription.value : (seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`),
  ogTitle: () => isHubPage.value ? hubTitle.value : (seo.value?.title ?? `${brandName.value} — Coach`),
  ogDescription: () => isHubPage.value ? hubDescription.value : (seo.value?.description ?? `${brandName.value} — Coaching et accompagnement`),
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
    // YC2.4: hub pages have no anchor sections — skip navLinks
    navLinks: isHubPage.value
      ? []
      : [
          { label: 'Accompagnement', href: '#accompagnement' },
          { label: 'Tarifs', href: '#tarifs' },
          { label: 'Témoignages', href: '#temoignages' },
          { label: 'Qui suis-je', href: '#qui-suis-je' }
        ],
    loginLabel: 'Se connecter',
    loginTo: '/login',
    // F4: hub has no header CTA (2 CTAs already in the hub card)
    ctaLabel: isHubPage.value ? '' : 'Réserver',
    ctaTo: isHubPage.value ? '' : ctaTo.value
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
    <!-- YC2.4 — Hub card when platform host + coach has WL domain -->
    <CoachPageHub
      v-if="isHubPage && coachProfile"
      :profile="coachProfile"
      :domain="tenant!.brand.domain!"
    />
    <CoachPublicPageTemplate
      v-else
      :tenant="requiredTenant"
      :cta-to="ctaTo"
    />
  </div>
</template>
