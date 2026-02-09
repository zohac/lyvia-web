<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Tarifs consultation'
})

await navigateTo('/provider/scheduling', { redirectCode: 301 })
</script>

<template>
  <div />
</template>
