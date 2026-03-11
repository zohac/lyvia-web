<script setup lang="ts">
import LegalFooterLinks from '../components/atoms/LegalFooterLinks.vue'

useCommonLayoutHead()
</script>

<template>
  <div class="flex min-h-[100svh] flex-col bg-[color:var(--color-surface-page)]">
    <header class="border-b border-[color:var(--color-brand-subtle)]">
      <div class="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2"
          aria-label="Retour à l'accueil Kaora"
        >
          <NuxtImg
            src="/images/kaora-logo.png"
            alt=""
            class="h-6 w-auto"
            aria-hidden="true"
            loading="eager"
          />
          <span class="sr-only">Kaora</span>
        </NuxtLink>

        <NuxtLink
          to="/"
          class="text-sm font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:text-[color:var(--color-brand-primary)]"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1">
      <article class="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <slot />
      </article>
    </main>

    <footer class="border-t border-[color:var(--color-brand-subtle)]">
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <LegalFooterLinks />
        <p class="text-xs text-[color:var(--color-brand-muted)]">
          © {{ new Date().getFullYear() }} Kaora. Tous droits réservés.
        </p>
      </div>
    </footer>
  </div>
</template>
