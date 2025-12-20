<template>
  <section class="grid gap-6">
    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
      <h2 class="font-serif text-[1.25rem] font-semibold leading-[var(--leading-normal)]">
        Vue d’ensemble
      </h2>
      <p class="mt-2 text-[color:var(--color-brand-secondary)]">
        Accédez à votre agenda, vos clientes et vos contenus depuis la navigation latérale.
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Agenda
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          Disponibilités à configurer.
        </p>
      </div>
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Clientes
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          Liste à venir.
        </p>
      </div>
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <h3 class="font-serif text-[1.125rem] font-semibold">
          Finance
        </h3>
        <p class="mt-2 text-[color:var(--color-brand-secondary)]">
          Connexion Stripe bientôt.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Vue d\'ensemble'
})
</script>
