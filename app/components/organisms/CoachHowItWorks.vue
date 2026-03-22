<script setup lang="ts">
import type { CoachHowItWorksProps } from '~/features/coach/types/coach-page.types'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<CoachHowItWorksProps>()

const { reveal } = useScrollReveal()

// <!-- TODO: Feature V — dynamiser -->
const steps = computed(() => [
  {
    number: '01',
    title: 'Vous réservez votre appel',
    description: `Choisissez un créneau qui vous convient. C'est gratuit, sans engagement, et 100% en visio.`,
    icon: 'i-lucide-calendar'
  },
  {
    number: '02',
    title: `On fait connaissance (${props.discoveryDurationMinutes} min)`,
    description: `${props.providerFirstName} vous écoute, vous pose quelques questions sur vos symptômes et votre quotidien. Pas de pression, pas de discours commercial.`,
    icon: 'i-lucide-phone'
  },
  {
    number: '03',
    title: `${props.providerFirstName} vous donne un premier éclairage`,
    description: 'Vous repartez avec des premières pistes concrètes, même si vous décidez de ne pas aller plus loin.',
    icon: 'i-lucide-lightbulb'
  },
  {
    number: '04',
    title: 'Vous décidez, à votre rythme',
    description: `Si l'accompagnement vous convient, on démarre ensemble. Sinon, vous gardez les conseils de l'appel — c'est cadeau.`,
    icon: 'i-lucide-heart-handshake'
  }
])
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal bg-[#f5f0eb] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-6xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <!-- Desktop: horizontal timeline -->
      <div class="hidden lg:block">
        <!-- Progress line with numbered badges -->
        <div class="relative mb-16">
          <div
            class="absolute left-[12.5%] right-[12.5%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#5b4b6e]/20 via-[#d4956a]/30 to-[#5b4b6e]/20"
            aria-hidden="true"
          />
          <div class="relative grid grid-cols-4">
            <div
              v-for="(step, index) in steps"
              :key="step.number"
              v-bind="reveal({ delay: index * 150 })"
              class="scroll-reveal flex justify-center"
            >
              <div class="step-badge relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] shadow-lg shadow-[#5b4b6e]/20 ring-4 ring-[#f5f0eb] transition-all duration-500">
                <span class="font-serif text-base font-bold text-white">
                  {{ step.number }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step cards -->
        <div class="grid grid-cols-4 gap-6">
          <article
            v-for="(step, index) in steps"
            :key="`card-${step.number}`"
            v-bind="reveal({ delay: index * 150 + 80 })"
            class="step-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6 text-center transition-all duration-300"
          >
            <!-- Glow blob (B2B pattern) -->
            <div
              class="step-card-glow absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
              aria-hidden="true"
            />

            <div class="relative">
              <!-- Icon with color change (B2B pattern) -->
              <div class="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                <UIcon
                  :name="step.icon"
                  class="size-5 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                />
              </div>
              <h3 class="font-serif text-lg text-[#2d2438]">
                {{ step.title }}
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-[#4a4255]">
                {{ step.description }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <!-- Mobile/Tablet: vertical timeline -->
      <div class="lg:hidden">
        <div class="relative space-y-8 pl-16">
          <!-- Vertical line -->
          <div
            class="absolute bottom-0 left-6 top-0 w-px bg-gradient-to-b from-[#5b4b6e]/30 via-[#d4956a]/20 to-[#5b4b6e]/10"
            aria-hidden="true"
          />

          <article
            v-for="(step, index) in steps"
            :key="`mobile-${step.number}`"
            v-bind="reveal({ delay: index * 100 })"
            class="step-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6 transition-all duration-300"
          >
            <!-- Number dot on the line -->
            <div class="absolute -left-16 top-6 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] text-sm font-bold text-white shadow-md ring-4 ring-[#f5f0eb]">
              {{ step.number }}
            </div>

            <!-- Glow blob -->
            <div
              class="step-card-glow absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
              aria-hidden="true"
            />

            <div class="relative flex items-start gap-4">
              <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                <UIcon
                  :name="step.icon"
                  class="size-5 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                />
              </div>
              <div>
                <h3 class="font-serif text-lg text-[#2d2438]">
                  {{ step.title }}
                </h3>
                <p class="mt-2 text-base leading-relaxed text-[#4a4255]">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-card:hover {
  border-color: #d7cfdf;
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.step-card:hover .step-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

.step-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.25);
}

@media (prefers-reduced-motion: reduce) {
  .step-card:hover,
  .step-badge:hover {
    transform: none;
  }
}
</style>
