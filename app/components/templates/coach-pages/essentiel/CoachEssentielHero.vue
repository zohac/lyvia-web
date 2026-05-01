<script setup lang="ts">
/**
 * CoachEssentielHero — Hero professionnel pour le template Essentiel.
 *
 * Direction : clean, sobre, grille 2-col headline + portrait.
 * Inspiration : keova.app (B2B) adaptée pour profil coach individuel.
 *   - Pas de blob organique / pas de halos / pas de corner dot décoratif
 *   - Photo card rounded-2xl (DS)
 *   - Typo serif H1 mesurée
 *   - Background surface-card (fully light)
 *   - Entrance stagger simple (bloc, pas per-word)
 *
 * Signature (via CoachHeroProfile) reste inchangé.
 */
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'
import CoachBrandLogo from '~/components/atoms/CoachBrandLogo.vue'

const props = defineProps<CoachHeroProps>()

// First name for humanised H1 ("Bonjour, je suis {firstName}.")
const firstName = computed(() => {
  const name = (props.displayName ?? '').trim()
  if (!name) return ''
  return name.split(/\s+/)[0] ?? name
})

// Eyebrow pill — derived from provider specialties (no hardcoded label).
// Fallback: hide the pill entirely rather than show a generic placeholder.
const eyebrowLabel = computed<string | null>(() => {
  const first = (props.specialties ?? []).find(s => !!s?.trim())
  if (!first) return null
  const trimmed = first.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
})

// H2-style subtitle under the humanised H1
const subtitle = computed(() => {
  if (props.heroHeadline) return props.heroHeadline
  const cityPart = props.city ? ` à ${props.city}` : ''
  return `Spécialiste accompagnement ménopause${cityPart}`
})

// Credential chip (first credential title or null)
const firstCredential = computed(() => props.credentials[0]?.title ?? null)

// Initials for photo fallback (sober, not dramatic)
const initials = computed(() => {
  const name = props.displayName || ''
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
})
</script>

<template>
  <section
    id="essence"
    class="relative bg-[color:var(--color-surface-card)] px-6 py-20 sm:px-12 lg:py-28 lg:px-20"
  >
    <div class="mx-auto max-w-7xl">
      <div class="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
        <!-- Left — Content (col-span-7) -->
        <div
          class="hero-anim lg:col-span-7"
          style="--hero-anim-delay: 0ms"
        >
          <!-- Brand logo (Story 0-27 Codex CR1-F1) — shared atom rendered above
            the eyebrow when the provider has uploaded a brand_logo. -->
          <CoachBrandLogo
            :logo-url="logoUrl"
            :display-name="displayName"
            class="mb-6"
          />

          <!-- Eyebrow pill — dynamic from specialties[0] (hidden if none) -->
          <div
            v-if="eyebrowLabel"
            class="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-4 py-1.5"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5 text-[color:var(--color-brand-accent)]"
            />
            <span class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-brand-secondary)]">
              {{ eyebrowLabel }}
            </span>
          </div>

          <!-- H1 — humanised (Bonjour, je suis X.) -->
          <h1 class="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-[color:var(--color-text-primary)] lg:text-6xl">
            <span class="block text-[color:var(--color-brand-secondary)]">Bonjour, je suis</span>
            <span class="block text-[color:var(--color-brand-primary)]">{{ firstName || displayName }}.</span>
          </h1>

          <!-- Subtitle — speciality + city -->
          <p class="mt-6 max-w-xl text-xl leading-snug text-[color:var(--color-brand-secondary)] lg:text-2xl">
            {{ subtitle }}
          </p>

          <!-- Description paragraph -->
          <p class="mt-5 max-w-xl text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
            Accompagnement personnalisé en périménopause et ménopause.
            Alimentation, stress, sommeil, mouvement. Une approche complète, à votre rythme.
          </p>

          <!-- CTA row -->
          <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <UButton
              :to="ctaTo"
              color="primary"
              variant="solid"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              data-hero-cta
            >
              Réserver mon appel gratuit
            </UButton>

            <a
              href="#qui-suis-je"
              class="group inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-brand-primary)] underline-offset-4 hover:underline"
            >
              En savoir plus
              <UIcon
                name="i-lucide-arrow-down"
                class="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <!-- Reassurance — directly under CTA (objection levée au bon moment) -->
          <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Gratuit
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Sans engagement
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              {{ discoveryDurationMinutes }} min
            </span>
          </div>

          <!-- Trust chips row — DS-tokenized pills -->
          <div class="mt-8 flex flex-wrap gap-2">
            <span
              v-if="firstCredential"
              class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
            >
              <UIcon
                name="i-lucide-graduation-cap"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ firstCredential }}
            </span>
            <span
              v-if="city"
              class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ city }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]">
              <UIcon
                name="i-lucide-video"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              100 % en visio
            </span>
          </div>

          <!-- Reassurance row removed — info now directly under CTA for better conversion -->

          <!-- Urgency (optional) -->
          <p
            v-if="urgencyText"
            class="mt-3 text-xs font-medium text-[color:var(--color-brand-accent)]"
          >
            {{ urgencyText }}
          </p>
        </div>

        <!-- Right — Photo card (col-span-5) — clean, no decorative corner dot -->
        <div
          class="hero-anim relative lg:col-span-5"
          style="--hero-anim-delay: 120ms"
        >
          <div class="relative mx-auto max-w-md">
            <div class="hero-photo-card group aspect-[4/5] overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] shadow-sm">
              <NuxtImg
                v-if="heroPhotoUrl || profilePhotoUrl"
                :src="(heroPhotoUrl || profilePhotoUrl)!"
                :alt="profilePhotoAlt ?? `${displayName}, spécialiste accompagnement ménopause`"
                class="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="eager"
                fetchpriority="high"
                sizes="(max-width: 768px) 100vw, 480px"
                width="480"
                height="600"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--color-surface-page)] to-[color:var(--color-surface-card)]"
              >
                <span class="font-serif text-6xl text-[color:var(--color-brand-primary)]/30">
                  {{ initials }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * hero-anim — simple block stagger (2 elements only: content left, photo right).
 * SSR-safe: elements visible by default, @keyframes runs once on mount.
 */
.hero-anim {
  animation: hero-fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--hero-anim-delay, 0ms);
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-photo-card {
  transition: box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-photo-card:hover {
  box-shadow: 0 18px 40px -20px rgba(91, 75, 110, 0.22);
}

@media (prefers-reduced-motion: reduce) {
  .hero-anim {
    animation: none;
  }
  .hero-photo-card,
  .hero-photo-card :deep(img) {
    transition: none !important;
    transform: none !important;
  }
}
</style>
