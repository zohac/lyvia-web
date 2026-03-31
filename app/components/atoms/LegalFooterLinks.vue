<script setup lang="ts">
import CookieSettingsModal from '../molecules/CookieSettingsModal.vue'

const links = [
  { label: 'Mentions légales', to: '/legal/mentions-legales' },
  { label: 'CGU', to: '/legal/cgu' },
  { label: 'Confidentialité', to: '/legal/confidentialite' }
] as const

const cookieModalOpen = ref(false)
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
      class="inline-flex min-h-[44px] items-center px-1 py-2 text-xs text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-secondary)] hover:underline"
    >
      {{ link.label }}
    </NuxtLink>

    <button
      type="button"
      class="inline-flex min-h-[44px] items-center px-1 py-2 text-xs text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-secondary)] hover:underline"
      @click="cookieModalOpen = true"
    >
      Cookies
    </button>

    <CookieSettingsModal v-model:open="cookieModalOpen" />
  </nav>
</template>
