<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <!-- Ambient background -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <div class="absolute -left-[10%] -top-[10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(213,184,160,0.35),transparent_60%)] blur-[80px]" />
      <div class="absolute -bottom-[15%] -right-[10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(181,192,163,0.18),transparent_60%)] blur-[90px]" />
    </div>

    <!-- Hero -->
    <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div class="mx-auto grid max-w-4xl gap-10 text-center">
        <div class="grid gap-6">
          <h1 class="font-serif text-[2.75rem] italic leading-[1.08] tracking-[-0.02em] sm:text-[4rem]">
            L’écrin digital pour vos
            <span class="text-[color:var(--color-brand-accent)]">accompagnements</span>.
          </h1>

          <p class="mx-auto max-w-2xl text-[1.125rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
            Une plateforme tout-en-un pour gérer vos rendez-vous, paiements et suivis clients — avec une expérience douce, premium, et sans bricolage.
          </p>

          <div class="mx-auto grid w-full max-w-[28rem] gap-3 sm:flex sm:max-w-none sm:justify-center">
            <NuxtLink
              to="/login"
              class="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-8 text-[15px] font-bold text-[color:var(--color-accent-contrast)] shadow-[var(--shadow-floating)] transition-base hover:brightness-110"
            >
              Créer mon espace pro
            </NuxtLink>

            <p class="self-center text-sm font-semibold text-[color:var(--color-brand-muted)]">
              Essai gratuit • Sans carte bancaire
            </p>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-5xl">
          <div
            aria-hidden="true"
            class="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(212,184,160,0.32),transparent_60%)] blur-[55px]"
          />

          <div class="rounded-blob-a border border-[rgba(255,255,255,0.6)] bg-white p-2 shadow-floating transition-base sm:p-3">
            <div class="rounded-[calc(2.5rem_-_0.75rem)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)] p-2 shadow-soft transition-base hover:shadow-floating hover:-translate-y-1 hover:rotate-0 sm:rotate-1">
              <img
                src="/images/marketing-dashboard-mockup.svg"
                class="w-full rounded-[calc(2.5rem_-_1.25rem)] border border-[rgba(231,229,228,0.9)] bg-white object-cover"
                alt="Interface Kaora (aperçu)"
                loading="lazy"
                decoding="async"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section
      id="features"
      class="border-y border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] py-16"
    >
      <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div class="mx-auto grid max-w-3xl gap-4 text-center">
          <h2 class="font-serif text-3xl italic tracking-tight">
            Tout est là. Juste là.
          </h2>
          <p class="text-[color:var(--color-brand-secondary)]">
            Fini le patchwork d’outils. Kaora centralise l’essentiel pour une expérience cohérente.
          </p>
        </div>

        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <div class="group rounded-blob-c border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)] p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-brand-solid)] hover:shadow-floating">
            <div class="mb-6 grid h-14 w-14 place-items-center rounded-[var(--radius-input)] bg-white shadow-soft transition-transform duration-300 group-hover:scale-110">
              <Icon
                name="lucide:calendar-days"
                size="26"
                class="text-[color:var(--color-brand-accent)]"
                aria-hidden="true"
              />
            </div>
            <h3 class="font-serif text-xl italic">
              Agenda intelligent
            </h3>
            <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Vos créneaux de découverte et vos consultations s’organisent sans effort.
            </p>
          </div>

          <div class="group rounded-[var(--radius-organic)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)] p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-brand-solid)] hover:shadow-floating">
            <div class="mb-6 grid h-14 w-14 place-items-center rounded-[var(--radius-input)] bg-white shadow-soft transition-transform duration-300 group-hover:scale-110">
              <Icon
                name="lucide:credit-card"
                size="26"
                class="text-[color:var(--color-brand-accent)]"
                aria-hidden="true"
              />
            </div>
            <h3 class="font-serif text-xl italic">
              Paiements sécurisés
            </h3>
            <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Encaissez au bon moment, avec Stripe, sans courir après les virements.
            </p>
          </div>

          <div class="group rounded-blob-a border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-page)] p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-brand-solid)] hover:shadow-floating">
            <div class="mb-6 grid h-14 w-14 place-items-center rounded-[var(--radius-input)] bg-white shadow-soft transition-transform duration-300 group-hover:scale-110">
              <Icon
                name="lucide:book-open"
                size="26"
                class="text-[color:var(--color-brand-accent)]"
                aria-hidden="true"
              />
            </div>
            <h3 class="font-serif text-xl italic">
              Contenus & suivi
            </h3>
            <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Partagez vos ressources et gardez vos clientes engagées entre les séances.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Target -->
    <section
      id="pour-qui"
      class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
    >
      <div class="grid gap-10 rounded-[var(--radius-organic)] bg-[rgba(213,184,160,0.22)] p-10 shadow-[var(--shadow-card)] md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div class="grid gap-4">
          <h2 class="font-serif text-3xl italic tracking-tight">
            Conçu pour les métiers du soin et de l’écoute
          </h2>
          <p class="text-base leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
            Coachs, naturopathes, praticiens bien-être : offrez une expérience cliente premium, sans complexité technique.
          </p>
        </div>

        <ul class="grid gap-3 text-sm font-semibold text-[color:var(--color-brand-secondary)]">
          <li class="flex items-start gap-3">
            <Icon
              name="lucide:check"
              size="18"
              class="mt-0.5 text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
            Coachs ménopause & bien-être
          </li>
          <li class="flex items-start gap-3">
            <Icon
              name="lucide:check"
              size="18"
              class="mt-0.5 text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
            Naturopathes & praticiens holistiques
          </li>
          <li class="flex items-start gap-3">
            <Icon
              name="lucide:check"
              size="18"
              class="mt-0.5 text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
            Doulas, sophrologues, accompagnantes
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
