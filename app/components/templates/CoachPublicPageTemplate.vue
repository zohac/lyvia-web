<script setup lang="ts">
/**
 * CoachPublicPageTemplate — Data loader de la page coach publique.
 *
 * Fetch les données (programmes, pricing, profil enrichi) et délègue le rendu
 * au template résolu dynamiquement via `useCoachPageTemplate(templateCode)`
 * (YC2.2). Le `templateCode` provient du profil enrichi, fallback sur
 * "essentiel" si absent ou inconnu.
 *
 * YC2.1 : les données sont passées en props EXPLICITES au template.
 * YC2.2 : le template concret (Signature, Essentiel, ...) est résolu au
 * runtime via `<component :is="...">` avec code-splitting natif.
 */
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ListConsultationPricePlansResponse } from '~/features/consultation/api/consultation.contract'
import { listPublicPrograms } from '~/features/programs/services/public-programs.service'
import { listConsultationPricePlans } from '~/features/consultation/services/client-consultation.service'
import { useCoachPageTemplate } from '~/composables/useCoachPageTemplate'

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
