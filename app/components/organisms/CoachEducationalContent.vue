<script setup lang="ts">
import type { CoachEducationalContentProps } from '~/features/coach/types/coach-page.types'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<CoachEducationalContentProps>()

const { reveal } = useScrollReveal()

const DEFAULT_PARAGRAPHS = [
  'La pré-ménopause (ou périménopause, son terme médical) commence souvent vers 45 ans, parfois plus tôt. C\'est une transition hormonale qui peut durer de 4 à 8 ans et provoquer des symptômes que beaucoup de femmes ne savent pas relier à la ménopause.',
  'Prise de poids soudaine, insomnies, fatigue chronique, bouffées de chaleur, anxiété, irritabilité, douleurs articulaires, brouillard mental, sueurs nocturnes... Ces symptômes sont réels. Ils ne sont pas « dans votre tête ». Et ils ne sont pas une fatalité.',
  'Ce n\'est ni du médical, ni du « bien-être » générique. C\'est un accompagnement structuré et personnalisé, qui complète votre suivi médical.'
]

const DEFAULT_INSIGHT = {
  title: 'Alternatives naturelles',
  content: 'Beaucoup de femmes cherchent des alternatives naturelles au traitement hormonal. L\'accompagnement ménopause agit sur ce que votre médecin n\'a pas le temps d\'aborder en 15 minutes de consultation\u00A0: alimentation anti-inflammatoire, gestion du stress, qualité du sommeil, mouvement adapté.'
}

const paragraphs = computed(() => props.content?.paragraphs ?? DEFAULT_PARAGRAPHS)
const insightBox = computed(() => props.content?.insightBox ?? DEFAULT_INSIGHT)
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal relative overflow-hidden bg-[var(--color-neutral-50)] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-5xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <div class="space-y-8 text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
        <!-- Paragraphs before insight box -->
        <p
          v-for="(paragraph, i) in paragraphs.slice(0, -1)"
          :key="i"
          v-bind="reveal({ delay: (i + 1) * 100 })"
          class="scroll-reveal"
        >
          {{ paragraph }}
        </p>

        <!-- Highlighted insight box — B2B pattern with glow -->
        <div
          v-bind="reveal({ delay: 300 })"
          class="insight-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[var(--color-crepuscule-50)] p-6 transition-all duration-300"
        >
          <!-- Glow blob (B2B pattern — differentiating: left side, violet tint) -->
          <div
            class="insight-card-glow absolute -left-6 -top-6 size-24 rounded-full bg-gradient-to-br from-[var(--color-crepuscule-500)] to-[var(--color-brand-primary)] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex items-start gap-4">
            <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
              <UIcon
                name="i-lucide-lightbulb"
                class="size-5 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
              />
            </div>
            <div>
              <h3 class="font-serif text-lg text-[var(--color-crepuscule-950)]">
                {{ insightBox.title }}
              </h3>
              <p class="mt-2 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
                {{ insightBox.content }}
              </p>
            </div>
          </div>
        </div>

        <!-- Last paragraph after insight box -->
        <p
          v-if="paragraphs.length > 0"
          v-bind="reveal({ delay: 400 })"
          class="scroll-reveal"
        >
          {{ paragraphs[paragraphs.length - 1] }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.insight-card:hover {
  border-color: var(--color-crepuscule-200);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-2px);
}

.insight-card:hover .insight-card-glow {
  opacity: 0.1;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .insight-card:hover {
    transform: none;
  }
}
</style>
