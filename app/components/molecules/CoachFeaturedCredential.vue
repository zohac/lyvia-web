<script setup lang="ts">
/**
 * CoachFeaturedCredential — plaque de la certification mise en avant (LAB.3).
 *
 * Décision PO du 2026-10-24 : c'est l'élément le plus identifiable de la page.
 * Le logo n'est jamais posé à nu sur un fond sombre (Signature, Alba, Visuel) :
 * il est sur une plaque claire, à 80 px de haut, sinon la marque disparaît et la
 * mise en avant ne se voit pas.
 *
 * Gabarit volontairement COMPACT (`w-fit`) : une plaque qui s'étire sur toute la
 * colonne ressemble à un champ de formulaire, pas à un label.
 *
 * Aucun libellé « vérifiée » ni « première » : Keova ne vérifie rien
 * (`SPEC.md:96`). La plaque dit ce qui est écrit sur la certification, pas un statut.
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'

defineProps<{
  credential: CredentialItem
}>()
</script>

<template>
  <div
    class="inline-flex w-fit max-w-full items-center gap-4 rounded-2xl border border-[color:var(--color-border-subtle)] bg-white py-3 pl-5 pr-6 shadow-[0_2px_12px_rgba(34,29,40,0.07)]"
  >
    <img
      v-if="credential.logoUrl"
      :src="credential.logoUrl"
      alt=""
      class="h-20 w-auto max-w-[10rem] shrink-0 object-contain"
    >
    <span
      v-if="credential.logoUrl"
      aria-hidden="true"
      class="h-12 w-px shrink-0 bg-[color:var(--color-border-subtle)]"
    />
    <div class="flex min-w-0 flex-col">
      <span class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
        {{ credential.title }}
      </span>
      <span
        v-if="formatCredentialMeta(credential)"
        class="mt-0.5 text-xs text-[color:var(--color-crepuscule-500)]"
      >
        {{ formatCredentialMeta(credential) }}
      </span>
    </div>
  </div>
</template>
