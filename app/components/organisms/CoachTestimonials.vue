<script setup lang="ts">
import type { CoachTestimonialsProps, SectionHeaderProps } from '~/features/coach/types/coach-page.types'
import { useScrollReveal } from '~/composables/useScrollReveal'

withDefaults(defineProps<CoachTestimonialsProps & SectionHeaderProps>(), {
  eyebrow: undefined,
  sectionTitle: undefined,
  sectionTitleAccent: undefined
})

const { reveal } = useScrollReveal()

const avatarColors = ['#5b4b6e', '#d4956a', '#7a6b8e', '#b8956a', '#4d3f5c']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]!
}
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal relative overflow-hidden bg-[#f5f0eb] px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="relative mx-auto max-w-5xl">
      <!-- Section H2 (P-Y5 amended: organism owns its header rendering) -->
      <template v-if="sectionTitle">
        <div class="mb-12 text-center">
          <span
            v-if="eyebrow"
            class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]"
          >
            {{ eyebrow }}
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#2d2438]">
            {{ sectionTitle }}
            <span
              v-if="sectionTitleAccent"
              class="text-[#5b4b6e]"
            >{{ sectionTitleAccent }}</span>
          </h2>
        </div>
      </template>

      <div class="space-y-8">
        <article
          v-for="(testimonial, index) in testimonials"
          :key="index"
          v-bind="reveal({ delay: index * 150 })"
          class="testimonial-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8 transition-all duration-300 sm:p-10"
        >
          <!-- Glow blob (B2B pattern — differentiating: bottom-left instead of top-right) -->
          <div
            class="testimonial-card-glow absolute -bottom-8 -left-8 size-28 rounded-full bg-gradient-to-tr from-[#5b4b6e] to-[#7a6b8e] opacity-0"
            aria-hidden="true"
          />

          <!-- Large quote mark — differentiating element -->
          <span
            class="absolute -top-2 right-8 font-serif text-[7rem] leading-none text-[#d4956a]/8 transition-colors duration-500 group-hover:text-[#d4956a]/15 sm:right-10"
            aria-hidden="true"
          >"</span>

          <div class="relative">
            <!-- Stars rating (if present) -->
            <div
              v-if="testimonial.rating"
              class="mb-5 flex gap-1"
            >
              <span
                v-for="star in 5"
                :key="star"
                class="text-base transition-colors duration-300"
                :class="star <= testimonial.rating! ? 'text-[#d4956a]' : 'text-[#d4956a]/15'"
              >&#9733;</span>
            </div>

            <!-- Quote -->
            <blockquote class="font-serif text-xl leading-relaxed text-[#2d2438] sm:text-2xl">
              {{ testimonial.quote }}
            </blockquote>

            <!-- Result (italic, if present) -->
            <p
              v-if="testimonial.result"
              class="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d4956a]/15 bg-[#fdf6f1] px-4 py-1.5 text-sm italic text-[#c47a4a]"
            >
              <UIcon
                name="i-lucide-trending-up"
                class="size-4 shrink-0"
              />
              {{ testimonial.result }}
            </p>

            <!-- Author -->
            <footer class="mt-8 flex items-center gap-4">
              <!-- Avatar -->
              <div
                class="flex size-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                :style="{ background: `linear-gradient(135deg, ${getAvatarColor(testimonial.firstName)}, ${getAvatarColor(testimonial.firstName)}cc)` }"
              >
                {{ testimonial.firstName.charAt(0).toUpperCase() }}
              </div>

              <div>
                <cite class="block text-base font-medium not-italic text-[#2d2438]">
                  {{ testimonial.firstName }}<template v-if="testimonial.age">, {{ testimonial.age }} ans</template>
                </cite>
                <span
                  v-if="testimonial.location"
                  class="flex items-center gap-1 text-sm text-[#857d8c]"
                >
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-3"
                  />
                  {{ testimonial.location }}
                </span>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonial-card:hover {
  border-color: #d7cfdf;
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.testimonial-card:hover .testimonial-card-glow {
  opacity: 0.08;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .testimonial-card:hover {
    transform: none;
  }
}
</style>
