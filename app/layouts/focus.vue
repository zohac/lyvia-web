<script setup lang="ts">
import '~/assets/css/main.css'

import LegalFooterLinks from '../components/atoms/LegalFooterLinks.vue'
import { getDomainContext } from '#shared/utils/domain-context'
import { useBrandColorInjection } from '~/composables/useBrandColorInjection'

useCommonLayoutHead()
useBrandColorInjection()

const currentYear = new Date().getFullYear()
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()
const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
const { isWhiteLabel } = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)

// On white-label, resolve coach name from tenant data (loaded by the page)
const { data: tenantData } = useNuxtData<{ brand?: { displayName?: string } }>('public-tenant-discovery')
const copyrightName = computed(() => {
  if (!isWhiteLabel) return 'Keova'
  return tenantData.value?.brand?.displayName?.trim() || 'Keova'
})
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <div class="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14">
      <main class="flex flex-1 items-start justify-center sm:items-center">
        <slot />
      </main>

      <footer class="flex flex-col items-center gap-4 pt-10 text-center text-xs text-[color:var(--color-brand-muted)]">
        <LegalFooterLinks />
        <p>© {{ currentYear }} {{ copyrightName }}</p>
      </footer>
    </div>
    <ClientOnly>
      <LazyOrganismsCookieConsentBanner />
    </ClientOnly>
  </div>
</template>
