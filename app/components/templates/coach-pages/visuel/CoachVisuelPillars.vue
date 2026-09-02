<script setup lang="ts">
/**
 * CoachVisuelPillars — Section Piliers pour le template Visuel.
 *
 * 4 piliers en cartes élégantes avec tuiles icônes marque et léger effet glow,
 * complétés par un encart sombre d'écoute et de soutien émotionnel.
 */
import type { PillarsJson } from '~/features/seo/api/public-provider-profile.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<{
  pillars: PillarsJson | null
  eyebrow?: string
  title?: string
}>()

const { reveal } = useScrollReveal()

const DEFAULT_PILLAR_ICONS = [
  'i-lucide-apple',
  'i-lucide-wind',
  'i-lucide-moon-star',
  'i-lucide-heart-pulse'
]

function normalizeIcon(iconName?: string | null, fallback = 'i-lucide-circle'): string {
  if (!iconName || !iconName.trim()) return fallback
  const trimmed = iconName.trim()
  if (trimmed.startsWith('i-')) return trimmed
  return `i-lucide-${trimmed}`
}

const FALLBACK_PILLARS = [
  { title: 'Alimentation & Vitalité', description: 'Une nutrition adaptée pour stabiliser l\'énergie et réguler les fluctuations hormonales.', icon: undefined },
  { title: 'Gestion du Stress & Émotions', description: 'Des outils concrets pour apaiser le système nerveux et retrouver la sérénité.', icon: undefined },
  { title: 'Sommeil Réparateur', description: 'Des rituels et conseils ciblés pour des nuits paisibles et régénérantes.', icon: undefined },
  { title: 'Mouvement & Souplesse', description: 'Une activité douce et personnalisée pour préserver les articulations et la masse musculaire.', icon: undefined }
]

const pillarItems = computed(() => {
  const items = props.pillars?.items?.length ? props.pillars.items : FALLBACK_PILLARS
  return items.map((p, i) => ({
    ...p,
    icon: p.icon ? normalizeIcon(p.icon) : (DEFAULT_PILLAR_ICONS[i] || 'i-lucide-circle')
  }))
})

const emotionalSupport = computed(() => props.pillars?.emotionalSupport ?? null)
</script>

<template>
  <section
    id="approche"
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-20 sm:px-12 sm:py-28 lg:px-16"
  >
    <div class="mx-auto max-w-6xl">
      <!-- En-tête centré -->
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-primary)]">
          {{ eyebrow || 'Mon approche' }}
        </span>
        <h2 class="mt-3 font-serif text-3xl font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-4xl">
          {{ title || 'Quatre piliers adaptés à votre quotidien' }}
        </h2>
      </div>

      <!-- Grille 2x2 des piliers -->
      <div class="mt-14 grid gap-6 md:grid-cols-2">
        <article
          v-for="(pillar, index) in pillarItems"
          :key="pillar.title"
          v-bind="reveal({ delay: index * 80 })"
          class="pillar-card scroll-reveal group relative flex items-start gap-5 overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <!-- Tuile icône marque -->
          <div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] text-[color:var(--color-brand-primary)] transition-colors group-hover:bg-[color:var(--color-brand-primary)] group-hover:text-white">
            <UIcon
              :name="pillar.icon"
              class="size-6"
            />
          </div>

          <div>
            <h3 class="font-serif text-xl font-semibold text-[color:var(--color-text-primary)]">
              {{ pillar.title }}
            </h3>
            <p class="mt-2.5 text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
              {{ pillar.description }}
            </p>
          </div>
        </article>
      </div>

      <!-- Encart soutien émotionnel sombre distinctif -->
      <div
        v-if="emotionalSupport"
        v-bind="reveal({ delay: 400 })"
        class="scroll-reveal mt-8 flex flex-col items-center gap-6 rounded-3xl bg-neutral-950 p-8 text-white sm:flex-row sm:p-10"
      >
        <div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-brand-primary)_35%,transparent)] text-white">
          <UIcon
            :name="emotionalSupport.icon || 'i-lucide-hand-heart'"
            class="size-7"
          />
        </div>
        <div>
          <h3 class="font-serif text-xl font-semibold text-white">
            {{ emotionalSupport.title }}
          </h3>
          <p class="mt-2 text-base leading-relaxed text-white/80">
            {{ emotionalSupport.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
