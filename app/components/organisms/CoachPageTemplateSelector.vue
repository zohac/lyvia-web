<script setup lang="ts">
/**
 * CPD.10 — sélecteur de template extrait de `coach-page.vue`.
 *
 * Le verrou est **déjà calculé** par la coquille (`templateCards`, une fois par
 * carte, via `isTemplateLocked` et `resolvePremiumTemplatesAccess`) : ce
 * composant ne le re-dérive pas. Il le consomme, et il échoue FERMÉ au clic —
 * un template verrouillé n'émet jamais `select`, même par appel programmatique.
 *
 * Story 18.3b — la carte verrouillée porte un nom accessible construit sur la
 * copy 18.2 : `:disabled` la retire de l'ordre de tabulation, donc la pastille
 * « Premium » ne serait jamais lue sans lui.
 */
import { FEATURE_COACH_PAGE_PREMIUM_TEMPLATES } from '~/features/plans/domain/feature-codes'
import { featureGateLockTitle } from '~/features/plans/domain/feature-gate-copy'
import {
  isTemplateLocked,
  PREMIUM_TEMPLATE_BADGE_LABEL
} from '~/features/plans/domain/template-lock'

const props = defineProps<{
  templates: Array<{ id: string, name: string, description?: string | null, previewImageUrl?: string | null, sectionsAvailable?: readonly string[] | null, locked?: boolean, code?: string | null }>
  selectedTemplateId: string | null
  saving?: boolean
  hasPremiumTemplates?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()

// Chemin nominal : la carte est déjà décorée par la coquille (`locked`, calculé
// une fois via `isTemplateLocked` + `resolvePremiumTemplatesAccess`). Le repli
// reste la MÊME règle, en échec FERMÉ : sans information, on verrouille.
function isLocked(tmpl: { locked?: boolean, code?: string | null }): boolean {
  if (typeof tmpl.locked === 'boolean') return tmpl.locked
  return isTemplateLocked({ code: tmpl.code ?? '' }, props.hasPremiumTemplates === true)
}

function onClick(tmpl: { id: string, locked?: boolean, code?: string | null }) {
  if (props.saving || isLocked(tmpl)) return
  emit('select', tmpl.id)
}
</script>

<template>
  <section
    id="section-template"
    class="mb-10"
  >
    <h2 class="mb-4 text-lg font-semibold text-[color:var(--color-text-primary)]">
      Template
    </h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!--
        Story 18.3b — verrouillage CARTE PAR CARTE (et non un <FeatureGate> de
        section) : le template Standard reste toujours sélectionnable, exigence
        PRD. `tmpl.locked` est calculé une seule fois par carte dans la coquille.
      -->
      <button
        v-for="tmpl in templates"
        :key="tmpl.id"
        type="button"
        class="relative rounded-xl border-2 p-5 text-left transition-all"
        :class="[
          tmpl.id === selectedTemplateId
            ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-card)] shadow-md'
            : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)]',
          // 🚨 CR 18.3b — le survol n'est proposé QUE si la carte est
          // cliquable : `:disabled` ne coupe pas `:hover` (les pointer
          // events restent actifs), donc une carte verrouillée s'illuminait
          // en accent sous le curseur tout en affichant `cursor-not-allowed`.
          tmpl.id !== selectedTemplateId && !isLocked(tmpl)
            ? 'hover:border-[color:var(--color-brand-accent)]'
            : '',
          isLocked(tmpl) ? 'cursor-not-allowed opacity-60' : ''
        ]"
        :disabled="saving || isLocked(tmpl)"
        :aria-pressed="tmpl.id === selectedTemplateId"
        :aria-label="isLocked(tmpl)
          ? `${tmpl.name} — ${PREMIUM_TEMPLATE_BADGE_LABEL} : ${featureGateLockTitle(FEATURE_COACH_PAGE_PREMIUM_TEMPLATES)}`
          : undefined"
        :data-testid="isLocked(tmpl) ? 'coach-template-card-locked' : 'coach-template-card'"
        @click="onClick(tmpl)"
      >
        <!--
          Pastille de verrouillage — coin haut-droit, à un décalage DISTINCT du
          check de sélection (`right-3 top-3`) : un template verrouillé n'est
          jamais le template sélectionné, les deux ne coexistent donc jamais,
          mais les positions restent séparées pour la lisibilité du code.
        -->
        <span
          v-if="isLocked(tmpl)"
          class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-highlight)] px-2.5 py-1 text-xs font-medium text-[color:var(--color-text-muted)]"
          data-testid="coach-template-premium-badge"
        >
          <UIcon
            name="i-lucide-lock"
            class="size-3"
          />
          {{ PREMIUM_TEMPLATE_BADGE_LABEL }}
        </span>
        <div
          v-if="tmpl.id === selectedTemplateId"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-5 text-[color:var(--color-brand-primary)]"
          />
        </div>
        <NuxtImg
          v-if="tmpl.previewImageUrl"
          :src="tmpl.previewImageUrl"
          :alt="`Aperçu du template ${tmpl.name}`"
          class="mb-3 aspect-[16/9] w-full rounded-lg object-cover"
          width="320"
          height="180"
          loading="lazy"
        />
        <h3 class="font-semibold text-[color:var(--color-text-primary)]">
          {{ tmpl.name }}
        </h3>
        <p
          v-if="tmpl.description"
          class="mt-1 text-sm text-[color:var(--color-brand-secondary)]"
        >
          {{ tmpl.description }}
        </p>
        <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
          {{ (tmpl.sectionsAvailable ?? []).length }} sections disponibles
        </p>
      </button>
    </div>
  </section>
</template>
