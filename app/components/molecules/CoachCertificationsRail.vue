<script setup lang="ts">
/**
 * CoachCertificationsRail — liste de réassurance des certifications (LAB.3).
 *
 * Amendement UX du 2026-10-24 : un défilement est autorisé **sous** la preuve
 * principale (le hero), jamais pour la porter. Conditions tenues ici :
 *
 * - toutes les cartes sont dans le DOM ; la copie de bouclage est `aria-hidden`
 *   et non focusable, donc le lecteur d'écran et le SEO ne voient qu'une liste ;
 * - défilement automatique **pausable** (WCAG 2.2.2 : pause, stop, hide) :
 *   bouton dédié, pause au survol et au focus, rien ne bouge sous
 *   `prefers-reduced-motion` ;
 * - la carte mise en avant est la première et n'est jamais masquée au chargement ;
 * - clavier : la piste est focusable et se parcourt aux flèches ;
 * - 24 px/s, sans à-coup : le retour de boucle se fait sous la copie cachée,
 *   donc on ne voit jamais de saut.
 *
 * Gabarit : 3 cartes en desktop, 1 + amorce en mobile.
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { orderCredentialsForDisplay } from '~/features/coach/domain/featured-credential'
import CoachCertificationCard from '~/components/molecules/CoachCertificationCard.vue'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

const AUTOPLAY_PX_PER_SECOND = 24

/** Mise en avant d'abord, puis l'ordre déclaré (règle testée dans le domaine). */
const ordered = computed(() => orderCredentialsForDisplay(props.credentials))
const total = computed(() => ordered.value.length)

const track = ref<HTMLElement | null>(null)
const pausedByUser = ref(false)
const hovered = ref(false)
const focused = ref(false)
const motionAllowed = ref(false)

let frame = 0
let lastTimestamp = 0

const shouldScroll = computed(
  () => motionAllowed.value && !pausedByUser.value && !hovered.value && !focused.value
)

function togglePlayback() {
  pausedByUser.value = !pausedByUser.value
}

function scrollByPage(direction: 1 | -1) {
  const element = track.value
  if (!element) return
  element.scrollBy({
    left: direction * element.clientWidth * 0.9,
    behavior: motionAllowed.value ? 'smooth' : 'auto'
  })
}

/** Point de bouclage : position de la première carte de la copie cachée. */
function loopPoint(element: HTMLElement): number {
  const firstClone = element.children[ordered.value.length] as HTMLElement | undefined
  return firstClone?.offsetLeft ?? 0
}

function tick(timestamp: number) {
  const element = track.value
  if (element && shouldScroll.value && lastTimestamp > 0) {
    const loop = loopPoint(element)
    element.scrollLeft += ((timestamp - lastTimestamp) / 1000) * AUTOPLAY_PX_PER_SECOND
    if (loop > 0 && element.scrollLeft >= loop) {
      element.scrollLeft -= loop
    }
  }
  lastTimestamp = timestamp
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  motionAllowed.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="mt-8">
    <div class="mb-3 flex items-center justify-between gap-3">
      <p class="text-xs text-[color:var(--color-brand-muted)]">
        {{ total }} certification{{ total > 1 ? 's' : '' }}
      </p>
      <div class="flex items-center gap-2">
        <UButton
          v-if="motionAllowed"
          :icon="pausedByUser ? 'i-lucide-play' : 'i-lucide-pause'"
          color="neutral"
          variant="outline"
          size="xs"
          :aria-label="pausedByUser ? 'Reprendre le défilement des certifications' : 'Mettre en pause le défilement des certifications'"
          :aria-pressed="pausedByUser"
          @click="togglePlayback"
        />
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="outline"
          size="xs"
          aria-label="Certifications précédentes"
          @click="scrollByPage(-1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          size="xs"
          aria-label="Certifications suivantes"
          @click="scrollByPage(1)"
        />
      </div>
    </div>

    <div
      class="overflow-hidden"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @focusin="focused = true"
      @focusout="focused = false"
    >
      <ul
        ref="track"
        class="flex list-none gap-3 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabindex="0"
        :aria-label="`Certifications : ${total}`"
      >
        <li
          v-for="cred in ordered"
          :key="cred.title + (cred.year ?? '')"
          class="flex w-[78%] shrink-0 items-center rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3 sm:w-[calc((100%-1.5rem)/3)]"
        >
          <CoachCertificationCard :credential="cred" />
        </li>

        <!-- Copie de bouclage : jamais annoncée, jamais focusable. -->
        <li
          v-for="cred in ordered"
          :key="'loop-' + cred.title + (cred.year ?? '')"
          aria-hidden="true"
          class="flex w-[78%] shrink-0 items-center rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3 sm:w-[calc((100%-1.5rem)/3)]"
        >
          <CoachCertificationCard
            :credential="cred"
            decorative
          />
        </li>
      </ul>
    </div>
  </div>
</template>
