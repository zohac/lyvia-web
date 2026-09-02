<script setup lang="ts">
import type { CoachHowItWorksProps } from '~/features/coach/types/coach-page.types'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<CoachHowItWorksProps>()

const { reveal } = useScrollReveal()

// P-Y3: no fallback content at organism level.
// The parent template mounts this component only when steps is non-empty
// (visibility rule = toggle AND content non-empty).
const STEP_ICONS = ['i-lucide-calendar', 'i-lucide-phone', 'i-lucide-compass', 'i-lucide-heart-handshake']

function normalizeIcon(iconName?: string | null, fallback = 'i-lucide-circle'): string {
  if (!iconName || !iconName.trim()) return fallback
  const trimmed = iconName.trim()
  if (trimmed.startsWith('i-')) return trimmed
  return `i-lucide-${trimmed}`
}

const FALLBACK_STEPS = [
  { number: '1', title: 'Appel découverte', description: 'Un premier échange offert de 15 minutes pour faire le point sur votre situation et vos besoins.', icon: undefined },
  { number: '2', title: 'Bilan approfondi', description: 'Une analyse détaillée de votre historique, de vos habitudes et de vos symptômes.', icon: undefined },
  { number: '3', title: 'Plan d\'action personnalisé', description: 'Des recommandations concrètes et adaptées à votre rythme de vie.', icon: undefined },
  { number: '4', title: 'Suivi et ajustements', description: 'Un accompagnement pas à pas pour consolider vos progrès dans la durée.', icon: undefined }
]

const steps = computed(() => {
  const apiSteps = props.steps?.length ? props.steps : FALLBACK_STEPS
  return apiSteps.map((s, i) => ({
    ...s,
    icon: s.icon ? normalizeIcon(s.icon) : (STEP_ICONS[i] ?? 'i-lucide-circle')
  }))
})
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal bg-[var(--color-neutral-50)] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-6xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <!-- Desktop: horizontal timeline -->
      <div class="hidden lg:block">
        <!-- Progress line with numbered badges -->
        <div class="relative mb-16">
          <div
            class="absolute left-[12.5%] right-[12.5%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[var(--color-brand-primary)]/20 via-[var(--color-brand-accent)]/30 to-[var(--color-brand-primary)]/20"
            aria-hidden="true"
          />
          <div class="relative grid grid-cols-4">
            <div
              v-for="(step, index) in steps"
              :key="step.number"
              v-bind="reveal({ delay: index * 150 })"
              class="scroll-reveal flex justify-center"
            >
              <div class="step-badge relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-800)] shadow-lg shadow-[var(--color-brand-primary)]/20 ring-4 ring-[var(--color-neutral-50)] transition-all duration-500">
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
            class="step-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-6 text-center transition-all duration-300"
          >
            <!-- Glow blob (B2B pattern) -->
            <div
              class="step-card-glow absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
              aria-hidden="true"
            />

            <div class="relative">
              <!-- Icon with color change (B2B pattern) -->
              <div class="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
                <UIcon
                  :name="step.icon"
                  class="size-5 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
                />
              </div>
              <h3 class="font-serif text-lg text-[var(--color-crepuscule-950)]">
                {{ step.title }}
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-[var(--color-crepuscule-700)]">
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
            class="absolute bottom-0 left-6 top-0 w-px bg-gradient-to-b from-[var(--color-brand-primary)]/30 via-[var(--color-brand-accent)]/20 to-[var(--color-brand-primary)]/10"
            aria-hidden="true"
          />

          <article
            v-for="(step, index) in steps"
            :key="`mobile-${step.number}`"
            v-bind="reveal({ delay: index * 100 })"
            class="step-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-6 transition-all duration-300"
          >
            <!-- Number dot on the line -->
            <div class="absolute -left-16 top-6 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-800)] text-sm font-bold text-white shadow-md ring-4 ring-[var(--color-neutral-50)]">
              {{ step.number }}
            </div>

            <!-- Glow blob -->
            <div
              class="step-card-glow absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
              aria-hidden="true"
            />

            <div class="relative flex items-start gap-4">
              <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
                <UIcon
                  :name="step.icon"
                  class="size-5 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
                />
              </div>
              <div>
                <h3 class="font-serif text-lg text-[var(--color-crepuscule-950)]">
                  {{ step.title }}
                </h3>
                <p class="mt-2 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
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
  border-color: var(--color-crepuscule-200);
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
