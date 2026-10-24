<script setup lang="ts">
/**
 * CoachCertificationsRail — liste de réassurance des certifications (LAB.3).
 *
 * Deux régimes distincts :
 *
 * - **≤ 3 certifications** : simple grille statique, aucune commande, aucun
 *   défilement. Un « carrousel » sur deux cartes n'a aucun sens, et la copie de
 *   bouclage y dupliquait une certification à l'écran.
 * - **> 3 certifications** : rail à défilement automatique **pas à pas** (une
 *   carte toutes les 4 s, pas un ticker continu), bouclé sans saut, pausable.
 *
 * Conditions d'accessibilité tenues dans les deux cas :
 * - toutes les cartes sont dans le DOM ; la copie de bouclage n'existe qu'en
 *   mode rail, elle est `aria-hidden` et non focusable ;
 * - WCAG 2.2.2 : bouton pause, pause au survol et au focus, rien ne bouge sous
 *   `prefers-reduced-motion` ;
 * - les flèches suspendent le défilement automatique 6 s, sinon le pas suivant
 *   annulait le saut demandé (le `scrollBy` lissé était écrasé à chaque frame).
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { orderCredentialsForDisplay } from '~/features/coach/domain/featured-credential'
import CoachCertificationCard from '~/components/molecules/CoachCertificationCard.vue'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

const STEP_MS = 4000
const MANUAL_PAUSE_MS = 6000

/** Mise en avant d'abord, puis l'ordre déclaré (règle testée dans le domaine). */
const ordered = computed(() => orderCredentialsForDisplay(props.credentials))
const total = computed(() => ordered.value.length)
const isRail = computed(() => total.value > 3)

const track = ref<HTMLElement | null>(null)
const pausedByUser = ref(false)
const hovered = ref(false)
const focused = ref(false)
const motionAllowed = ref(false)
const manualPause = ref(false)

let stepTimer: ReturnType<typeof setInterval> | undefined
let manualTimer: ReturnType<typeof setTimeout> | undefined

const shouldScroll = computed(
  () =>
    isRail.value
    && motionAllowed.value
    && !pausedByUser.value
    && !hovered.value
    && !focused.value
    && !manualPause.value
)

function cardStep(element: HTMLElement): number {
  const firstCard = element.firstElementChild as HTMLElement | null
  if (!firstCard) return element.clientWidth
  return firstCard.offsetWidth + 12
}

/** Position de la première carte de la copie cachée : le point de bouclage. */
function loopPoint(element: HTMLElement): number {
  const firstClone = element.children[ordered.value.length] as HTMLElement | undefined
  return firstClone?.offsetLeft ?? 0
}

function advance(direction: 1 | -1) {
  const element = track.value
  if (!element) return
  const step = cardStep(element)
  const loop = loopPoint(element)
  const next = element.scrollLeft + direction * step

  // Fin de course : on repasse sous la copie, sans saut visible.
  if (loop > 0 && direction === 1 && next >= loop) {
    element.scrollLeft = next - loop
    return
  }
  element.scrollBy({
    left: direction * step,
    behavior: motionAllowed.value ? 'smooth' : 'auto'
  })
}

function pauseForManualAction() {
  manualPause.value = true
  if (manualTimer) clearTimeout(manualTimer)
  manualTimer = setTimeout(() => {
    manualPause.value = false
  }, MANUAL_PAUSE_MS)
}

function goTo(direction: 1 | -1) {
  pauseForManualAction()
  advance(direction)
}

function togglePlayback() {
  pausedByUser.value = !pausedByUser.value
}

onMounted(() => {
  motionAllowed.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  stepTimer = setInterval(() => {
    if (shouldScroll.value) advance(1)
  }, STEP_MS)
})

onBeforeUnmount(() => {
  if (stepTimer) clearInterval(stepTimer)
  if (manualTimer) clearTimeout(manualTimer)
})
</script>

<template>
  <div class="mt-8">
    <div class="mb-3 flex items-center justify-between gap-3">
      <p class="text-xs text-[color:var(--color-crepuscule-500)]">
        {{ total }} certification{{ total > 1 ? 's' : '' }}
      </p>
      <div
        v-if="isRail"
        class="flex items-center gap-2"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @focusin="focused = true"
        @focusout="focused = false"
      >
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
          @click="goTo(-1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          size="xs"
          aria-label="Certifications suivantes"
          @click="goTo(1)"
        />
      </div>
    </div>

    <!-- ≤ 3 certifications : grille statique, aucune commande. -->
    <ul
      v-if="!isRail"
      class="grid list-none gap-3 p-0 sm:grid-cols-3"
    >
      <li
        v-for="cred in ordered"
        :key="cred.title + (cred.year ?? '')"
        class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3"
      >
        <CoachCertificationCard :credential="cred" />
      </li>
    </ul>

    <!-- > 3 certifications : rail à défilement pas à pas, bouclé, pausable. -->
    <div
      v-else
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
          class="w-[78%] shrink-0 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3 sm:w-[calc((100%-1.5rem)/3)]"
        >
          <CoachCertificationCard :credential="cred" />
        </li>

        <!-- Copie de bouclage : jamais annoncée, jamais focusable. -->
        <li
          v-for="cred in ordered"
          :key="'loop-' + cred.title + (cred.year ?? '')"
          aria-hidden="true"
          class="w-[78%] shrink-0 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3 sm:w-[calc((100%-1.5rem)/3)]"
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
