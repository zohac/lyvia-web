<script setup lang="ts">
import LegalFooterLinks from '../components/atoms/LegalFooterLinks.vue'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <div class="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14">
      <main class="flex flex-1 items-start justify-center sm:items-center">
        <slot />
      </main>

      <footer class="flex flex-col items-center gap-4 pt-10 text-center text-xs text-[color:var(--color-brand-muted)]">
        <LegalFooterLinks />
        <p>© {{ currentYear }} Kaora</p>
      </footer>
    </div>
  </div>
</template>
