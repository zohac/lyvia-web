<script setup lang="ts">
import CookieConsentBanner from './components/organisms/CookieConsentBanner.vue'
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </UApp>
</template>
