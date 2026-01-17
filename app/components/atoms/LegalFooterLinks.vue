<script setup lang="ts">
const links = [
  { label: 'Mentions légales', to: '/legal/mentions-legales' },
  { label: 'CGU', to: '/legal/cgu' },
  { label: 'Confidentialité', to: '/legal/confidentialite' }
] as const
</script>

<template>
  <nav
    aria-label="Liens légaux"
    class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
  >
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="text-xs text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-secondary)] hover:underline"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
