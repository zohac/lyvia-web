<template>
  <div>
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Administration
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Supervisez la plateforme Kaora et les opérations.
        </p>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div class="space-y-8 lg:col-span-8">
        <section class="relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/55 p-8 shadow-soft">
          <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-kaora-100)] opacity-45 blur-[100px]" />

          <div class="relative z-10 grid gap-2">
            <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
              Vue système
            </h2>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Les indicateurs admin (logs, tenants, providers) seront regroupés ici.
            </p>
          </div>
        </section>

        <section class="grid gap-6 md:grid-cols-2">
          <div class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Tenants
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Gestion des domaines, slugs et configuration de marque.
            </p>
          </div>

          <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Journaux
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Monitoring et traçabilité : à connecter à l’outil de logs.
            </p>
          </div>
        </section>
      </div>

      <aside class="space-y-8 lg:col-span-4">
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Statut
          </p>
          <p class="mt-4 text-sm text-[color:var(--color-brand-secondary)]">
            Les widgets admin (santé API, files, alertes) seront ajoutés progressivement.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Dashboard'
})
</script>
