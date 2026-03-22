<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

const { reveal } = useScrollReveal()
</script>

<template>
  <!-- TODO: Feature V — dynamiser -->
  <!-- TODO: Asset Sophie — remplacer par contenu rédigé -->
  <section
    v-bind="reveal()"
    class="scroll-reveal relative overflow-hidden bg-[#f5f0eb] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-5xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <!-- TODO: Feature V — dynamiser -->
      <div class="space-y-8 text-lg leading-relaxed text-[#4a4255]">
        <p
          v-bind="reveal({ delay: 100 })"
          class="scroll-reveal"
        >
          La périménopause commence souvent vers 45 ans, parfois plus tôt.
          C'est une transition hormonale qui peut durer de 2 à 8 ans
          et provoquer des symptômes que beaucoup de femmes ne savent pas relier à la ménopause.
        </p>

        <p
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal"
        >
          Prise de poids soudaine, insomnies, fatigue chronique, bouffées de chaleur,
          anxiété, irritabilité, douleurs articulaires, brouillard mental, sueurs nocturnes...
          Ces symptômes sont réels. Ils ne sont pas « dans votre tête ».
          Et ils ne sont pas une fatalité.
        </p>

        <!-- Highlighted insight box — B2B pattern with glow -->
        <div
          v-bind="reveal({ delay: 300 })"
          class="insight-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-[#f5f3f7] p-6 transition-all duration-300"
        >
          <!-- Glow blob (B2B pattern — differentiating: left side, violet tint) -->
          <div
            class="insight-card-glow absolute -left-6 -top-6 size-24 rounded-full bg-gradient-to-br from-[#7a6b8e] to-[#5b4b6e] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex items-start gap-4">
            <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
              <UIcon
                name="i-lucide-lightbulb"
                class="size-5 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
              />
            </div>
            <div>
              <h3 class="font-serif text-lg text-[#2d2438]">
                Alternatives naturelles
              </h3>
              <p class="mt-2 text-base leading-relaxed text-[#4a4255]">
                Beaucoup de femmes cherchent des alternatives naturelles au traitement hormonal.
                L'accompagnement ménopause agit sur ce que votre médecin
                n'a pas le temps d'aborder en 15 minutes de consultation :
                alimentation anti-inflammatoire, gestion du stress, qualité du sommeil, mouvement adapté.
              </p>
            </div>
          </div>
        </div>

        <p
          v-bind="reveal({ delay: 400 })"
          class="scroll-reveal"
        >
          Ce n'est ni du médical, ni du « bien-être » générique.
          C'est un accompagnement structuré par une infirmière de 20 ans d'expérience,
          adapté à vous, qui complète votre suivi médical.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.insight-card:hover {
  border-color: #d7cfdf;
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
