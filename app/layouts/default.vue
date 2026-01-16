<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})
</script>

<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <slot />
    </main>

    <footer class="border-t border-[color:var(--color-brand-subtle)]">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-[color:var(--color-brand-secondary)] sm:px-6">
        <p>
          © {{ new Date().getFullYear() }} Kaora
        </p>
      </div>
    </footer>
  </div>
</template>
