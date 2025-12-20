<template>
  <section class="grid gap-6">
    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
      <h2 class="font-serif text-[1.25rem] font-semibold leading-[var(--leading-normal)]">
        Paiements
      </h2>
      <p class="mt-2 text-[color:var(--color-brand-secondary)]">
        Page placeholder (V0) — historique et factures à venir.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Paiements'
})
</script>

