<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'
import CookieConsentBanner from './components/organisms/CookieConsentBanner.vue'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'
import { usePublicHeaderInit } from '~/composables/usePublicHeaderInit'

// Initialize header state BEFORE layout renders (fixes SSR hydration mismatch on white-label)
await usePublicHeaderInit()
await useGlobalSchemaOrg()
</script>

<template>
  <UApp :locale="fr">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <CookieConsentBanner />
    </ClientOnly>
  </UApp>
</template>
