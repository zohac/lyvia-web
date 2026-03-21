<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

const { reveal } = useScrollReveal()
</script>

<template>
  <!-- TODO: Feature V — dynamiser -->
  <!-- TODO: Asset Sophie — remplacer par contenu rédigé -->
  <section
    v-bind="reveal()"
    class="scroll-reveal relative overflow-hidden bg-white px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-5xl">
      <div class="space-y-8 text-lg leading-relaxed text-[#4a4255]">
        <p
          v-bind="reveal({ delay: 100 })"
          class="scroll-reveal"
        >
          La périménopause commence souvent entre 40 et 45 ans, parfois plus tôt.
          C'est une phase de transition hormonale naturelle durant laquelle le corps
          s'adapte à la baisse progressive des œstrogènes et de la progestérone.
          Les symptômes sont variés : bouffées de chaleur, fatigue chronique,
          troubles du sommeil, prise de poids, irritabilité, douleurs articulaires,
          sécheresse cutanée ou encore brouillard mental.
        </p>

        <p
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal"
        >
          La ménopause est confirmée après 12 mois consécutifs sans règles.
          Mais bien avant ce cap, les fluctuations hormonales peuvent
          profondément affecter le quotidien. Chaque femme vit cette
          transition de manière unique, avec des symptômes d'intensité
          et de durée très variables.
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
                Le saviez-vous ?
              </h3>
              <p class="mt-2 text-base leading-relaxed text-[#4a4255]">
                Un accompagnement adapté permet de mieux comprendre ces changements,
                d'identifier les leviers d'action concrets — alimentation, sommeil,
                gestion du stress, activité physique douce — et de retrouver
                progressivement un équilibre.
              </p>
            </div>
          </div>
        </div>

        <p
          v-bind="reveal({ delay: 400 })"
          class="scroll-reveal"
        >
          Les recherches récentes confirment que les approches globales,
          combinant hygiène de vie et soutien émotionnel, contribuent
          significativement à réduire l'impact des symptômes sur la qualité
          de vie. Chaque petit ajustement compte : une alimentation riche
          en phytoestrogènes, une routine de sommeil adaptée, des techniques
          de respiration pour calmer le système nerveux, ou simplement
          un espace d'écoute bienveillant.
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
