<script setup lang="ts">
/**
 * CoachCertificationsRail — liste de réassurance des certifications (LAB.3).
 *
 * Amendement UX du 2026-10-24 : un rail horizontal est autorisé **sous** la
 * preuve principale (le hero), jamais pour la porter. Conditions tenues ici :
 *
 * - toutes les cartes sont dans le DOM (`v-for` sur la liste complète, aucun
 *   clone, aucun chargement paresseux) : le SEO et le lecteur d'écran voient tout ;
 * - le total est affiché, et la position suit le défilement (`aria-live`) ;
 * - la carte mise en avant est **la première** et n'est jamais masquée ;
 * - clavier : la piste est focusable et se parcourt aux flèches ; les boutons
 *   précèdent/suivent suivent l'ordre de lecture ;
 * - aucun autoplay, aucune boucle ; `prefers-reduced-motion` supprime l'animation.
 *
 * 3 cartes visibles en desktop, 1 + amorce en mobile (la 2e dépasse pour montrer
 * qu'on peut faire défiler).
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'
import { orderCredentialsForDisplay } from '~/features/coach/domain/featured-credential'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

/** Mise en avant d'abord, puis l'ordre déclaré (règle testée dans le domaine). */
const ordered = computed(() => orderCredentialsForDisplay(props.credentials))

const total = computed(() => ordered.value.length)
const current = ref(1)

const track = ref<HTMLElement | null>(null)

function scrollByPage(direction: 1 | -1) {
  const element = track.value
  if (!element) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollBy({
    left: direction * element.clientWidth * 0.9,
    behavior: reduceMotion ? 'auto' : 'smooth'
  })
}

function onScroll() {
  const element = track.value
  const first = element?.firstElementChild as HTMLElement | null
  if (!element || !first) return
  const step = first.offsetWidth + 12
  const index = Math.round(element.scrollLeft / step) + 1
  current.value = Math.min(total.value, Math.max(1, index))
}
</script>

<template>
  <div class="mt-8">
    <ul
      ref="track"
      class="flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-2"
      tabindex="0"
      :aria-label="`Certifications : ${total}`"
      @scroll.passive="onScroll"
    >
      <li
        v-for="cred in ordered"
        :key="cred.title + (cred.year ?? '')"
        class="flex min-w-[78%] shrink-0 snap-start items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3 sm:min-w-[30%]"
      >
        <img
          v-if="cred.logoUrl"
          :src="cred.logoUrl"
          :alt="cred.institution ? cred.institution + ' — ' + cred.title : cred.title"
          class="h-10 w-auto max-w-[6rem] object-contain"
        >
        <div class="flex flex-col">
          <span class="text-sm font-medium text-[color:var(--color-text-primary)]">
            {{ cred.title }}
          </span>
          <span
            v-if="formatCredentialMeta(cred)"
            class="text-xs text-[color:var(--color-brand-secondary)]"
          >
            {{ formatCredentialMeta(cred) }}
          </span>
        </div>
      </li>
    </ul>

    <div
      v-if="total > 3"
      class="mt-2 flex items-center justify-between gap-3"
    >
      <p
        class="text-xs text-[color:var(--color-brand-secondary)]"
        aria-live="polite"
      >
        {{ current }} / {{ total }} certifications
      </p>
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Certifications précédentes"
          @click="scrollByPage(-1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Certifications suivantes"
          @click="scrollByPage(1)"
        />
      </div>
    </div>
  </div>
</template>
