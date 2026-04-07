<script setup lang="ts">
/**
 * CoachEssentielHero — Hero professionnel pour le template Essentiel.
 *
 * Distinct de `CoachHeroProfile` (utilisé par Signature) :
 *   - Pas de blob organique avec initiales purple dramatique
 *   - Photo card `rounded-3xl` clean (pas de border-radius asymmetric)
 *   - Typo H1 mesurée (`text-4xl lg:text-5xl` vs clamp dramatique)
 *   - Format H1 humanisé : "Bonjour, je suis {firstName}." (intime vs formel)
 *   - Background blanc (pas de halos radiaux blur)
 *   - Décor : filet accent vertical à gauche (pas de ghost shape)
 *   - Trust row avec 3 chips icons (credential · ville · visio)
 *   - CTA secondaire "En savoir plus →" anchor vers #qui-suis-je
 *   - Pas de `min-h-[100svh]` — proportionné `py-20`
 *
 * Signature (via CoachHeroProfile) reste inchangé.
 */
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'

const props = defineProps<CoachHeroProps>()

// First name for humanised H1 ("Bonjour, je suis {firstName}.")
const firstName = computed(() => {
  const name = (props.displayName ?? '').trim()
  if (!name) return ''
  return name.split(/\s+/)[0] ?? name
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
    class="relative overflow-hidden bg-white px-6 py-20 sm:px-12 lg:py-24 lg:px-20"
  >
    <div class="mx-auto max-w-7xl">
      <div class="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <!-- Left — Content (col-span-7) -->
        <div class="relative lg:col-span-7">
          <!-- Vertical accent filet (decorative, subtle) -->
          <div
            class="absolute -left-6 top-2 hidden h-16 w-1 rounded-full bg-[var(--color-brand-accent)] lg:block"
            aria-hidden="true"
          />

          <!-- Eyebrow pill -->
          <div class="inline-flex items-center gap-2 rounded-full border border-[var(--color-crepuscule-100)] bg-[var(--color-neutral-50)] px-4 py-1.5">
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5 text-[var(--color-brand-accent)]"
            />
            <span class="text-xs font-medium uppercase tracking-wider text-[var(--color-crepuscule-700)]">
              Praticienne bien-être
            </span>
          </div>

          <!-- H1 — humanised (Bonjour, je suis X.) -->
          <h1 class="mt-6 font-serif text-4xl leading-tight tracking-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
            <span class="block text-[var(--color-crepuscule-700)]">Bonjour, je suis</span>
            <span class="block text-[var(--color-brand-primary)]">{{ firstName || displayName }}.</span>
          </h1>

          <!-- Subtitle — speciality + city -->
          <p class="mt-5 text-xl leading-snug text-[var(--color-crepuscule-700)] lg:text-2xl">
            {{ subtitle }}
          </p>

          <!-- Description paragraph -->
          <p class="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-crepuscule-700)]">
            Accompagnement personnalisé en périménopause et ménopause.
            Alimentation, stress, sommeil, mouvement. Une approche complète, à votre rythme.
          </p>

          <!-- Trust chips row -->
          <div class="mt-8 flex flex-wrap gap-2">
            <span
              v-if="firstCredential"
              class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-crepuscule-100)] bg-white px-3 py-1.5 text-xs text-[var(--color-crepuscule-700)]"
            >
              <UIcon
                name="i-lucide-graduation-cap"
                class="size-3.5 text-[var(--color-brand-accent)]"
              />
              {{ firstCredential }}
            </span>
            <span
              v-if="city"
              class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-crepuscule-100)] bg-white px-3 py-1.5 text-xs text-[var(--color-crepuscule-700)]"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-3.5 text-[var(--color-brand-accent)]"
              />
              {{ city }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-crepuscule-100)] bg-white px-3 py-1.5 text-xs text-[var(--color-crepuscule-700)]">
              <UIcon
                name="i-lucide-video"
                class="size-3.5 text-[var(--color-brand-accent)]"
              />
              100 % en visio
            </span>
          </div>

          <!-- CTA row — primary accent + secondary anchor link -->
          <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <UButton
              :to="ctaTo"
              size="xl"
              data-hero-cta
              class="group rounded-lg bg-[var(--color-brand-accent)] px-7 py-4 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-sunset-600)] hover:shadow-md"
            >
              <span class="flex items-center gap-2.5">
                Réserver mon appel gratuit
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </UButton>

            <a
              href="#qui-suis-je"
              class="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-primary)] underline-offset-4 hover:underline"
            >
              En savoir plus
              <UIcon
                name="i-lucide-arrow-down"
                class="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <!-- Reassurance row -->
          <p class="mt-5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <UIcon
              name="i-lucide-clock"
              class="size-3.5"
            />
            {{ discoveryDurationMinutes }} min · Gratuit · Sans engagement
          </p>

          <!-- Urgency (optional) -->
          <p
            v-if="urgencyText"
            class="mt-3 text-xs font-medium text-[var(--color-brand-accent)]"
          >
            {{ urgencyText }}
          </p>
        </div>

        <!-- Right — Photo card (col-span-5) — clean rounded-3xl, NO blob -->
        <div class="relative lg:col-span-5">
          <div class="relative mx-auto max-w-md">
            <!-- Photo card -->
            <div class="aspect-[4/5] overflow-hidden rounded-3xl border border-[var(--color-crepuscule-100)] bg-[var(--color-neutral-50)] shadow-sm">
              <NuxtImg
                v-if="heroPhotoUrl || profilePhotoUrl"
                :src="(heroPhotoUrl || profilePhotoUrl)!"
                :alt="profilePhotoAlt ?? `${displayName}, spécialiste accompagnement ménopause`"
                class="h-full w-full object-cover object-top"
                loading="eager"
                fetchpriority="high"
                width="480"
                height="600"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-neutral-50)] to-[color:var(--color-surface-card)]"
              >
                <span class="font-serif text-6xl text-[var(--color-brand-primary)]/30">
                  {{ initials }}
                </span>
              </div>
            </div>

            <!-- Decorative corner dot (minimal, no ring animation) -->
            <div
              class="absolute -right-2 -top-2 size-4 rounded-full border-2 border-[var(--color-brand-accent)] bg-white"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
