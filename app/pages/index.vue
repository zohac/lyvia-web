<template>
  <div class="grid gap-12">
    <section class="grid gap-6">
      <div class="grid gap-3">
        <p class="text-sm font-semibold tracking-wide text-[color:var(--color-brand-secondary)]">
          Coaching Platform — MVP V0
        </p>
        <h1 class="font-serif text-[2.25rem] font-bold leading-[var(--leading-tight)] tracking-[-0.01em] sm:text-[3rem]">
          Un accompagnement clair, rassurant et orienté résultats.
        </h1>
        <p class="max-w-2xl text-[1.125rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
          Réservez vos rendez-vous, payez en ligne en toute sécurité, et accédez à des contenus utiles — dans une interface apaisante pensée pour durer.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NuxtLink
          to="/login"
          class="inline-flex h-12 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-accent-main)] px-6 text-[19px] font-bold text-[color:var(--color-accent-contrast)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-accent-hover)]"
        >
          Se connecter
        </NuxtLink>

        <NuxtLink
          to="/forgot-password"
          class="inline-flex h-12 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-brand-primary)] px-6 font-semibold text-[color:var(--color-brand-primary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)]"
        >
          Mot de passe oublié
        </NuxtLink>
      </div>
    </section>

    <section class="grid gap-6">
      <h2 class="font-serif text-[1.5rem] font-semibold leading-[var(--leading-normal)]">
        Pourquoi c’est simple
      </h2>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <h3 class="font-serif text-[1.25rem] font-semibold">
            Rendez-vous
          </h3>
          <p class="mt-2 text-[color:var(--color-brand-secondary)]">
            Un parcours minimal, sans friction : réserver, confirmer, suivre.
          </p>
        </div>
        <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <h3 class="font-serif text-[1.25rem] font-semibold">
            Paiement sécurisé
          </h3>
          <p class="mt-2 text-[color:var(--color-brand-secondary)]">
            Stripe Checkout comme référence : clair, transparent, fiable.
          </p>
        </div>
        <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <h3 class="font-serif text-[1.25rem] font-semibold">
            Contenus utiles
          </h3>
          <p class="mt-2 text-[color:var(--color-brand-secondary)]">
            Articles, recettes, actualités — accessibles simplement.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
})
</script>
