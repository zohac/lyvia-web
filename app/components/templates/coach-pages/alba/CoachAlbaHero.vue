<script setup lang="ts">
/**
 * CoachAlbaHero — Bloc hero du template Alba (YB.1.2).
 *
 * AD-6 — ce bloc est PROPRE à Alba, et il ne le doit pas par goût mais par
 * contrainte : les deux blocs photo existants sont structurellement
 * incomparables. `CoachHeroProfile` (Signature) porte cinq décorations — deux
 * blobs radiaux, une forme fantôme décalée, un voile chaud, un `accent-ring`
 * animé, plus un filet d'indicateur de défilement ; `CoachEssentielHero`
 * (Aurore) n'en porte aucune, c'est une simple carte `aspect-[4/5]`. Un
 * composant commun devrait être paramétré sur chacune de ces cinq
 * décorations : ce ne serait plus un composant partagé, ce serait un système
 * de mise en page — précisément ce qu'AD-1 refuse. Le dupliqué est donc le
 * PRIX de l'AC « aucun fichier de hero existant modifié », et il est BORNÉ :
 * Alba ne portera jamais de décoration.
 *
 * Le hero est PLAT par conception :
 *   - la photo est à GAUCHE du titre, pas au-dessus ni en fond ;
 *   - le fond est un aplat de surface, jamais une image ;
 *   - aucune strate, aucun overlay, aucun `absolute inset-0` décoratif ;
 *   - `heroImageDisabled` N'EST PAS LU — ce drapeau gouverne le hero immersif
 *     de Visuel (`CoachVisuelHero.vue`), hors périmètre de cette story.
 *
 * Colonnes inversées par rapport à `CoachEssentielHero.vue` : photo en
 * `lg:col-span-5` EN PREMIER, contenu en `lg:col-span-7`.
 */
import type { CoachHeroProps } from '~/features/coach/types/coach-page.types'

const props = defineProps<CoachHeroProps & {
  /**
   * YB.1.2 — la section « Qui suis-je » est-elle rendue ?
   *
   * OBLIGATOIRE, non optionnel : l'ancre secondaire `#qui-suis-je` ne doit
   * exister que si sa cible existe. La conditionner par un prop facultatif la
   * cacherait silencieusement quand l'appelant oublie de le passer — donc on
   * recréerait le lien mort que ce prop existe pour empêcher. En obligatoire,
   * l'oubli est une erreur de compilation.
   *
   * Source de vérité : `show.bio` de `useCoachSectionVisibility`, le MÊME
   * interrupteur que celui qui conditionne l'ancre du header dans
   * `CoachPageAlba.vue`. Un signal, une décision.
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
 * humanisée. Sans ce repli, le champ serait INERT sur Alba alors que les trois
 * autres templates le rendent.
 */
const configuredHeadline = computed(() => props.heroHeadline?.trim() || '')

/**
 * Pillule d'accroche dérivée de la spécialité — AUCUN libellé codé en dur :
 * sans spécialité configurée, la pillule disparaît plutôt que d'afficher un
 * placeholder générique. Même règle que le hero d'Essentiel.
 */
const eyebrowLabel = computed<string | null>(() => {
  const first = (props.specialties ?? []).find(s => !!s?.trim())
  if (!first) return null
  const trimmed = first.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
})

/** Photo du bloc : le PORTRAIT de la coach. Jamais une image de fond. */
const portraitSrc = computed(() => props.profilePhotoUrl?.trim() || null)

/** Initiales de repli — sobres, comme sur Essentiel, pas dramatiques. */
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
    class="relative bg-[color:var(--color-surface-card)] px-6 py-16 sm:px-12 lg:px-20 lg:py-24"
  >
    <div class="mx-auto max-w-7xl">
      <div class="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <!-- GAUCHE — bloc photo d'Alba. Aplat, aucune décoration. -->
        <div
          class="hero-anim lg:col-span-5"
          style="--hero-anim-delay: 0ms"
        >
          <div class="mx-auto w-full max-w-sm">
            <div class="aspect-[4/5] overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)]">
              <NuxtImg
                v-if="portraitSrc"
                :src="portraitSrc"
                :alt="profilePhotoAlt ?? `${displayName}, spécialiste accompagnement ménopause`"
                class="h-full w-full object-cover object-top"
                loading="eager"
                fetchpriority="high"
                sizes="(max-width: 1024px) 90vw, 400px"
                width="400"
                height="500"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-highlight)]"
              >
                <span class="font-serif text-7xl text-[color:var(--color-brand-primary)]/30">
                  {{ initials }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- DROITE — le titre -->
        <div
          class="hero-anim lg:col-span-7"
          style="--hero-anim-delay: 120ms"
        >
          <div
            v-if="eyebrowLabel"
            class="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-4 py-1.5"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5 text-[color:var(--color-brand-accent)]"
            />
            <span class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-brand-secondary)]">
              {{ eyebrowLabel }}
            </span>
          </div>

          <!-- H1 — accroche saisie si elle existe, sinon forme humanisée. -->
          <h1 class="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-[color:var(--color-text-primary)] lg:text-6xl">
            <span
              v-if="configuredHeadline"
              class="block text-[color:var(--color-brand-primary)]"
            >
              {{ configuredHeadline }}
            </span>
            <template v-else>
              <span class="block text-[color:var(--color-brand-secondary)]">Bonjour, je suis</span>
              <span class="block text-[color:var(--color-brand-primary)]">{{ firstName || displayName }}.</span>
            </template>
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-snug text-[color:var(--color-brand-secondary)] lg:text-xl">
            {{ heroDescription || 'Un accompagnement personnalisé en périménopause et ménopause. Alimentation, stress, sommeil, mouvement — une approche complète, à votre rythme.' }}
          </p>

          <div class="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <UButton
              :to="ctaTo"
              color="primary"
              variant="solid"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              data-hero-cta
            >
              Réserver mon appel gratuit
            </UButton>

            <!-- Ancre secondaire : rendue UNIQUEMENT si sa cible existe.
                 Sans ce garde, une coach qui éteint « Qui suis-je » laisse un
                 lien qui ne mène nulle part — l'CTA principal, lui, est un
                 `UButton :to`, donc unaffected. Même source de vérité que le
                 header (`show.bio`). -->
            <a
              v-if="showBio"
              href="#qui-suis-je"
              class="group inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-brand-primary)] underline-offset-4 hover:underline"
            >
              En savoir plus
              <UIcon
                name="i-lucide-arrow-down"
                class="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <!-- Réassurance : les objections levées au bon moment, sous le CTA. -->
          <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Gratuit
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Sans engagement
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              {{ discoveryDurationMinutes }} min
            </span>
          </div>

          <!-- Trust chips — uniquement des données réellement configurées. -->
          <div class="mt-8 flex flex-wrap gap-2">
            <span
              v-if="credentials[0]?.title"
              class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
            >
              <UIcon
                name="i-lucide-graduation-cap"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ credentials[0].title }}
            </span>
            <span
              v-if="city"
              class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
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
            class="mt-4 text-xs font-medium text-[color:var(--color-brand-accent)]"
          >
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
