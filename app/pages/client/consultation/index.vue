<template>
  <section class="grid gap-6">
    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
      <h2 class="font-serif text-[1.25rem] font-semibold leading-[var(--leading-normal)]">
        Rendez-vous
      </h2>
      <p class="mt-2 text-[color:var(--color-brand-secondary)]">
        Réservez une consultation payante ou consultez votre historique.
      </p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <NuxtLink
          to="/client/consultation/choose-slot"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating"
        >
          <Icon
            name="lucide:calendar-plus"
            size="18"
            aria-hidden="true"
          />
          <span>
            Réserver une consultation
          </span>
        </NuxtLink>

        <p class="text-xs text-[color:var(--color-brand-muted)]">
          Vous pouvez aussi accéder à cette page depuis votre tableau de bord.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Rendez-vous'
})
</script>
