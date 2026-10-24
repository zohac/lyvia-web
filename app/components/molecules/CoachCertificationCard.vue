<script setup lang="ts">
/**
 * CoachCertificationCard — une carte de certification (LAB.3).
 *
 * Logo officiel à gauche quand il existe, icône par défaut sinon (toutes les
 * certifications n'ont pas de logo, et une carte vide se lit comme un bug).
 * Textes à droite : intitulé, puis `organisme · année`.
 *
 * Aucun badge « vérifiée » : Keova ne vérifie rien (`SPEC.md:96`).
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'

const props = defineProps<{
  credential: CredentialItem
  /** Copie de bouclage : le logo ne doit pas être annoncé deux fois. */
  decorative?: boolean
}>()

const meta = computed(() => formatCredentialMeta(props.credential))
</script>

<template>
  <span class="flex min-w-0 items-center gap-3">
    <span
      class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-surface-page)]"
    >
      <img
        v-if="credential.logoUrl"
        :src="credential.logoUrl"
        :alt="decorative ? '' : (credential.institution ? credential.institution + ' — ' + credential.title : credential.title)"
        class="size-10 object-contain"
      >
      <UIcon
        v-else
        name="i-lucide-award"
        class="size-5 text-[color:var(--color-brand-primary)]"
      />
    </span>
    <span class="flex min-w-0 flex-col">
      <span class="line-clamp-2 text-sm font-medium leading-tight text-[color:var(--color-text-primary)]">
        {{ credential.title }}
      </span>
      <span
        v-if="meta"
        class="truncate text-xs text-[color:var(--color-brand-secondary)]"
      >
        {{ meta }}
      </span>
    </span>
  </span>
</template>
