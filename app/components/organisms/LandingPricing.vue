<script setup lang="ts">
/**
 * Story 0-35 — Section pricing de la landing B2B (keova.app).
 *
 * 2 cartes exactement (Essentiel + Premium), Premium mis en avant. Copy figé
 * dans `~/features/marketing/pricing-plans.ts` (source de vérité = spec §2.2).
 * Le CTA n'ouvre PAS de checkout : il émet `reserve` → le parent ouvre la
 * waitlist (AC-5).
 *
 * Scroll-reveal auto-contenu (garde-fou hotfix-12) : le contenu est visible par
 * défaut (`opacity: 1`) et n'est masqué que lorsque le JS est prêt.
 */
import {
  PRICING_PLANS,
  PRICING_HEADING,
  PRICING_CHAPO,
  PRICING_REASSURANCE,
  PRICING_MICROCOPY
} from '~/features/marketing/pricing-plans'
import { useScrollReveal } from '~/composables/useScrollReveal'

const emit = defineEmits<{ reserve: [] }>()

const { reveal, isReady } = useScrollReveal()
</script>

<template>
  <section
    id="tarifs"
    :class="['relative bg-[var(--color-crepuscule-100)] px-6 py-24 sm:px-12 lg:px-20', { 'js-scroll-ready': isReady }]"
  >
    <div class="mx-auto max-w-5xl">
      <!-- En-tête -->
      <div
        v-bind="reveal()"
        class="scroll-reveal mb-12 text-center"
      >
        <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[var(--color-crepuscule-500)] to-[var(--color-brand-accent)]" />
        <h2 class="font-serif text-3xl leading-tight text-[var(--color-crepuscule-950)] lg:text-4xl">
          {{ PRICING_HEADING }}
        </h2>
        <!-- crepuscule-600 et non -500 : sur le fond crepuscule-100 de la section,
             le -500 (#7a6b8e) plafonne à 3,98:1, sous le seuil WCAG AA de 4,5:1 (AC-7).
             Le -600 (#5b4b6e) donne 6,43:1. -->
        <p class="mx-auto mt-4 max-w-2xl text-[var(--color-crepuscule-600)]">
          {{ PRICING_CHAPO }}
        </p>
      </div>

      <!-- Les 2 cartes -->
      <div
        v-bind="reveal({ delay: 150 })"
        class="scroll-reveal grid items-stretch gap-6 lg:grid-cols-2"
      >
        <div
          v-for="plan in PRICING_PLANS"
          :key="plan.id"
          :class="[
            'pricing-card relative flex flex-col rounded-3xl p-8 transition-all duration-300',
            plan.featured
              ? 'pricing-card--featured border-2 border-[var(--color-brand-accent)] bg-[color:var(--color-surface-card)] shadow-xl lg:scale-[1.02]'
              : 'border border-[var(--color-crepuscule-200)] bg-[color:var(--color-surface-card)] shadow-sm'
          ]"
        >
          <!-- Badge Tarif fondateur (plan mis en avant) -->
          <span
            v-if="plan.badge"
            class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md"
          >
            {{ plan.badge }}
          </span>

          <!-- Nom + pour qui -->
          <h3 class="font-serif text-2xl font-semibold text-[var(--color-crepuscule-900)]">
            {{ plan.name }}
          </h3>
          <p class="mt-1 text-sm text-[var(--color-crepuscule-500)]">
            {{ plan.audience }}
          </p>

          <!-- Prix (texte HTML réel, jamais image) -->
          <div class="mt-6">
            <p class="font-serif text-3xl text-[var(--color-crepuscule-950)]">
              {{ plan.priceLabel }}
            </p>
            <p
              v-if="plan.priceSuffix"
              class="mt-1 text-sm text-[var(--color-crepuscule-500)]"
            >
              {{ plan.priceSuffix }}
            </p>
          </div>

          <!-- Ligne clé -->
          <p class="mt-4 font-medium text-[var(--color-brand-primary)]">
            {{ plan.keyLine }}
          </p>

          <!-- Puces factuelles -->
          <ul class="mt-6 space-y-3">
            <li
              v-for="bullet in plan.bullets"
              :key="bullet"
              class="flex items-start gap-3 text-sm text-[var(--color-crepuscule-700)]"
            >
              <UIcon
                name="i-lucide-check"
                class="mt-0.5 size-4 shrink-0 text-[var(--color-brand-accent)]"
              />
              <span>{{ bullet }}</span>
            </li>
          </ul>

          <!-- CTA → waitlist (pas de checkout) -->
          <button
            type="button"
            :class="[
              'mt-8 w-full rounded-full px-6 py-3 font-semibold transition-all duration-300',
              plan.featured
                ? 'cta-featured text-white shadow-lg'
                : 'border border-[var(--color-crepuscule-300)] text-[var(--color-crepuscule-800)] hover:border-[var(--color-brand-accent)] hover:text-[var(--color-brand-primary)]'
            ]"
            @click="emit('reserve')"
          >
            {{ plan.ctaLabel }}
          </button>
        </div>
      </div>

      <!-- Bandeau de réassurance -->
      <p class="mt-10 text-center text-sm font-medium text-[var(--color-crepuscule-700)]">
        {{ PRICING_REASSURANCE }}
      </p>
      <!-- Micro-copy CTA — voir la note contraste sur le chapô (AC-7) -->
      <p class="mx-auto mt-2 max-w-2xl text-center text-xs text-[var(--color-crepuscule-600)]">
        {{ PRICING_MICROCOPY }}
      </p>
    </div>
  </section>
</template>

<style scoped>
/* --- Scroll reveal base (garde-fou hotfix-12) --- */
/* Défaut : visible (SSR-safe pour crawlers et no-JS) */
.scroll-reveal {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

/* JS-enhanced : masqué jusqu'au reveal par IntersectionObserver */
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(24px);
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* --- Cartes pricing --- */
/* Les effets de survol sont gardés par `@media (hover: hover)` : sur tactile, un tap
   déclenche `:hover` et le laisse collé jusqu'au tap suivant ailleurs. Sans cette garde,
   taper la carte Premium sous `lg` (où `lg:scale-[1.02]` est inactif) la laissait
   soulevée ET agrandie, sans jamais se rétracter. */
@media (hover: hover) {
  .pricing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(45, 36, 56, 0.14);
  }

  .pricing-card--featured:hover {
    transform: translateY(-4px) scale(1.02);
  }

  .cta-featured:hover {
    box-shadow: 0 12px 32px rgba(91, 75, 110, 0.3);
    transform: translateY(-2px);
  }
}

/* --- CTA du plan mis en avant --- */
.cta-featured {
  background: linear-gradient(135deg, var(--color-brand-primary), var(--color-crepuscule-700));
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal,
  .pricing-card,
  .cta-featured {
    transition: none !important;
  }

  .pricing-card:hover,
  .pricing-card--featured:hover,
  .cta-featured:hover {
    transform: none !important;
  }
}

/*
 * ⚠️ Les 3 règles `.scroll-reveal` ci-dessus sont volontairement dupliquées depuis
 * `MarketingLandingB2B.vue` plutôt que remontées dans `main.css`. Les passer en global
 * ferait porter le `.js-scroll-ready` du parent sur les enfants de ce composant, alors
 * que chacun gère son propre `isReady` — c'est exactement la classe de bug de la
 * régression hotfix-12 (contenu invisible avant que l'observer local ne l'ait révélé).
 * Toute correction du garde-fou doit donc être appliquée AUX DEUX endroits.
 */
</style>
