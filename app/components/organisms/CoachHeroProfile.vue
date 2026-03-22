<script setup lang="ts">
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'
import { usePublicHeaderState } from '~/features/public/state/public-header.state'

const props = defineProps<CoachHeroProps>()

const headerState = usePublicHeaderState()
const heroTopOffsetClass = computed(() => {
  if (headerState.value.layoutStyle !== 'dock') return undefined
  return headerState.value.variant === 'white-label' ? 'pt-32' : 'pt-28'
})

// H1: SEO template title → fallback with displayName + city
const heroH1 = computed(() => {
  if (props.seoTitle) return props.seoTitle
  const cityPart = props.city ? ` à ${props.city}` : ''
  return `${props.displayName} — Spécialiste accompagnement ménopause${cityPart}`
})

// Subtitle: first credential + city (graceful degradation)
const heroSubtitle = computed(() => {
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
    class="relative flex min-h-[100svh] items-center overflow-hidden bg-[#f5f0eb]"
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
            <p class="hero-label mb-6 text-sm font-medium uppercase tracking-[0.3em] text-[#d4956a]">
              {{ displayName }}
            </p>

            <!-- H1 — dynamic SEO (AC-2) -->
            <h1 class="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-[#2d2438]">
              {{ heroH1 }}
            </h1>

            <!-- Subtitle: credentials + city (graceful degradation) -->
            <p
              v-if="heroSubtitle"
              class="mt-4 text-lg font-medium text-[#5b4b6e]"
            >
              {{ heroSubtitle }}
            </p>

            <!-- Tagline — specifique (M9: format + differenciateur + promesse) -->
            <p class="mt-8 max-w-lg text-lg leading-relaxed text-[#4a4255]">
              <template v-if="credentials.length">
                Accompagnement individuel en visio pour reprendre
                le contrôle de vos symptômes et retrouver votre énergie.
              </template>
              <template v-else>
                Un accompagnement personnalisé pour traverser
                la ménopause avec plus de sérénité.
              </template>
            </p>

            <!-- CTA + reassurance (AC-2) -->
            <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <UButton
                :to="ctaTo"
                size="xl"
                data-hero-cta
                class="hero-cta group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-8 py-4 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c47a4a] hover:bg-[#c47a4a] hover:text-white hover:shadow-lg active:scale-[0.98]"
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
              <span class="flex items-center gap-2 text-sm text-[#857d8c]">
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
              class="mt-4 text-sm font-medium text-[#d4956a]"
            >
              {{ urgencyText }}
            </p>
          </div>

          <!-- Right — Photo or placeholder -->
          <div class="relative hidden lg:col-span-5 lg:flex lg:items-center lg:justify-end">
            <div class="relative">
              <!-- Ghost shape offset -->
              <div
                class="hero-photo-shape absolute h-[50vh] w-80 translate-x-4 translate-y-4 bg-gradient-to-br from-[#5b4b6e]/20 to-[#d4956a]/15"
                aria-hidden="true"
              />
              <!-- Photo or initials placeholder -->
              <div class="hero-photo-shape relative h-[50vh] w-80 overflow-hidden shadow-2xl shadow-[#5b4b6e]/15">
                <NuxtImg
                  v-if="profilePhotoUrl"
                  :src="profilePhotoUrl"
                  :alt="`${displayName}, spécialiste accompagnement ménopause`"
                  class="h-full w-full object-cover object-top"
                  loading="eager"
                  fetchpriority="high"
                  :width="320"
                  :height="500"
                />
                <!-- Fallback: gradient initials -->
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e]"
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
                class="accent-ring absolute -bottom-8 -left-12 h-32 w-32 rounded-full border border-[#5b4b6e]/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <div class="scroll-indicator h-12 w-px bg-gradient-to-b from-transparent via-[#5b4b6e]/40 to-transparent" />
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
