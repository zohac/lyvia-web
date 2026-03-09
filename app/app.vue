<script setup lang="ts">
import CookieConsentBanner from './components/organisms/CookieConsentBanner.vue'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'

await useGlobalSchemaOrg()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </UApp>
</template>
