<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import CoachLegalModal from '../molecules/CoachLegalModal.vue'
import CookieSettingsModal from '../molecules/CookieSettingsModal.vue'

const route = useRoute()
const routeSlug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug.trim() : ''))

const tenantHome = useNuxtData<PublicTenantResponse | null>('public-tenant-home')
const tenantDiscovery = useNuxtData<PublicTenantResponse | null>('public-tenant-discovery')
const tenantRoute = computed(() => {
  if (!routeSlug.value) return null
  return useNuxtData<PublicTenantResponse | null>(`public-tenant:${routeSlug.value}`).data.value
})

const tenant = computed<PublicTenantResponse | null>(() => {
  return tenantHome.data.value || tenantDiscovery.data.value || tenantRoute.value || null
})

// Show coach legal modal link when a coach tenant is present in platform context
const isPlatformCoach = computed(() => {
  if (!tenant.value) return false
  return tenant.value.brand.mode === 'platform' || !!routeSlug.value
})

const links = [
  { label: 'Mentions légales', to: '/legal/mentions-legales' },
  { label: 'CGU', to: '/legal/cgu' },
  { label: 'Confidentialité', to: '/legal/confidentialite' }
] as const

const coachLegalModalOpen = ref(false)
const cookieModalOpen = ref(false)
</script>

<template>
  <nav
    aria-label="Liens légaux"
    class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
  >
    <button
      v-if="isPlatformCoach"
      type="button"
      class="inline-flex min-h-[44px] items-center px-1 py-2 text-xs font-medium text-[color:var(--color-brand-primary)] transition-colors hover:underline"
      @click="coachLegalModalOpen = true"
    >
      Mentions légales de la praticienne
    </button>

    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="inline-flex min-h-[44px] items-center px-1 py-2 text-xs text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-secondary)] hover:underline"
    >
      {{ link.label }}
    </NuxtLink>

    <button
      type="button"
      class="inline-flex min-h-[44px] items-center px-1 py-2 text-xs text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-secondary)] hover:underline"
      @click="cookieModalOpen = true"
    >
      Cookies
    </button>

    <CoachLegalModal
      v-if="tenant"
      v-model:open="coachLegalModalOpen"
      :tenant="tenant"
    />
    <CookieSettingsModal v-model:open="cookieModalOpen" />
  </nav>
</template>
