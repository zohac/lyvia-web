<template>
  <div>
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Vue d’ensemble
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Un aperçu clair pour piloter votre planning et vos appels discovery.
        </p>
      </div>

      <UButton to="/provider/availability">
        Configurer mes disponibilités
      </UButton>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div class="space-y-8 lg:col-span-8">
        <section class="relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/55 p-8 shadow-soft">
          <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-kaora-100)] opacity-50 blur-[100px]" />

          <div class="relative z-10 grid gap-2">
            <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
              Agenda du jour
            </h2>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Vos prochains rendez-vous et disponibilités s’afficheront ici.
            </p>
          </div>
        </section>

        <section class="grid gap-6 md:grid-cols-2">
          <div class="rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Appels discovery
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              Gérez vos appels discovery depuis une vue dédiée.
            </p>
            <ULink
              to="/provider/discovery"
              class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] hover:underline"
            >
              Ouvrir la liste
              <Icon
                name="lucide:arrow-right"
                size="16"
                aria-hidden="true"
              />
            </ULink>
          </div>

          <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-7 shadow-soft backdrop-blur">
            <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              Mes clientes
            </h3>
            <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
              La liste clientes arrive bientôt, avec notes et historiques.
            </p>
          </div>
        </section>
      </div>

      <aside class="space-y-8 lg:col-span-4">
        <div class="cursor-pointer rounded-blob-a border border-white/60 bg-gradient-to-br from-[color:var(--color-kaora-50)] to-white p-8 text-center shadow-soft transition-base hover:shadow-floating">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
            <Icon
              name="lucide:calendar-clock"
              size="28"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
          </div>
          <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
            Actions rapides
          </h3>
          <p class="mt-2 text-sm text-[color:var(--color-brand-muted)]">
            Mettez à jour vos créneaux en quelques secondes.
          </p>
          <ULink
            to="/provider/availability"
            class="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:shadow-floating"
          >
            Ouvrir l’agenda
          </ULink>
        </div>

        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Finance
          </p>
          <p class="mt-4 text-sm text-[color:var(--color-brand-secondary)]">
            La connexion Stripe sera proposée prochainement pour vos paiements.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Vue d\'ensemble'
})
</script>
