<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

const { reveal } = useScrollReveal()

const benefits = [
  {
    icon: 'i-lucide-heart-pulse',
    title: 'Compréhension de votre corps',
    description: 'une meilleure compréhension de votre corps'
  },
  {
    icon: 'i-lucide-sun',
    title: 'Énergie et sérénité',
    description: 'plus d\'énergie et de sérénité au quotidien'
  },
  {
    icon: 'i-lucide-moon-star',
    title: 'Sommeil réparateur',
    description: 'un sommeil plus réparateur'
  },
  {
    icon: 'i-lucide-leaf',
    title: 'Équilibre hormonal',
    description: 'des habitudes de vie qui soutiennent votre équilibre hormonal'
  }
]
</script>

<template>
  <!-- TODO: Feature V — dynamiser -->
  <section
    v-bind="reveal()"
    class="scroll-reveal bg-white px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-6xl">
      <!-- Intro text — Sophie's validated content -->
      <div class="mx-auto max-w-3xl space-y-6 text-center">
        <p class="text-lg leading-relaxed text-[#4a4255]">
          Chaque femme vit cette période de transition différemment.
          Certaines ressentent de la fatigue, d'autres un sommeil perturbé,
          des variations d'humeur ou l'impression de ne plus reconnaître leur corps.
        </p>
        <p class="text-lg leading-relaxed text-[#4a4255]">
          L'objectif de cet accompagnement est de vous aider à comprendre ce qui se passe,
          à identifier ce qui vous convient vraiment et à mettre en place des ajustements
          simples et adaptés à votre mode de vie.
        </p>
      </div>

      <!-- Benefit cards — B2B feature-card pattern harmonized -->
      <div class="mt-20 grid gap-6 sm:grid-cols-2">
        <article
          v-for="(benefit, index) in benefits"
          :key="benefit.title"
          v-bind="reveal({ delay: index * 100 })"
          class="benefit-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8 transition-all duration-300"
        >
          <!-- Glow blob (B2B pattern) -->
          <div
            class="benefit-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex items-start gap-5">
            <!-- Icon with color change on hover (B2B pattern) -->
            <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
              <UIcon
                :name="benefit.icon"
                class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
              />
            </div>

            <div>
              <h3 class="font-serif text-lg text-[#2d2438]">
                {{ benefit.title }}
              </h3>
              <p class="mt-2 text-base leading-relaxed text-[#4a4255]">
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
  border-color: #d7cfdf;
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
