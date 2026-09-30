<script setup lang="ts">
/**
 * CoachAlbaHero — Hero immersif du template Alba (YB.1.2).
 *
 * Révision de design du 2026-09-30 (décision PO) : le premier rendu — un split
 * clair, portrait encadré sur fond blanc — était jugé trop plat et trop éloigné
 * de l'ambiance des autres templates. Alba reprend donc le parti pris de
 * `CoachVisuelHero` (fond sombre, texte clair, CTA accent) mais SANS image de
 * fond : le portrait de la praticienne reste l'élément principal, à GAUCHE.
 *
 * Ambiance « heure dorée » (2e révision, 2026-09-30) : le quasi-noir
 * `crepuscule-950` pesait trop pour une page ménopause. Le fond glisse
 * maintenant d'un violet profond (`crepuscule-800`) vers un prune chaud, avec
 * un halo sunset en bas à droite et un halo violet en haut à gauche. Les halos
 * sont FIGÉS (violet + sunset de la marque) pour que l'ambiance reste chaude
 * même quand la coach a une couleur de marque froide ; le CTA, lui, garde
 * l'accent du tenant.
 *
 * Ce bloc est PROPRE à Alba (AD-6) : il ne modifie ni `CoachHeroProfile`
 * (Signature) ni `CoachEssentielHero` (Aurore).
 *
 * Invariants conservés (AC 1 / AD-6) :
 *   - la photo est à GAUCHE du titre (`lg:col-span-5` avant `lg:col-span-7`) ;
 *   - AUCUNE image de fond : on ne lit jamais `heroPhotoUrl` ni
 *     `heroImageDisabled` (drapeaux du hero immersif de Visuel) ;
 *   - la profondeur vient de dégradés CSS de marque, pas d'une photo.
 */
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'

const props = defineProps<CoachHeroProps & {
  /**
   * YB.1.2 — la section « Qui suis-je » est-elle rendue ?
   *
   * OBLIGATOIRE, non optionnel : l'ancre secondaire `#qui-suis-je` ne doit
   * exister que si sa cible existe. Source de vérité : `show.bio` de
   * `useCoachSectionVisibility`, le MÊME interrupteur que celui qui conditionne
   * l'ancre du header dans `CoachPageAlba.vue`. Un signal, une décision.
   */
  showBio: boolean
}>()

/** Prénom seul, pour un H1 humanisé (« Bonjour, je suis X. »). */
const firstName = computed(() => {
  const name = (props.displayName ?? '').trim()
  if (!name) return ''
  return name.split(/\s+/)[0] ?? name
})

/**
 * Accroche saisie par la coach (« Accroche / Sous-titre principal » de
 * l'éditeur). Elle porte le H1 quand elle existe ; sinon le H1 garde sa forme
 * humanisée.
 */
const configuredHeadline = computed(() => props.heroHeadline?.trim() || '')

/**
 * Pillule d'accroche dérivée de la spécialité — AUCUN libellé codé en dur :
 * sans spécialité configurée, la pillule disparaît plutôt que d'afficher un
 * placeholder générique.
 */
const eyebrowLabel = computed<string | null>(() => {
  const first = (props.specialties ?? []).find(s => !!s?.trim())
  if (!first) return null
  const trimmed = first.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
})

/** Portrait de la coach — jamais une image de fond. */
const portraitSrc = computed(() => props.profilePhotoUrl?.trim() || null)

/** Initiales de repli lorsque la coach n'a pas encore de portrait. */
const initials = computed(() => {
  const name = props.displayName || ''
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
})
</script>

<template>
  <section
    id="hero"
    class="relative isolate overflow-hidden bg-[color:var(--color-crepuscule-900)] px-6 pb-16 pt-28 text-[color:var(--color-crepuscule-50)] sm:px-12 sm:pb-20 sm:pt-32 lg:px-20 lg:pb-28 lg:pt-36"
  >
    <!-- Ambiance « heure dorée » : ciel violet qui s'éclaircit en haut, lueur
         d'horizon chaude en bas, halo violet adouci en haut à gauche. Aucune image. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-[color:var(--color-crepuscule-700)] via-[color:var(--color-crepuscule-800)] to-[color:var(--color-crepuscule-900)]" />
      <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color-mix(in_srgb,var(--color-sunset-500)_30%,transparent)] via-[color-mix(in_srgb,var(--color-sunset-700)_10%,transparent)] to-transparent" />
      <div class="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-[color:var(--color-crepuscule-500)]/25 blur-[100px]" />
    </div>

    <div class="mx-auto max-w-7xl">
      <div class="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
        <!-- GAUCHE — le portrait -->
        <div
          class="hero-anim lg:col-span-5"
          style="--hero-anim-delay: 0ms"
        >
          <div class="relative mx-auto w-full max-w-[16rem] sm:max-w-sm lg:max-w-md">
            <!-- Cadre décalé, en retrait : donne de la profondeur sans photo. -->
            <div
              aria-hidden="true"
              class="absolute -bottom-4 -right-4 h-full w-full rounded-[2rem] border border-white/10 bg-white/[0.03]"
            />
            <div class="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/50 ring-1 ring-white/15">
              <NuxtImg
                v-if="portraitSrc"
                :src="portraitSrc"
                :alt="profilePhotoAlt ?? `${displayName}, spécialiste accompagnement ménopause`"
                class="h-full w-full object-cover object-top"
                loading="eager"
                fetchpriority="high"
                sizes="(max-width: 1024px) 85vw, 440px"
                width="800"
                height="1000"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-white/5"
              >
                <span class="font-serif text-7xl text-[color:var(--color-crepuscule-300)]">
                  {{ initials }}
                </span>
              </div>
              <!-- Léger voile bas : rattache le portrait au fond. -->
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
              />
            </div>
          </div>
        </div>

        <!-- DROITE — le propos -->
        <div
          class="hero-anim lg:col-span-7"
          style="--hero-anim-delay: 120ms"
        >
          <span
            v-if="eyebrowLabel"
            class="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-crepuscule-50)] backdrop-blur-md"
          >
            <span class="size-2 rounded-full bg-[color:var(--color-brand-accent)]" />
            {{ eyebrowLabel }}
          </span>

          <!-- H1 — accroche saisie si elle existe, sinon forme humanisée. -->
          <h1 class="mt-6 font-serif text-4xl leading-[1.06] tracking-tight text-[color:var(--color-crepuscule-50)] text-balance sm:text-5xl lg:text-6xl">
            <span
              v-if="configuredHeadline"
              class="block"
            >
              {{ configuredHeadline }}
            </span>
            <template v-else>
              <span class="block text-[color:var(--color-crepuscule-50)]/60">Bonjour, je suis</span>
              <span class="block">{{ firstName || displayName }}.</span>
            </template>
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-crepuscule-50)]/75 lg:text-xl">
            {{ heroDescription || 'Un accompagnement personnalisé en périménopause et ménopause. Alimentation, stress, sommeil, mouvement : une approche complète, à votre rythme.' }}
          </p>

          <div class="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
            <UButton
              :to="ctaTo"
              color="secondary"
              variant="solid"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="shadow-xl shadow-black/30"
              data-hero-cta
            >
              Réserver mon appel gratuit
            </UButton>

            <!-- Ancre secondaire : rendue UNIQUEMENT si sa cible existe. -->
            <a
              v-if="showBio"
              href="#qui-suis-je"
              class="group inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-crepuscule-50)]/80 underline-offset-4 transition-colors hover:text-[color:var(--color-crepuscule-50)] hover:underline"
            >
              En savoir plus
              <UIcon
                name="i-lucide-arrow-down"
                class="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <!-- Réassurance : les objections levées au bon moment, sous le CTA. -->
          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-[color:var(--color-crepuscule-50)]/70">
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              Gratuit
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              Sans engagement
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ discoveryDurationMinutes }} min
            </span>
          </div>

          <!-- Chips — uniquement des données réellement configurées. -->
          <div class="mt-8 flex flex-wrap gap-2">
            <span
              v-if="credentials[0]?.title"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-[color:var(--color-crepuscule-50)]/80 backdrop-blur-sm"
            >
              <UIcon
                name="i-lucide-graduation-cap"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ credentials[0].title }}
            </span>
            <span
              v-if="city"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-[color:var(--color-crepuscule-50)]/80 backdrop-blur-sm"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ city }}
            </span>
          </div>

          <p
            v-if="urgencyText"
            class="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--color-crepuscule-50)]/90"
          >
            <span class="size-2 rounded-full bg-[color:var(--color-brand-accent)] animate-pulse" />
            {{ urgencyText }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * hero-anim — décalage de BLOC sur deux éléments seulement (photo puis
 * contenu). SSR-safe : les éléments sont visibles par défaut, l'animation ne
 * démarre qu'au montage. `prefers-reduced-motion` neutralise l'ensemble.
 */
.hero-anim {
  animation: hero-fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--hero-anim-delay, 0ms);
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-anim {
    animation: none;
  }
}
</style>
