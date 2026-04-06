<script setup lang="ts">
/**
 * CoachPageSignature — Template "Signature" pour pages coach.
 *
 * Ce composant est le template exclusif de Sophie (premier coach).
 * Il encapsule CoachPublicPageTemplate en passant les props.
 * Le template gère la visibilité des sections via sectionsConfig (P-Y3).
 *
 * Usage: Résolu dynamiquement via useCoachPageTemplate(templateCode) (YC2.2).
 */
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import CoachPublicPageTemplate from '~/components/templates/CoachPublicPageTemplate.vue'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()
</script>

<template>
  <CoachPublicPageTemplate
    :tenant="tenant"
    :cta-to="ctaTo"
  />
</template>
