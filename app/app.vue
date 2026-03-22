<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'
import CookieConsentBanner from './components/organisms/CookieConsentBanner.vue'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'

await useGlobalSchemaOrg()
</script>

<template>
  <UApp :locale="fr">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </UApp>
</template>
