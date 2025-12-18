<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})
</script>

<template>
  <div class="min-h-screen">
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          aria-label="Accueil"
        >
          <AppLogo class="h-6 w-auto shrink-0 text-[color:var(--color-brand-primary)]" />
        </NuxtLink>
      </template>

      <template #right>
        <NuxtLink
          to="/login"
          class="rounded-[var(--radius-sm)] px-3 py-2 font-semibold text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-surface-highlight)] hover:underline"
        >
          Connexion
        </NuxtLink>
      </template>
    </UHeader>

    <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <slot />
    </main>

    <footer class="border-t border-[color:var(--color-brand-subtle)]">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-[color:var(--color-brand-secondary)] sm:px-6">
        <p>
          © {{ new Date().getFullYear() }} Livia
        </p>
        <NuxtLink
          to="/login"
          class="font-semibold hover:underline"
        >
          Accéder à mon espace
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
