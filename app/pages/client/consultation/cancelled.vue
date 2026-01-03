<script setup lang="ts">
definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Paiement annulé'
})
</script>

<template>
  <section class="grid gap-8">
    <header class="grid gap-2">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
        Consultation
      </p>
      <h1 class="font-serif text-3xl italic text-[color:var(--color-brand-primary)] sm:text-4xl">
        Paiement annulé
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
        Aucun paiement n’a été effectué. Vous pouvez reprendre la réservation quand vous le souhaitez.
      </p>
    </header>

    <div class="rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-8 shadow-soft backdrop-blur">
      <div class="grid gap-4">
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          Si vous avez quitté Stripe par erreur, sélectionnez à nouveau un créneau puis relancez le paiement.
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/client/consultation/choose-slot"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating"
          >
            <Icon
              name="lucide:calendar"
              size="18"
              aria-hidden="true"
            />
            Revenir au choix du créneau
          </NuxtLink>

          <NuxtLink
            to="/client/dashboard"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
          >
            Retour au tableau de bord
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
