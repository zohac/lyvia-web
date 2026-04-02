<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

const { reveal } = useScrollReveal()

// <!-- TODO: Feature V — dynamiser -->
const benefits = [
  {
    icon: 'i-lucide-moon-star',
    title: 'Sommeil retrouvé',
    description: 'Des nuits complètes, sans réveils à 3h du matin'
  },
  {
    icon: 'i-lucide-sun',
    title: 'Énergie stable',
    description: 'Finies les journées où vous survivez au lieu de vivre'
  },
  {
    icon: 'i-lucide-heart-pulse',
    title: 'Bouffées de chaleur apaisées',
    description: 'Des outils concrets qui fonctionnent'
  },
  {
    icon: 'i-lucide-leaf',
    title: 'Poids stabilisé',
    description: 'Sans régime ni frustration'
  },
  {
    icon: 'i-lucide-brain',
    title: 'Concentration retrouvée',
    description: 'Mémoire, motivation qui reviennent'
  },
  {
    icon: 'i-lucide-smile',
    title: 'Sérénité au quotidien',
    description: 'Moins d\'irritabilité, plus de sérénité'
  }
]
</script>

<template>
  <!-- TODO: Feature V — dynamiser -->
  <section
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-6xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <!-- Intro text V3 — vision + promesse -->
      <div class="mx-auto mt-12 max-w-3xl space-y-6 text-center">
        <p class="text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
          Imaginez-vous dans 3 mois.
        </p>
        <p class="text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
          Vous dormez mieux. Vous vous sentez plus légère, plus apaisée.
          Vous comprenez enfin ce qui se passe dans votre corps. Et vous savez quoi faire.
          Vous vous reconnaissez à nouveau.
        </p>
      </div>

      <!-- Benefit cards — B2B feature-card pattern harmonized -->
      <div class="mt-20 grid gap-6 sm:grid-cols-2">
        <article
          v-for="(benefit, index) in benefits"
          :key="benefit.title"
          v-bind="reveal({ delay: index * 100 })"
          class="benefit-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-8 transition-all duration-300"
        >
          <!-- Glow blob (B2B pattern) -->
          <div
            class="benefit-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex items-start gap-5">
            <!-- Icon with color change on hover (B2B pattern) -->
            <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
              <UIcon
                :name="benefit.icon"
                class="size-6 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
              />
            </div>

            <div>
              <h3 class="font-serif text-lg text-[var(--color-crepuscule-950)]">
                {{ benefit.title }}
              </h3>
              <p class="mt-2 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
                {{ benefit.description }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.benefit-card:hover {
  border-color: var(--color-crepuscule-200);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.benefit-card:hover .benefit-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .benefit-card:hover {
    transform: none;
  }
}
</style>
