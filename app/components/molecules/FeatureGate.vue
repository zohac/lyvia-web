<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { PlanFeatureCode } from '~/features/plans/domain/feature-codes'
import {
  FEATURE_GATE_CTA_LABEL,
  KEOVA_CONTACT_MAILTO,
  featureGateLockTitle
} from '~/features/plans/domain/feature-gate-copy'
import { useFeatureGate } from '~/features/plans/useFeatureGate'

/**
 * Story 18.2 — Enveloppe une section réservée à un plan supérieur.
 *
 * 🚨 Ce composant vit dans `app/components/molecules/` et NON dans
 * `app/features/plans/` : les `@source` de `dashboard.css` ne couvrent que
 * `app/components/**`, `app/layouts/**` et `app/pages/**`. Un `.vue` placé sous
 * `app/features/` verrait ses classes Tailwind purgées silencieusement — il
 * fonctionnerait en apparence, sans aucun style au runtime.
 *
 * Usage (import explicite, pattern maison `FormControl`/`SystemAlert`) :
 *   import FeatureGate from '~/components/molecules/FeatureGate.vue'
 *   <FeatureGate feature="white_label_branding"> … </FeatureGate>
 *
 * La pose sur les sections réelles (éditeur coach-page, compte) est la
 * Story 18.3b — aucune surface n'est enveloppée ici.
 */
const props = defineProps<{ feature: PlanFeatureCode }>()

const { status, hasFeature, ensureLoaded } = useFeatureGate()

// Le composant déclenche lui-même le chargement : une section enveloppée est
// autonome, aucune page n'a à amorcer le gate.
//
// 🚨 Story 18.2 (CR) — le watcher, et pas un simple appel au montage, tient la
// seconde moitié de l'AC #6 (« ou `invalidate()` est appelé → tous les
// `<FeatureGate>` réévaluent »). `invalidate()` repasse `status` à `'unknown'`,
// état dans lequel le template ne rend NI le slot NI le lock : sans relance,
// un gate déjà monté resterait blanc jusqu'au prochain remount.
watch(
  status,
  (value) => {
    if (value === 'unknown') void ensureLoaded()
  },
  { immediate: true }
)

// 🚨 Story 18.3b (CR, décision Simon) — le watcher ci-dessus ne relance QUE sur
// `'unknown'` : un gate monté alors que le state porte déjà `'error'` (tentative
// échouée plus tôt dans la session) restait verrouillé DÉFINITIVEMENT, y compris
// pour une coach Premium, qui se voyait proposer d'acheter le plan qu'elle a
// déjà. Le docblock d'`ensureLoaded` promettait « un remount retente » — c'était
// faux tant que ce crochet n'existait pas, `'error'` n'étant jamais `'unknown'`.
//
// `onMounted` et pas le watcher : un `if (value !== 'ready')` dans le watcher
// retenterait aussi sur la transition `'unknown' → 'error'` de la tentative en
// cours, soit un second appel immédiat au même échec.
onMounted(() => {
  if (status.value === 'error') void ensureLoaded()
})

const unlocked = computed(() => hasFeature(props.feature))
const lockTitle = computed(() => featureGateLockTitle(props.feature))
</script>

<template>
  <!--
    `status === 'unknown'` → on ne rend RIEN : ni le contenu (fuite d'une
    section premium), ni le lock (flash visuel disgracieux avant résolution).
    La fenêtre est de quelques dizaines de ms, et nulle après le premier
    chargement grâce au cache de session.

    `status === 'error'` retombe sur le lock : deny par défaut.
  -->
  <template v-if="status !== 'unknown'">
    <slot v-if="unlocked" />

    <!--
      Le contenu premium est REMPLACÉ, pas flouté : rien de focusable n'est
      caché derrière un overlay, donc rien à neutraliser via `inert`/`aria-hidden`.
    -->
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-6 py-16 text-center"
    >
      <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)]">
        <UIcon
          name="i-lucide-lock"
          class="size-7 text-[color:var(--color-text-muted)]"
        />
      </div>
      <h3 class="font-[family-name:var(--font-serif)] text-lg font-bold italic text-[color:var(--color-text-primary)]">
        {{ lockTitle }}
      </h3>
      <a
        :href="KEOVA_CONTACT_MAILTO"
        class="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-subtle)] px-6 py-3 text-sm font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:border-[color:var(--color-crepuscule-400)] hover:text-[color:var(--color-brand-primary)]"
      >
        <UIcon
          name="lucide:mail"
          size="16"
        />
        {{ FEATURE_GATE_CTA_LABEL }}
      </a>
    </div>
  </template>
</template>
