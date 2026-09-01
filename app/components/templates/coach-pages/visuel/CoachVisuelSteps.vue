<script setup lang="ts">
/**
 * CoachVisuelSteps — Section Votre parcours pour le template Visuel.
 *
 * Grandes typographies numérotées élégantes avec séparateurs fins.
 */
import type { HowItWorksStep } from '~/features/seo/api/public-provider-profile.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<{
  steps: HowItWorksStep[] | null
  eyebrow?: string
  title?: string
}>()

const { reveal } = useScrollReveal()

const FALLBACK_STEPS = [
  { number: '1', title: 'Appel découverte', description: 'Un premier échange offert de 15 minutes pour faire le point sur votre situation et vos besoins.' },
  { number: '2', title: 'Bilan approfondi', description: 'Une analyse détaillée de votre historique, de vos habitudes et de vos symptômes.' },
  { number: '3', title: 'Plan d\'action personnalisé', description: 'Des recommandations concrètes et adaptées à votre rythme de vie.' },
  { number: '4', title: 'Suivi et ajustements', description: 'Un accompagnement pas à pas pour consolider vos progrès dans la durée.' }
]

const stepItems = computed(() => props.steps?.length ? props.steps : FALLBACK_STEPS)
</script>

<template>
  <section
    id="parcours"
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-20 sm:px-12 sm:py-28 lg:px-16"
  >
    <div class="mx-auto max-w-4xl">
      <!-- En-tête centré -->
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-primary)]">
          {{ eyebrow || 'Comment ça se passe' }}
        </span>
        <h2 class="mt-3 font-serif text-3xl font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-4xl">
          {{ title || 'Votre parcours' }}
        </h2>
      </div>

      <!-- Liste étapes -->
      <div class="mt-14 divide-y divide-[color:var(--color-border-subtle)]">
        <div
          v-for="(st, idx) in stepItems"
          :key="idx"
          v-bind="reveal({ delay: idx * 80 })"
          class="scroll-reveal flex items-start gap-6 py-8 sm:gap-10 sm:py-10"
        >
          <!-- Chiffre grand format élégant -->
          <span class="font-serif text-4xl font-light text-[color:var(--color-brand-primary)]/40 sm:text-6xl sm:min-w-16">
            {{ String(idx + 1).padStart(2, '0') }}
          </span>

          <div class="pt-1">
            <h3 class="font-serif text-xl font-semibold text-[color:var(--color-text-primary)] sm:text-2xl">
              {{ st.title }}
            </h3>
            <p class="mt-2.5 text-base leading-relaxed text-[color:var(--color-brand-secondary)] sm:text-lg">
              {{ st.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
