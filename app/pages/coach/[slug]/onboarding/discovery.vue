<template>
  <OnboardingPageTemplate
    title="Votre appel découverte gratuit"
    subtitle="15 minutes pour faire le point, sans engagement."
  >
    <DiscoveryBookingWizard :slug="slug" />
  </OnboardingPageTemplate>
</template>

<script setup lang="ts">
import DiscoveryBookingWizard from '~/components/organisms/DiscoveryBookingWizard.vue'
import OnboardingPageTemplate from '~/components/templates/OnboardingPageTemplate.vue'

definePageMeta({
  layout: 'public',
  publicLayout: { hideHeader: true, hideFooter: true, fullBleed: true }
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? '').trim())
</script>
