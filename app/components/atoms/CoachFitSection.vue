<script setup lang="ts">
import type { CoachFitSectionItem } from '~/features/seo/api/coach-fit-section.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'

/**
 * CoachFitSection — Section d'adéquation « Pour qui / Pour qui ce n'est pas » (Story 0-39, AC-5).
 * Permet de qualifier les visiteuses et d'établir un cadre clair et transparent.
 */
const props = withDefaults(
  defineProps<{
    items?: CoachFitSectionItem[]
    eyebrow?: string
    title?: string
  }>(),
  {
    items: () => [],
    eyebrow: 'Adéquation',
    title: 'Cet accompagnement est-il fait pour vous ?'
  }
)

const { reveal } = useScrollReveal()

const DEFAULT_FOR_ITEMS: CoachFitSectionItem[] = [
  { type: 'for', text: 'Vous traversez la périménopause ou la ménopause et souhaitez soulager vos symptômes naturellement.' },
  { type: 'for', text: 'Vous cherchez une écoute attentive, bienveillante et un plan d\'action personnalisé sans jugement.' },
  { type: 'for', text: 'Vous souhaitez comprendre ce qui se passe dans votre corps et reprendre le contrôle durablement.' },
  { type: 'for', text: 'Vous êtes motivée à adopter de nouvelles habitudes de vie adaptées à votre quotidien.' }
]

const DEFAULT_NOT_FOR_ITEMS: CoachFitSectionItem[] = [
  { type: 'not_for', text: 'Vous cherchez un diagnostic médical d\'urgence ou une prescription de traitements hormonaux.' },
  { type: 'not_for', text: 'Vous attendez une solution miracle sans modifier votre alimentation ni votre rythme.' },
  { type: 'not_for', text: 'Vous ne souhaitez pas vous investir dans un échange régulier et constructif.' }
]

const forList = computed(() => {
  const custom = props.items.filter(i => i.type === 'for')
  return custom.length ? custom : DEFAULT_FOR_ITEMS
})

const notForList = computed(() => {
  const custom = props.items.filter(i => i.type === 'not_for')
  return custom.length ? custom : DEFAULT_NOT_FOR_ITEMS
})
</script>

<template>
  <section
    id="pour-qui"
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-20 sm:px-12 sm:py-28 lg:px-16"
  >
    <div class="mx-auto max-w-6xl">
      <!-- En-tête centré -->
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-primary)]">
          {{ eyebrow }}
        </span>
        <h2 class="mt-3 font-serif text-3xl font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-4xl">
          {{ title }}
        </h2>
      </div>

      <!-- Grille 2 colonnes Pour qui / Ce n'est pas adapté si -->
      <div class="mt-14 grid gap-8 md:grid-cols-2">
        <!-- Pour vous si... -->
        <div
          v-bind="reveal({ delay: 100 })"
          class="scroll-reveal rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg sm:p-10"
        >
          <div class="flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <UIcon
                name="i-lucide-check-circle"
                class="size-6"
              />
            </div>
            <h3 class="font-serif text-2xl font-semibold text-[color:var(--color-text-primary)]">
              C'est pour vous si…
            </h3>
          </div>

          <ul class="mt-6 space-y-4">
            <li
              v-for="(item, idx) in forList"
              :key="idx"
              class="flex items-start gap-3"
            >
              <UIcon
                name="i-lucide-check"
                class="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <span class="text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
                {{ item.text }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Ce n'est pas adapté si... -->
        <div
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 transition-all duration-300 hover:border-rose-500/30 hover:shadow-lg sm:p-10"
        >
          <div class="flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <UIcon
                name="i-lucide-x-circle"
                class="size-6"
              />
            </div>
            <h3 class="font-serif text-2xl font-semibold text-[color:var(--color-text-primary)]">
              Ce n'est pas adapté si…
            </h3>
          </div>

          <ul class="mt-6 space-y-4">
            <li
              v-for="(item, idx) in notForList"
              :key="idx"
              class="flex items-start gap-3"
            >
              <UIcon
                name="i-lucide-x"
                class="mt-1 size-4 shrink-0 text-rose-600 dark:text-rose-400"
              />
              <span class="text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
                {{ item.text }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
