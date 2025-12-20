<template>
  <section class="grid gap-6">
    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
      <h2 class="font-serif text-[1.25rem] font-semibold leading-[var(--leading-normal)]">
        Bienvenue
      </h2>
      <p class="mt-2 text-[color:var(--color-brand-secondary)]">
        Votre espace client est prêt. Les modules (rendez-vous, contenus, paiements) arrivent ensuite.
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Prochain rendez-vous
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          À venir.
        </p>
      </div>
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Ressources
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          Bientôt disponible.
        </p>
      </div>
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Paiements
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          Historique à venir.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Tableau de bord'
})
</script>
