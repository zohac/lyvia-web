<template>
  <!-- Deprecated alias (V0): keep old link working without breaking bookmarks -->
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Finance'
})

await navigateTo('/provider/finance', { replace: true })
</script>
