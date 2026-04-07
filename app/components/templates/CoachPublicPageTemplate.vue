<script setup lang="ts">
/**
 * CoachPublicPageTemplate — Data loader de la page coach publique.
 *
 * Fetch les données (programmes, pricing, profil enrichi) et délègue le rendu
 * au template résolu (actuellement CoachPageSignature — YC2.2 ajoutera la
 * résolution dynamique via templateCode).
 *
 * YC2.1 : les données sont passées en props EXPLICITES au template. Le template
 * ne lit plus useNuxtData en interne.
 */
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ListConsultationPricePlansResponse } from '~/features/consultation/api/consultation.contract'
import { listPublicPrograms } from '~/features/programs/services/public-programs.service'
import { listConsultationPricePlans } from '~/features/consultation/services/client-consultation.service'
import CoachPageSignature from '~/components/templates/coach-pages/CoachPageSignature.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()

const route = useRoute()
const { isAuthenticated: checkAuth } = useAuth()
const isAuthenticated = computed(() => checkAuth())
const currentPath = computed(() => route.fullPath)

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

// Enriched profile is populated by useCoachSchemaOrg in the parent page.
// We read it here once and forward it as an EXPLICIT prop to the template (YC2.1 F1).
const { data: coachProfile } = useNuxtData<PublicProviderProfile>(`public-provider-profile:${props.tenant.slug}`)

const consultationPlans = computed(() => pricingData.value?.plans ?? [])
</script>

<template>
  <CoachPageSignature
    :tenant="tenant"
    :cta-to="ctaTo"
    :coach-profile="coachProfile ?? null"
    :public-programs="publicPrograms"
    :consultation-plans="consultationPlans"
    :is-authenticated="isAuthenticated"
    :current-path="currentPath"
  />
</template>
