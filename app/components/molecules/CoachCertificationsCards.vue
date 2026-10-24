<script setup lang="ts">
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'

defineProps<{
  credentials: CredentialItem[]
}>()
</script>

<template>
  <div class="mt-8 grid gap-3 sm:grid-cols-2">
    <div
      v-for="(cred, i) in credentials"
      :key="cred.title + i"
      class="flex items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-3"
    >
      <img
        v-if="cred.logoUrl"
        :src="cred.logoUrl"
        :alt="cred.institution ? cred.institution + ' — ' + cred.title : cred.title"
        class="h-10 w-auto max-w-[6rem] object-contain"
      >
      <div class="flex flex-col">
        <span class="text-sm font-medium text-[color:var(--color-text-primary)]">
          {{ cred.title }}
          <UIcon
            v-if="cred.verified"
            name="i-lucide-badge-check"
            class="ml-1 size-3.5 text-[color:var(--color-brand-accent)]"
          />
        </span>
        <span
          v-if="formatCredentialMeta(cred)"
          class="text-xs text-[color:var(--color-brand-secondary)]"
        >
          {{ formatCredentialMeta(cred) }}
        </span>
      </div>
    </div>
  </div>
</template>
