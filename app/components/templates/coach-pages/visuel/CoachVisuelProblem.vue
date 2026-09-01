<script setup lang="ts">
/**
 * CoachVisuelProblem — Section Énoncé du problème pour le template Visuel.
 *
 * Design sombre profond (var(--color-neutral-950)), citation grand format en italique,
 * et grille de symptômes avec fond translucide.
 */
import type { ProblemStatementJson } from '~/features/seo/api/public-provider-profile.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'

defineProps<{
  problemStatement: ProblemStatementJson | null
  eyebrow?: string
  title?: string
}>()

const { reveal } = useScrollReveal()

const defaultSymptoms = [
  { icon: 'i-lucide-wind', label: 'Bouffées de chaleur' },
  { icon: 'i-lucide-moon-star', label: 'Troubles du sommeil' },
  { icon: 'i-lucide-battery-low', label: 'Fatigue persistante' },
  { icon: 'i-lucide-activity', label: 'Irritabilité & anxiété' },
  { icon: 'i-lucide-scale', label: 'Prise de poids' },
  { icon: 'i-lucide-heart-pulse', label: 'Douleurs articulaires' }
]
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal relative overflow-hidden bg-neutral-950 px-6 py-20 text-white sm:px-12 sm:py-28 lg:px-16"
  >
    <!-- Background glowing ambient radial -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-brand-primary)_30%,transparent),transparent_70%)] blur-3xl"
    />

    <div class="relative mx-auto max-w-5xl">
      <!-- Eyebrow & Title si fournis -->
      <div
        v-if="eyebrow || title"
        class="mb-10"
      >
        <span
          v-if="eyebrow"
          class="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-accent)]"
        >
          {{ eyebrow }}
        </span>
        <h2
          v-if="title"
          class="mt-3 font-serif text-2xl leading-tight text-white sm:text-3xl lg:text-4xl"
        >
          {{ title }}
        </h2>
      </div>

      <!-- Citation principale -->
      <div class="max-w-3xl">
        <UIcon
          name="i-lucide-quote"
          class="size-10 text-[color:var(--color-brand-accent)]/80 sm:size-12"
        />
        <p class="mt-4 font-serif text-2xl font-medium italic leading-snug text-white sm:text-3xl lg:text-4xl">
          {{ problemStatement?.blockquote || "« On me dit que c'est dans la tête, mais je ne reconnais plus mon corps. »" }}
        </p>
      </div>

      <!-- Grille de symptômes -->
      <div class="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          v-for="(sy, i) in defaultSymptoms"
          :key="i"
          v-bind="reveal({ delay: i * 60 })"
          class="scroll-reveal flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs transition-colors hover:border-white/20"
        >
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-brand-primary)_35%,transparent)] text-white">
            <UIcon
              :name="sy.icon"
              class="size-5"
            />
          </div>
          <span class="text-sm font-semibold text-white/90 sm:text-base">{{ sy.label }}</span>
        </div>
      </div>

      <!-- Paragraphes explicatifs -->
      <div
        v-if="problemStatement?.paragraphs?.length"
        class="mt-10 max-w-2xl space-y-4 text-base leading-relaxed text-white/75 sm:text-lg"
      >
        <p
          v-for="(para, idx) in problemStatement.paragraphs"
          :key="idx"
        >
          {{ para }}
        </p>
      </div>
    </div>
  </section>
</template>
