<template>
  <DiscoveryBookingWizard />
</template>

<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'
import { usePageTracking } from '~/features/analytics/usePageTracking'
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'

definePageMeta({
  layout: 'focus'
})

// Resolve tenant for white-label tracking (Host header resolution, no slug)
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

usePageTracking(computed(() => tenant.value?.providerId))
</script>
