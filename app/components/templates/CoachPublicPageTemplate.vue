<script setup lang="ts">
/**
 * CoachPublicPageTemplate — Data loader de la page coach publique.
 * Fetches programs, pricing, and profile, then delegates rendering to resolved template.
 */
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ListConsultationPricePlansResponse } from '~/features/consultation/api/consultation.contract'
import { useAuthState } from '~/features/auth/state/auth.state'
import { listPublicPrograms } from '~/features/programs/services/public-programs.service'
import { listConsultationPricePlans } from '~/features/consultation/services/client-consultation.service'
import { useCoachPageTemplate } from '~/composables/useCoachPageTemplate'
import { fetchPublicProviderProfile } from '~/features/seo/useCoachSchemaOrg'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()

const route = useRoute()
const authState = useAuthState()
const isAuthenticated = computed(() => authState.value.status === 'authenticated')
const currentPath = computed(() => route.fullPath)

onMounted(async () => {
  if (authState.value.status !== 'unknown') return

  const { useAuth } = await import('~/composables/useAuth')
  await useAuth().bootstrap()
})

const { data: publicPrograms } = await useAsyncData<PublicProgramListItem[]>(
  `public-programs:${props.tenant.slug}`,
  async () => {
    try {
      return await listPublicPrograms(props.tenant.slug)
    } catch {
      return []
    }
  },
  { default: () => [] }
)

const { data: pricingData } = await useAsyncData<ListConsultationPricePlansResponse | null>(
  `pricing-${props.tenant.providerId}`,
  async () => {
    try {
      return await listConsultationPricePlans(props.tenant.providerId)
    } catch {
      return null
    }
  },
  { default: () => null }
)

// Enriched profile is populated by useCoachSchemaOrg or fetched directly.
const isPreview = computed(() => route?.query?.preview === 'true' || route?.query?.preview === '1')
const { data: coachProfile } = await useAsyncData<PublicProviderProfile | null>(
  `public-provider-profile:${props.tenant.slug}${isPreview.value ? ':preview' : ''}`,
  () => fetchPublicProviderProfile(props.tenant.slug, isPreview.value),
  { default: () => null }
)

const consultationPlans = computed(() => pricingData.value?.plans ?? [])

// YC2.2 — Dynamic template resolution based on provider.template_code.
// Fallback to "essentiel" when code is unknown or absent.
const resolvedTemplate = computed(() => useCoachPageTemplate(coachProfile.value?.templateCode))
</script>

<template>
  <component
    :is="resolvedTemplate"
    :tenant="tenant"
    :cta-to="ctaTo"
    :coach-profile="coachProfile ?? null"
    :public-programs="publicPrograms"
    :consultation-plans="consultationPlans"
    :is-authenticated="isAuthenticated"
    :current-path="currentPath"
  />
</template>
