<template>
  <DiscoveryBookingWizard :slug="slug" />
</template>

<script setup lang="ts">
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'

definePageMeta({
  layout: 'focus'
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? '').trim())
</script>
