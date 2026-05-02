<script setup lang="ts">
/**
 * CoachPagePreviewPanel (Story 0-28) — live preview panel mounted on
 * `/provider/coach-page` in two contexts:
 *
 *   - Desktop ≥ 1280px : a sticky `<aside>` to the right of the editor
 *   - Mobile  < 1280px : the body of a `<USlideover>` opened from a FAB
 *
 * The panel is purely presentational. It receives the resolved `coachProfile`
 * and `tenant` (built upstream by `useCoachPagePreviewProfile`), the device
 * mode + close handler (built upstream by `useCoachPagePreviewState`), and
 * the consultation plans / programs arrays (stubbed `[]` by default — the
 * caller may pass real data fetched on the page).
 *
 * Composition:
 *   - Header toolbar (sticky inside the panel) : icon + label + viewport
 *     sub-label + device toggle pills + optional close button
 *   - Content area with its own scroll (the parent provides the height)
 *   - Frame wrapper (mobile mockup vs full-width)
 *   - `<component :is="resolvedTemplate" :preview-mode="true" ...>` mounted
 *     inside an `inert` container so external CTAs / form submits are
 *     globally neutralised (HTML-native, no per-button wrapping).
 */
import { computed, markRaw, shallowRef, watch } from 'vue'
import type { Component } from 'vue'

import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { useCoachPageTemplate } from '~/composables/useCoachPageTemplate'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import PublicHeader from '~/components/organisms/PublicHeader.vue'
import type { PublicHeaderState } from '~/features/public/state/public-header.state'

import type { PreviewDevice } from '~/features/coach/useCoachPagePreviewState'

const props = defineProps<{
  coachProfile: PublicProviderProfile | null
  tenant: PublicTenantResponse | null
  publicPrograms?: PublicProgramListItem[]
  consultationPlans?: ConsultationPricePlan[]
  device: PreviewDevice
  /** Whether the close affordance is rendered in the panel header. */
  showClose?: boolean
  /** Optional aria label override (`Aperçu` by default). */
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:device': [value: PreviewDevice]
  'close': []
}>()

// Story 0-28 round terrain Simon — la preview doit refléter le template
// sélectionné par le provider (signature / essentiel / futurs templates).
// On NE PEUT PAS appeler `useCoachPageTemplate()` dans un computed à chaque
// changement de templateCode : ça recréerait un nouveau `defineAsyncComponent`
// à chaque tick, et Vue se perd dans le lifecycle (le `<component :is>`
// reste bloqué sur `<!---->` après un switch).
//
// Fix : mémoriser les async components par code dans une `Map` interne au
// composant, et utiliser un `watch` pour swap le `shallowRef` quand le
// templateCode change. `markRaw` pour empêcher Vue de proxy-iser le
// composant (les async components doivent rester non-réactifs).
const templateCache = new Map<string, Component>()

function resolveTemplate(code: string | null | undefined): Component {
  const safeCode = code || 'essentiel'
  let cached = templateCache.get(safeCode)
  if (!cached) {
    cached = markRaw(useCoachPageTemplate(safeCode))
    templateCache.set(safeCode, cached)
  }
  return cached
}

const resolvedTemplate = shallowRef<Component>(resolveTemplate(props.coachProfile?.templateCode))

watch(
  () => props.coachProfile?.templateCode,
  (next) => {
    resolvedTemplate.value = resolveTemplate(next)
  }
)

const programs = computed<PublicProgramListItem[]>(() => props.publicPrograms ?? [])
const plans = computed<ConsultationPricePlan[]>(() => props.consultationPlans ?? [])

const deviceSubLabel = computed(() =>
  props.device === 'mobile' ? 'Mobile · 375px' : 'Desktop · 1280px+'
)

// Story 0-28 brief — Frame fine sans skeuomorphisme phone (Q2 retenu).
// Mobile mockup = max-w-[375px] + rounded-2xl + border-emphasis + shadow-card,
// le tout teinté violet via les tokens existants. Pas de bezel ni de notch.
const frameClasses = computed(() =>
  props.device === 'mobile'
    ? 'mx-auto max-w-[375px] overflow-hidden rounded-2xl border border-[color:var(--color-border-emphasis)] shadow-card bg-[color:var(--color-surface-card)]'
    : 'overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]'
)

// Story 0-28 round terrain Simon (2026-05-02) — la preview rend le VRAI
// `PublicHeader` (dock-style flottant) avec les `overrides` calculés depuis
// le draft profile. C'est le même composant que sur la page publique
// réelle, donc tout changement visuel du header se propage à la preview
// sans effort. La preview override `variant: 'white-label'` pour faire
// remonter le logo provider (sur la plateforme `coach`, le logo affiché
// est Keova par design — la preview montre "ce que verront ses clientes").
const previewHeaderOverrides = computed<Partial<PublicHeaderState>>(() => {
  if (!props.coachProfile || !props.tenant) return {}
  // Build nav links from visible sections (mirrors /coach/[slug]/index.vue)
  const { show } = useCoachSectionVisibility(() => props.coachProfile, { previewMode: () => true })
  const navLinks: Array<{ label: string, href: string }> = []
  if (show.benefits.value || show.pillars.value || show.howItWorks.value) {
    navLinks.push({ label: 'Accompagnement', href: '#accompagnement' })
  }
  navLinks.push({ label: 'Tarifs', href: '#tarifs' })
  if (show.testimonials.value) navLinks.push({ label: 'Témoignages', href: '#temoignages' })
  if (show.bio.value) navLinks.push({ label: 'Qui suis-je', href: '#qui-suis-je' })

  return {
    variant: 'white-label',
    layoutStyle: 'dock',
    brandLabel: props.tenant.brand.displayName,
    brandLogoSrc: props.coachProfile.logoUrl ?? undefined,
    brandTo: '#',
    showBrandIcon: true,
    navLinks,
    loginLabel: 'Se connecter',
    loginTo: '#',
    ctaLabel: 'Réserver',
    ctaTo: '#'
  }
})

// Story 0-28 round terrain Simon — desktop preview = vue réduite zoom-out.
// Le panel desktop fait ~50% du viewport (grid 50/50), trop étroit pour
// rendre le template à sa taille naturelle. On applique un `zoom: 0.45`
// pour montrer la page entière en miniature : Sophie voit la silhouette
// globale (sections, hiérarchie, espacements) — la lisibilité fine n'est
// pas l'objectif d'une preview, l'objectif est la sensation visuelle.
//
// Round terrain 2 (2026-05-02) — passé de 0.6 à 0.45 (Simon : "augmente
// encore le zoom out"). À 0.45, le rendu desktop tient confortablement
// dans une largeur de panel ~500px tout en gardant le layout xl: actif
// (les media queries restent calculées sur le viewport principal).
//
// `zoom` (CSS) réduit à la fois le rendu visuel ET le layout (contrairement
// à `transform: scale()` qui ne change pas la hauteur layout). Supporté
// nativement Chrome/Safari/Edge ; Firefox depuis 126 (2024). Fallback
// sur Firefox <126 = no-zoom (graceful degradation, layout étroit
// acceptable temporairement).
//
// Mobile : pas de zoom (la frame max-w-[375px] est déjà la cible).
const contentZoomStyle = computed(() =>
  props.device === 'desktop' ? { zoom: 0.45 } : undefined
)

function selectDevice(next: PreviewDevice): void {
  if (next !== props.device) emit('update:device', next)
}
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col bg-[color:var(--color-surface-card)]"
    :aria-label="ariaLabel ?? 'Aperçu'"
  >
    <!-- ── Toolbar (sticky inside the panel scroll) ── -->
    <header
      class="flex items-center justify-between gap-3 border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-4 py-3"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)]/10"
        >
          <UIcon
            name="i-lucide-eye"
            class="size-4 text-[color:var(--color-brand-primary)]"
          />
        </span>
        <div class="min-w-0 leading-tight">
          <p
            class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-primary)]"
          >
            Aperçu
          </p>
          <p
            class="truncate text-xs text-[color:var(--color-text-muted)]"
            data-testid="coach-preview-device-sublabel"
          >
            {{ deviceSubLabel }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <!-- Device toggle pills (Q2 brief — Tooling voice) -->
        <div
          role="group"
          aria-label="Aperçu : choix d'appareil"
          class="flex items-center rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] p-0.5"
        >
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="device === 'desktop'
              ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft'
              : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'"
            :aria-pressed="device === 'desktop'"
            data-testid="coach-preview-device-desktop"
            @click="selectDevice('desktop')"
          >
            <UIcon
              name="i-lucide-monitor"
              class="size-3.5"
            />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="device === 'mobile'
              ? 'bg-[color:var(--color-brand-primary)] text-white shadow-soft'
              : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'"
            :aria-pressed="device === 'mobile'"
            data-testid="coach-preview-device-mobile"
            @click="selectDevice('mobile')"
          >
            <UIcon
              name="i-lucide-smartphone"
              class="size-3.5"
            />
            <span>Mobile</span>
          </button>
        </div>

        <UButton
          v-if="showClose"
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-x"
          aria-label="Fermer l'aperçu"
          data-testid="coach-preview-close"
          @click="emit('close')"
        />
      </div>
    </header>

    <!-- ── Scrollable content area ── -->
    <div
      class="flex-1 overflow-y-auto bg-[color:var(--color-surface-page)] p-4"
      data-testid="coach-preview-scroll-area"
    >
      <!-- `inert` neutralises every link, button, form submit inside the
        preview tree natively (no per-CTA wrapper, no JS guard). Sophie
        cannot accidentally trigger booking/checkout/lead-magnet flows
        from her own preview. -->
      <div
        :class="frameClasses"
        :data-preview-device="device"
        inert
      >
        <div
          :style="contentZoomStyle"
          data-testid="coach-preview-content-zoom"
        >
          <template v-if="coachProfile && tenant">
            <!-- Story 0-28 round terrain Simon — on monte le VRAI
              `PublicHeader` (dock-style flottant) avec ses overrides
              locales pour ne pas muter le state global Nuxt. Même
              composant que sur la vraie page publique → look identique. -->
            <PublicHeader
              :overrides="previewHeaderOverrides"
              data-testid="coach-preview-header"
            />

            <component
              :is="resolvedTemplate"
              :tenant="tenant"
              cta-to="#"
              :coach-profile="coachProfile"
              :public-programs="programs"
              :consultation-plans="plans"
              :is-authenticated="false"
              :current-path="`/coach/${tenant.slug}`"
              :preview-mode="true"
            />
          </template>
          <USkeleton
            v-else
            class="h-full min-h-[400px] w-full rounded-2xl"
            aria-label="Chargement de l'aperçu"
          />
        </div>
      </div>
    </div>
  </aside>
</template>
