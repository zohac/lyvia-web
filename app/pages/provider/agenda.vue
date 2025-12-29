<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Agenda'
})
</script>

<template>
  <div class="grid gap-10">
    <section class="relative flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div
        class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70"
      />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Agenda
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Visualisez vos rendez-vous et retrouvez rapidement vos prochains appels.
        </p>
      </div>

      <NuxtLink
        to="/provider/availability"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-5 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)]"
      >
        <Icon
          name="lucide:calendar-clock"
          size="18"
          aria-hidden="true"
        />
        Régler mes disponibilités
      </NuxtLink>
    </section>

    <div class="rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur">
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        À venir
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        Cette vue sera branchée sur les créneaux et blocages (Feature G). Pour le moment, utilisez la page “Disponibilités”.
      </p>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.45)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.30)]" />
      </div>
    </div>
  </div>
</template>
