<script setup lang="ts">
/**
 * CoachVisuelMidCta — Bandeau photo immersif de transition pour le template Visuel.
 *
 * Spécificités :
 *  - Photographie d'ambiance en bandeau (secondaryPhotoUrl ou fallback)
 *  - Overlay dégradé sombre
 *  - Accroche empathique et relance d'appel découverte
 */
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<{
  ctaTo: string
  discoveryDurationMinutes?: number
  bandPhotoUrl?: string | null
}>()

const { reveal } = useScrollReveal()

const bgSrc = computed(() => {
  return props.bandPhotoUrl || '/images/templates/visuel/band-default.webp'
})
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal relative flex min-h-[420px] items-center overflow-hidden px-6 py-20 sm:px-12 lg:min-h-[480px] lg:px-16"
  >
    <!-- Photo de fond -->
    <img
      :src="bgSrc"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover object-center"
      loading="lazy"
    >

    <!-- Overlay sombre -->
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-gradient-to-r from-[rgba(20,17,26,0.85)] via-[rgba(20,17,26,0.6)] to-[rgba(20,17,26,0.3)]"
    />

    <!-- Contenu CTA -->
    <div class="relative z-10 mx-auto w-full max-w-6xl">
      <div class="max-w-xl">
        <h2 class="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Et si vous repreniez la main&nbsp;?
        </h2>

        <p class="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
          Le premier appel est gratuit, sans engagement. {{ discoveryDurationMinutes || 15 }} minutes pour faire le point ensemble.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-6">
          <UButton
            :to="ctaTo"
            color="secondary"
            variant="solid"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            class="shadow-xl shadow-black/30"
          >
            Réserver mon appel gratuit
          </UButton>

          <div class="flex items-center gap-2 text-xs font-medium text-white/80">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-[color:var(--color-brand-accent)]"
            />
            Sans engagement · 100 % en visio
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
