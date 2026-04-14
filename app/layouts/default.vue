<script setup lang="ts">
import '~/assets/css/main.css'

import LegalFooterLinks from '../components/atoms/LegalFooterLinks.vue'

useCommonLayoutHead()
</script>

<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <slot />
    </main>

    <footer class="border-t border-[color:var(--color-brand-subtle)]">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-center text-sm text-[color:var(--color-brand-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
        <p>
          © {{ new Date().getFullYear() }} Keova
        </p>
        <LegalFooterLinks />
      </div>
    </footer>
    <ClientOnly>
      <LazyCookieConsentBanner />
    </ClientOnly>
  </div>
</template>
