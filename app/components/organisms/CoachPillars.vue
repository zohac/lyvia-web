<script setup lang="ts">
/**
 * CoachPillars — Section "Les N piliers de l'accompagnement".
 *
 * Organism pur (P-Y2) : reçoit pillarsJson en prop, rend UNIQUEMENT
 * à partir des données. Aucun fallback de contenu (P-Y3 : la visibilité
 * est gérée par le template parent qui ne monte ce composant que si
 * pillarsJson.items est non vide).
 */
import type { CoachPillarsProps } from '~/features/coach/types/coach-page.types'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<CoachPillarsProps>()

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
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-7xl">
      <slot name="header">
        <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
          L'accompagnement
        </span>

        <!-- H2 with SEO keyword (P-Y5) -->
        <h2 class="mt-6 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
          Les {{ pillarItems.length }} piliers de
          <span class="block text-[var(--color-brand-primary)]">l'accompagnement</span>
        </h2>

        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
          Une approche globale, personnalisée et respectueuse.
        </p>
      </slot>

      <div class="mt-16 grid gap-8 md:grid-cols-2">
        <article
          v-for="(pillar, index) in pillarItems"
          :key="pillar.title"
          v-bind="reveal({ delay: index * 120 })"
          class="pillar-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-8 transition-all duration-300"
        >
          <!-- Glow blob top-right (appears on hover, like B2B feature-card) -->
          <div
            class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex items-start gap-5">
            <!-- Icon with color change on hover (B2B pattern) -->
            <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
              <UIcon
                :name="pillar.icon"
                class="size-6 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
              />
            </div>

            <div>
              <span class="font-serif text-sm text-[var(--color-brand-accent)]/60">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <h3 class="mt-1 font-serif text-xl text-[var(--color-crepuscule-950)]">
                {{ pillar.title }}
              </h3>
              <p class="mt-3 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
                {{ pillar.description }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <!-- Emotional support callout (5th pillar — distinct treatment) -->
      <div
        v-if="emotionalSupport"
        v-bind="reveal({ delay: 500 })"
        class="pillar-card scroll-reveal group relative mt-8 overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-8 transition-all duration-300"
      >
        <div
          class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
          aria-hidden="true"
        />
        <div class="relative flex items-start gap-5">
          <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
            <UIcon
              :name="emotionalSupport.icon || 'i-lucide-hand-heart'"
              class="size-6 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
            />
          </div>
          <div>
            <span class="font-serif text-sm text-[var(--color-brand-accent)]/60">
              {{ String(pillarItems.length + 1).padStart(2, '0') }}
            </span>
            <h3 class="mt-1 font-serif text-xl text-[var(--color-crepuscule-950)]">
              {{ emotionalSupport.title }}
            </h3>
            <p class="mt-3 max-w-3xl text-base leading-relaxed text-[var(--color-crepuscule-700)]">
              {{ emotionalSupport.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pillar-card:hover {
  border-color: var(--color-crepuscule-200);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.pillar-card:hover .pillar-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .pillar-card:hover {
    transform: none;
  }
}
</style>
