<script setup lang="ts">
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'
import { usePublicHeaderState } from '~/features/public/state/public-header.state'

const props = defineProps<CoachHeroProps>()

const headerState = usePublicHeaderState()
const heroTopOffsetClass = computed(() => {
  if (headerState.value.layoutStyle !== 'dock') return undefined
  return headerState.value.variant === 'white-label' ? 'pt-32' : 'pt-28'
})

// H1: heroHeadline (configurable) → fallback generic (never seoTitle)
const heroH1 = computed(() => {
  if (props.heroHeadline) return props.heroHeadline
  const cityPart = props.city ? ` à ${props.city}` : ''
  return `Spécialiste accompagnement ménopause${cityPart}`
})

// Subtitle line 1: first credential + city (graceful degradation)
const heroSubtitleLine1 = computed(() => {
  const parts: string[] = []
  const firstCredential = props.credentials[0]
  if (firstCredential) {
    parts.push(firstCredential.title)
  }
  if (props.city) {
    parts.push(props.city)
  }
  return parts.length > 0 ? parts.join(' · ') : null
})

// Initials for photo placeholder
const initials = computed(() => {
  const name = props.displayName || ''
  const words = name.split(/\s+/)
  return words.slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
})
</script>

<template>
  <section
    id="essence"
    class="relative flex min-h-[100svh] items-center overflow-hidden bg-[var(--color-neutral-50)]"
    :class="heroTopOffsetClass"
  >
    <!-- Gradient atmosphere -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0"
    >
      <div
        class="absolute -right-[20%] -top-[10%] h-[80vh] w-[80vh] rounded-full"
        style="background: radial-gradient(circle, rgba(212,149,106,0.15), transparent 60%); filter: blur(100px);"
      />
      <div
        class="absolute -bottom-[20%] -left-[15%] h-[70vh] w-[70vh] rounded-full"
        style="background: radial-gradient(circle, rgba(91,75,110,0.1), transparent 60%); filter: blur(80px);"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full px-6 py-20 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-7xl">
        <div class="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <!-- Left — Typography -->
          <div class="flex flex-col justify-center lg:col-span-7">
            <!-- Coach name eyebrow -->
            <p class="hero-label mb-6 text-sm font-medium uppercase tracking-[0.3em] text-[var(--color-brand-accent)]">
              {{ displayName }} - EI
            </p>

            <!-- H1 — dynamic SEO (AC-2) -->
            <h1 class="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-[var(--color-crepuscule-950)]">
              {{ heroH1 }}
            </h1>

            <!-- Subtitle line 1: credentials + city -->
            <p
              v-if="heroSubtitleLine1"
              class="mt-4 text-lg font-medium text-[var(--color-brand-primary)]"
            >
              {{ heroSubtitleLine1 }}
            </p>

            <!-- Subtitle line 2: descriptive text -->
            <p class="mt-2 max-w-lg text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
              <!-- TODO: Feature V — dynamiser -->
              <strong>Vous faites attention… mais le poids continue de monter ?</strong><br>
              À partir de la périménopause, la prise de poids ne se résume plus à une simple question de calories.<br>
              Accompagnement global et personnalisé pour vous aider à vous sentir mieux dans votre corps… et enfin sortir de la spirale des régimes inefficaces.
            </p>

            <!-- CTA + reassurance (AC-2) -->
            <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <UButton
                :to="ctaTo"
                size="xl"
                data-hero-cta
                class="hero-cta group rounded-full border-2 border-[var(--color-brand-accent)] bg-[var(--color-brand-accent)] px-8 py-4 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-sunset-600)] hover:bg-[var(--color-sunset-600)] hover:text-white hover:shadow-lg active:scale-[0.98]"
              >
                <span class="flex items-center gap-3">
                  Réserver mon appel gratuit
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </UButton>

              <!-- Triple reassurance -->
              <span class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <UIcon
                  name="i-lucide-clock"
                  class="size-4"
                />
                {{ discoveryDurationMinutes }} min · Gratuit · Sans engagement
              </span>
            </div>

            <!-- Urgency text (v-if, graceful degradation AD-Y2) -->
            <p
              v-if="urgencyText"
              class="mt-4 text-sm font-medium text-[var(--color-brand-accent)]"
            >
              {{ urgencyText }}
            </p>
          </div>

          <!-- Right — Photo or placeholder -->
          <div class="relative hidden lg:col-span-5 lg:flex lg:items-center lg:justify-end">
            <div class="relative">
              <!-- Ghost shape offset -->
              <div
                class="hero-photo-shape absolute h-[50vh] w-80 translate-x-4 translate-y-4 bg-gradient-to-br from-[var(--color-brand-primary)]/20 to-[var(--color-brand-accent)]/15"
                aria-hidden="true"
              />
              <!-- Photo or initials placeholder -->
              <div class="hero-photo-shape relative h-[50vh] w-80 overflow-hidden shadow-2xl shadow-[var(--color-brand-primary)]/15">
                <NuxtImg
                  v-if="heroPhotoUrl || profilePhotoUrl"
                  :src="(heroPhotoUrl || profilePhotoUrl)!"
                  :alt="`${displayName}, spécialiste accompagnement ménopause`"
                  class="h-full w-full object-cover object-top"
                  loading="eager"
                  fetchpriority="high"
                  :width="800"
                  :height="1000"
                />
                <!-- Fallback: gradient initials -->
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-500)]"
                >
                  <span class="font-serif text-7xl font-bold text-white/60">{{ initials }}</span>
                </div>
                <!-- Warm overlay -->
                <div
                  class="pointer-events-none absolute inset-0"
                  style="background: linear-gradient(160deg, rgba(91,75,110,0.08) 0%, transparent 40%, rgba(212,149,106,0.06) 100%);"
                />
              </div>
              <!-- Decorative accents -->
              <div
                class="accent-ring absolute -bottom-8 -left-12 h-32 w-32 rounded-full border border-[var(--color-brand-primary)]/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <div class="scroll-indicator h-12 w-px bg-gradient-to-b from-transparent via-[var(--color-brand-primary)]/40 to-transparent" />
    </div>
  </section>
</template>

<style scoped>
/* Shape — scoped, not an animation */
.hero-photo-shape {
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
}

/* Classes consuming centralized @keyframes from main.css (P-Y3) */
.hero-label { animation: label-slide 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.accent-ring { animation: accent-pulse 4s ease-in-out infinite; }
.scroll-indicator { animation: scroll-fade 2s ease-in-out infinite; }

/* CTA glow — scoped effect, not a keyframe */
.hero-cta { position: relative; }
.hero-cta::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(212,149,106,0.4), rgba(196,122,74,0.3));
  filter: blur(12px);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}
.hero-cta:hover::after { opacity: 1; }
</style>
