<script setup lang="ts">
import CookieConsentBanner from './components/organisms/CookieConsentBanner.vue'
import { useGlobalSchemaOrg } from '~/features/seo/useGlobalSchemaOrg'

useGlobalSchemaOrg()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </UApp>
</template>
