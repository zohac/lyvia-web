<script setup lang="ts">
/**
 * CoachFeaturedCredential — plaque de la certification mise en avant (LAB.3).
 *
 * Décision PO du 2026-10-24 : c'est l'élément le plus identifiable de la page.
 * Le logo n'est jamais posé à nu sur un fond sombre (Signature, Alba, Visuel) :
 * il est sur une plaque claire, à 56 px de haut minimum, sinon la marque
 * disparaît et la mise en avant ne se voit pas.
 *
 * Aucun libellé « vérifiée » ni « première » : Keova ne vérifie rien
 * (`SPEC.md:96`). La plaque dit ce qui est écrit sur la certification, pas un
 * statut.
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'

defineProps<{
  credential: CredentialItem
}>()
</script>

<template>
  <div
    class="inline-flex max-w-full items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5"
  >
    <img
      v-if="credential.logoUrl"
      :src="credential.logoUrl"
      alt=""
      class="h-14 w-auto max-w-[9rem] object-contain"
    >
    <div class="flex min-w-0 flex-col">
      <span class="truncate text-sm font-semibold text-[color:var(--color-brand-primary)]">
        {{ credential.title }}
      </span>
      <span
        v-if="formatCredentialMeta(credential)"
        class="truncate text-xs text-[color:var(--color-brand-secondary)]"
      >
        {{ formatCredentialMeta(credential) }}
      </span>
    </div>
  </div>
</template>
