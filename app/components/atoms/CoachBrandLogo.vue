<script setup lang="ts">
/**
 * CoachBrandLogo (Story 0-27 Codex CR1-F1) — atom shared between
 * CoachHeroProfile (Signature), CoachEssentielHero (Essentiel), and
 * CoachPageHub (plateforme hub WL).
 *
 * Renders the provider brand logo above-the-fold with:
 *   - max-height 60px (max-h-15 — AC-6 visual constraint)
 *   - object-contain to preserve aspect ratio
 *   - eager + fetchpriority="high" — logo is part of the LCP block
 *   - alt text = "Logo {displayName}"
 *
 * Renders nothing when `logoUrl` is null/undefined (graceful fallback).
 */
defineProps<{
  logoUrl?: string | null
  displayName: string
}>()
</script>

<template>
  <NuxtImg
    v-if="logoUrl"
    :src="logoUrl"
    :alt="`Logo ${displayName}`"
    class="h-auto w-auto max-h-15 max-w-[200px] object-contain"
    data-testid="coach-brand-logo"
    :width="240"
    :height="80"
    loading="eager"
    fetchpriority="high"
  />
</template>
