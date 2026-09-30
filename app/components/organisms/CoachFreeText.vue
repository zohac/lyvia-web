<script setup lang="ts">
/**
 * YB.1.1 — Bloc de texte libre, entre bénéfices et « qui suis-je ».
 *
 * Composant NÉ PARTAGÉ (AD-5) : il porte le CONTENU, l'appelant porte
 * l'apparence. Aucun fond, aucune classe de surface, aucun texte de repli
 * codé en dur — chaque template fournit sa surface par un `<div>` enveloppant,
 * comme il le fait déjà pour les bénéfices (AD-9).
 *
 * Le garde de contenu vit ICI, pas dans `useCoachSectionVisibility` : la règle
 * de visibilité est le toggle seul, et ce composant rend rien quand titre et
 * paragraphes sont vides. Le paramètre censé contourner ce garde
 * (`_previewMode`) est un no-op et ne sera pas lu ici.
 *
 * Texte PLAIN : paragraphes par interpolation Vue avec `whitespace-pre-line`,
 * donc jamais de HTML produit et jamais d'assainisseur requis (AD-7). Aucun
 * `v-html` sur ce chemin, volontairement.
 */
import { computed } from 'vue'

import { hasCoachFreeTextContent } from '~/features/coach/domain/coach-page-editor'
import type { FreeTextJson } from '~/features/seo/api/public-provider-profile.contract'

const props = defineProps<{
  freeText: FreeTextJson | null | undefined
}>()

const paragraphs = computed(() =>
  (props.freeText?.paragraphs ?? []).filter(
    (paragraph): paragraph is string =>
      typeof paragraph === 'string' && paragraph.trim().length > 0
  )
)

const title = computed(() => props.freeText?.title?.trim() ?? '')

/**
 * Garde de contenu : un bloc vide n'est pas un bloc. Règle partagée avec les
 * trois templates, dont le `<div>` enveloppant en dépend pour ne pas laisser de
 * bande de surface vide quand le bloc est allumé mais sans texte.
 */
const hasContent = computed(() => hasCoachFreeTextContent(props.freeText))
</script>

<template>
  <div
    v-if="hasContent"
    class="mx-auto max-w-3xl"
  >
    <h2
      v-if="title"
      class="font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl"
    >
      {{ title }}
    </h2>
    <div
      v-if="paragraphs.length > 0"
      class="space-y-6"
      :class="title ? 'mt-6' : ''"
    >
      <p
        v-for="(paragraph, index) in paragraphs"
        :key="index"
        class="whitespace-pre-line text-lg leading-relaxed text-[color:var(--color-crepuscule-700)]"
      >
        {{ paragraph }}
      </p>
    </div>
  </div>
</template>
