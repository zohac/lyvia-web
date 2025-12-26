<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <div class="min-h-[100svh] lg:grid lg:grid-cols-2 lg:items-stretch">
      <main class="flex items-center justify-center px-6 py-14 lg:px-16">
        <div class="w-full max-w-md">
          <slot />
        </div>
      </main>

      <aside class="hidden bg-[color:var(--color-surface-card)] p-4 lg:block">
        <div class="relative h-full w-full overflow-hidden rounded-l-[3rem] bg-[color:var(--color-kaora-200)] shadow-floating">
          <img
            src="/images/coach-hero-texture.svg"
            alt="Texture Kaora"
            loading="eager"
            decoding="async"
            class="h-full w-full object-cover"
          >

          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(28,25,23,0.62)] via-[rgba(28,25,23,0.18)] to-transparent" />

          <div class="absolute bottom-12 left-12 right-12 max-w-xl text-white">
            <p class="font-serif text-2xl italic leading-[var(--leading-relaxed)]">
              « La simplicité est un luxe. Kaora vous aide à la préserver. »
            </p>
            <p class="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-white/90">
              Kaora — Calm Tech
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
