<script setup lang="ts">
/**
 * Story 0-35 — Facade lazy pour l'embed d'une vidéo YouTube.
 *
 * Perf : au premier rendu on n'affiche qu'une vignette (poster) + un bouton
 * play. L'iframe YouTube n'est injectée qu'au clic (pattern facade / lite-embed),
 * ce qui évite de charger le player YouTube (~500 ko + cookies) au chargement de
 * la page. Le ratio 16:9 est réservé dès le SSR → aucun CLS (AC-2).
 *
 * RGPD : on utilise `youtube-nocookie.com` et aucun cookie n'est posé avant le
 * clic explicite du visiteur.
 */
import { buildYoutubeEmbedUrl, KEOVA_DEMO_VIDEO_ID } from '~/features/marketing/youtube-embed'

const props = withDefaults(defineProps<{
  /** Identifiant YouTube de la vidéo. */
  videoId?: string
  /** Poster (image locale servie en WebP via NuxtImg). */
  poster: string
  /** Titre de la vidéo (attribut `title` de l'iframe, a11y). */
  title: string
  /** Texte alternatif du poster (SEO + a11y). */
  posterAlt: string
  /** aria-label du bouton play (défaut dérivé du titre). */
  playLabel?: string
}>(), {
  videoId: KEOVA_DEMO_VIDEO_ID
})

// `||` et non `??` : une chaîne vide passerait le `??` et produirait un `aria-label=""`,
// qui écrase l'`alt` interne et laisse le bouton sans nom accessible.
const playButtonLabel = computed(() => props.playLabel?.trim() || `Lire la vidéo : ${props.title}`)

const isPlaying = ref(false)
const playerRef = ref<HTMLIFrameElement | null>(null)

// URL construite au clic uniquement (autoplay pour démarrer la lecture direct).
const embedUrl = computed(() => buildYoutubeEmbedUrl(props.videoId, { autoplay: true }))

/** Lien de repli, également utilisé par le `<noscript>` (aucun JS requis). */
const watchUrl = computed(() => `https://youtu.be/${props.videoId}`)

async function play() {
  isPlaying.value = true
  // Le bouton focalisé est démonté par le `v-if` ; sans ce transfert, le focus retombe
  // sur <body> et le Tab suivant repart du haut de la page (WCAG 2.4.3).
  await nextTick()
  playerRef.value?.focus()
}
</script>

<template>
  <div class="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/60 bg-[var(--color-crepuscule-950)] shadow-xl">
    <!--
      Facade : poster cliquable + bouton play (rendu SSR, réserve le 16:9).

      C'est un vrai `<a href>` et non un `<button>` : amélioration progressive. Sans JS
      (ou sur échec d'hydratation), le lien ouvre la vidéo sur YouTube au lieu de laisser
      un visuel inerte sous un H2 qui promet une démo. Avec JS, `@click.prevent` annule la
      navigation et joue la vidéo en place. Même approche que `lite-youtube-embed`.
      Le `<noscript>` a été écarté : Vue compile son contenu, mais le DOM ne l'expose que
      comme du texte à l'hydratation — source de mismatch.
    -->
    <a
      v-if="!isPlaying"
      :href="watchUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="group absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-accent)]"
      :aria-label="playButtonLabel"
      @click.prevent="play"
    >
      <NuxtImg
        :src="poster"
        format="webp"
        :alt="posterAlt"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        loading="lazy"
        width="1280"
        height="720"
        sizes="100vw sm:640px md:768px lg:896px"
      />
      <!-- Voile sombre pour le contraste du bouton play -->
      <span
        aria-hidden="true"
        class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 transition-opacity duration-300 group-hover:from-black/30 motion-reduce:transition-none"
      />
      <!-- Bouton play -->
      <span
        aria-hidden="true"
        class="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-2xl transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      >
        <UIcon
          name="i-lucide-play"
          class="size-9 translate-x-0.5 text-[var(--color-brand-primary)]"
        />
      </span>
    </a>

    <!-- Player : iframe injectée uniquement après clic -->
    <iframe
      v-if="isPlaying"
      ref="playerRef"
      :src="embedUrl"
      :title="title"
      class="absolute inset-0 h-full w-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      loading="lazy"
      tabindex="0"
    />
  </div>
</template>
