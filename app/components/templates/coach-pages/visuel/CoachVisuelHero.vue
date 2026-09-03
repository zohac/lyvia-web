<script setup lang="ts">
/**
 * CoachVisuelHero — Hero immersif plein écran pour le template Visuel.
 *
 * Spécificités :
 *  - Image de fond pleine largeur (heroPhotoUrl ou fallback ambiance)
 *  - Double overlay sombre & teinte de marque pour un contraste maximal
 *  - Typo blanche, badge spécialité avec puce couleur marque
 *  - CTA avec réassurance et texte d'urgence
 */
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'

const props = defineProps<CoachHeroProps>()

// Specialty eyebrow
const specialtyLabel = computed<string>(() => {
  const first = (props.specialties ?? []).find(s => !!s?.trim())
  if (!first) return 'Accompagnement ménopause'
  return first.trim()
})

const heroBackgroundSrc = computed(() => {
  return props.heroPhotoUrl || '/images/templates/visuel/hero-default.webp'
})
</script>

<template>
  <section
    id="hero"
    class="relative flex min-h-[620px] items-end overflow-hidden lg:min-h-[min(92vh,820px)]"
  >
    <!-- Background image -->
    <img
      :src="heroBackgroundSrc"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover object-center"
      loading="eager"
      fetchpriority="high"
      width="1920"
      height="1080"
      @error="($event.target as HTMLImageElement).src = '/images/templates/visuel/hero-default.webp'"
    >

    <!-- Overlay sombre vertical progressif -->
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-gradient-to-b from-[rgba(20,17,26,0.5)] via-[rgba(20,17,26,0.25)] to-[rgba(20,17,26,0.88)]"
    />

    <!-- Overlay subtil teinte marque (mix-blend-mode multiply) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,var(--color-brand-primary)_35%,transparent)] to-transparent mix-blend-multiply"
    />

    <!-- Contenu hero -->
    <div class="relative z-10 w-full px-6 pb-12 pt-28 sm:px-12 sm:pb-20 sm:pt-32 lg:px-16 lg:pb-24 lg:pt-36">
      <div class="mx-auto max-w-7xl">
        <div class="max-w-3xl">
          <!-- Specialty badge pill -->
          <span class="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            <span class="size-2 rounded-full bg-[color:var(--color-brand-accent)] shadow-[0_0_8px_var(--color-brand-accent)]" />
            {{ specialtyLabel }}
          </span>

          <!-- H1 Headline grand format équilibré -->
          <h1 class="mt-5 font-serif text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
            {{ heroHeadline || `Retrouvez votre équilibre et votre vitalité avec ${displayName}` }}
          </h1>

          <!-- Tagline / bio courte -->
          <p class="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg lg:text-xl">
            {{ heroDescription || 'Un accompagnement bienveillant et sur-mesure pour traverser la ménopause en toute sérénité.' }}
          </p>

          <!-- Row CTA + Reassurance -->
          <div class="mt-8 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-6">
            <UButton
              :to="ctaTo"
              color="secondary"
              variant="solid"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="shadow-xl shadow-black/30"
              data-hero-cta
            >
              Réserver mon appel gratuit
            </UButton>

            <!-- Reassurance dark -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/80">
              <span class="inline-flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5 text-[color:var(--color-brand-accent)]"
                />
                Gratuit
              </span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5 text-[color:var(--color-brand-accent)]"
                />
                Sans engagement
              </span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5 text-[color:var(--color-brand-accent)]"
                />
                {{ discoveryDurationMinutes }} min
              </span>
            </div>
          </div>

          <!-- Urgency bullet -->
          <p
            v-if="urgencyText"
            class="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white/95"
          >
            <span class="size-2 rounded-full bg-[color:var(--color-brand-accent)] animate-pulse" />
            {{ urgencyText }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
