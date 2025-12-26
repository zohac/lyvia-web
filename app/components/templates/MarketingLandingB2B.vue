<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <!-- Ambient background -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div class="absolute -left-[10%] -top-[10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(212,184,160,0.26),transparent_60%)] blur-[100px]" />
      <div class="absolute -bottom-[15%] -right-[10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(181,192,163,0.18),transparent_60%)] blur-[110px]" />
      <div class="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(28,25,23,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>

    <!-- Hero -->
    <section
      id="essence"
      class="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="max-w-[1200px] w-full grid lg:grid-cols-2 gap-12 items-center">
        <div class="flex flex-col gap-8 text-center lg:text-left relative z-20 order-2 lg:order-1">
          <div class="inline-flex items-center justify-center lg:justify-start gap-2 text-[color:var(--color-brand-accent)] uppercase tracking-[0.2em] text-xs font-bold">
            <span class="w-8 h-px bg-[color:var(--color-brand-solid)]" />
            <span>Kaora — Studio</span>
          </div>

          <h1 class="font-serif italic text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] text-[color:var(--color-brand-primary)]">
            L’écrin digital
            <br>
            pour vos
            <br>
            <span
              class="not-italic text-transparent bg-clip-text"
              :style="{ backgroundImage: 'linear-gradient(90deg,var(--color-kaora-500),var(--color-kaora-700))' }"
            >
              accompagnements
            </span>
            .
          </h1>

          <p class="text-lg sm:text-xl text-[color:var(--color-brand-secondary)] max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">
            Kaora réunit agenda, paiements et suivi client dans une expérience calme — pensée pour les métiers du soin, pas pour les dashboards bruyants.
          </p>

          <div class="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <NuxtLink
              to="/login"
              class="group relative overflow-hidden rounded-full bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)] px-8 py-4 text-base font-bold shadow-floating transition-base hover:brightness-110"
            >
              <span class="relative z-10 flex items-center gap-2">
                Créer mon espace pro
                <Icon
                  name="lucide:arrow-right"
                  size="18"
                  class="group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </span>
            </NuxtLink>

            <a
              href="#atelier"
              class="flex items-center justify-center gap-2 px-8 py-4 text-[color:var(--color-brand-primary)] font-medium hover:text-[color:var(--color-brand-accent)] transition-base"
            >
              <Icon
                name="lucide:play-circle"
                size="20"
                aria-hidden="true"
              />
              Ouvrir l’atelier
            </a>
          </div>

          <div class="flex flex-wrap justify-center gap-2 text-sm text-[color:var(--color-brand-secondary)] lg:justify-start">
            <span class="rounded-full bg-white/70 px-4 py-2 shadow-soft">
              Essai gratuit
            </span>
            <span class="rounded-full bg-white/70 px-4 py-2 shadow-soft">
              Sans carte bancaire
            </span>
            <span class="rounded-full bg-white/70 px-4 py-2 shadow-soft">
              White-label (multi-domaines)
            </span>
          </div>
        </div>

        <div class="relative h-[50vh] lg:h-[80vh] w-full flex items-center justify-center order-1 lg:order-2">
          <div
            aria-hidden="true"
            class="absolute inset-0 blob-shape bg-[radial-gradient(circle_at_center,rgba(212,184,160,0.55),transparent_62%)] blur-[60px]"
          />

          <div class="relative w-full max-w-[560px]">
            <div
              aria-hidden="true"
              class="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(212,184,160,0.38),transparent_60%)] blur-[70px]"
            />

            <div class="rounded-blob-d border border-white/50 bg-white/85 p-3 shadow-floating backdrop-blur-md">
              <img
                src="/images/marketing-dashboard-mockup.svg"
                class="w-full rounded-[calc(2rem_-_0.85rem)] border border-[rgba(231,229,228,0.9)] bg-white object-cover"
                alt="Interface Kaora (aperçu)"
                loading="lazy"
                decoding="async"
              >
            </div>

            <div class="pointer-events-none absolute -bottom-10 -left-10 hidden w-[17rem] rotate-[-2deg] md:block">
              <div class="rounded-blob-c border border-white/55 bg-white/80 p-5 shadow-soft backdrop-blur-md">
                <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                  Silence
                </p>
                <p class="mt-2 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                  Un dashboard qui s’efface, pour laisser la relation au centre.
                </p>
              </div>
            </div>

            <div class="pointer-events-none absolute -top-10 right-4 hidden w-[16rem] rotate-[2deg] md:block">
              <div class="rounded-blob-a border border-white/55 bg-white/80 p-5 shadow-soft backdrop-blur-md">
                <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                  Structure
                </p>
                <p class="mt-2 font-serif text-lg italic leading-tight text-[color:var(--color-brand-primary)]">
                  “Tout est là. Juste là.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[color:var(--color-brand-muted)] animate-bounce">
        <span class="text-xs uppercase tracking-widest">
          Explorer
        </span>
        <Icon
          name="lucide:chevron-down"
          size="18"
          aria-hidden="true"
        />
      </div>
    </section>

    <!-- Platform / Guide -->
    <section
      id="atelier"
      class="py-24 sm:py-32 px-6 bg-white/40 relative"
    >
      <div class="max-w-[1000px] mx-auto">
        <div class="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div class="w-full md:w-1/2 relative">
            <div class="relative mx-auto w-full max-w-md">
              <div
                aria-hidden="true"
                class="absolute inset-0 -translate-x-4 translate-y-4 rounded-full bg-[rgba(212,184,160,0.22)] blur-3xl"
              />

              <div class="rounded-blob-a border border-white/50 bg-white/85 p-3 shadow-floating backdrop-blur-md">
                <img
                  src="/images/marketing-screen-calendar.svg"
                  class="w-full rounded-[calc(2.5rem_-_1.15rem)] border border-[rgba(231,229,228,0.9)] bg-white object-cover"
                  alt="Agenda Kaora (aperçu)"
                  loading="lazy"
                  decoding="async"
                >
              </div>

              <div class="pointer-events-none absolute -bottom-8 -right-6 w-[15rem] rotate-[1.5deg]">
                <div class="rounded-blob-d border border-white/55 bg-white/80 p-5 shadow-soft backdrop-blur-md">
                  <Icon
                    name="lucide:quote"
                    size="34"
                    class="text-[color:var(--color-brand-accent)]"
                    aria-hidden="true"
                  />
                  <p class="mt-2 text-sm font-medium leading-relaxed italic font-serif text-[color:var(--color-brand-primary)]">
                    On ne “gère” pas des clientes. On les accompagne.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full md:w-1/2 flex flex-col gap-6">
            <h2 class="font-serif text-4xl md:text-5xl text-[color:var(--color-brand-primary)]">
              L’atelier
              <span class="italic text-[color:var(--color-brand-accent)]">Kaora</span>
            </h2>
            <p class="text-lg text-[color:var(--color-brand-secondary)] leading-relaxed font-light">
              Une interface qui se vit comme un espace de travail calme : rendez-vous, paiements et ressources sont orchestrés sans effort.
            </p>
            <p class="text-base text-[color:var(--color-brand-muted)] leading-relaxed">
              Chaque détail vise à réduire la charge mentale. Vous gardez la relation, Kaora garde la structure.
            </p>
            <div class="pt-4">
              <NuxtLink
                to="/login"
                class="inline-flex items-center gap-2 text-[color:var(--color-brand-accent)] font-bold hover:gap-4 transition-base"
              >
                Découvrir l’expérience
                <Icon
                  name="lucide:arrow-right"
                  size="16"
                  aria-hidden="true"
                />
              </NuxtLink>
            </div>

            <div class="grid gap-3 pt-2">
              <div class="rounded-blob-c border border-[rgba(28,25,23,0.10)] bg-white/70 p-5 shadow-soft backdrop-blur">
                <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                  Paiements
                </p>
                <p class="mt-2 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                  Stripe, factures, statuts : la trésorerie devient lisible, sans effort.
                </p>
              </div>
              <div class="rounded-blob-a border border-[rgba(28,25,23,0.10)] bg-white/70 p-5 shadow-soft backdrop-blur">
                <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                  Ressources
                </p>
                <p class="mt-2 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                  Des contenus au bon moment, pour prolonger le travail entre les séances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Journey -->
    <section
      id="parcours"
      class="py-24 sm:py-32 px-6 relative overflow-hidden"
    >
      <div class="max-w-[960px] mx-auto relative z-10 flex flex-col gap-24">
        <div class="text-center mb-10">
          <span class="text-[color:var(--color-brand-accent)] font-bold tracking-widest uppercase text-xs">
            Le parcours
          </span>
          <h2 class="font-serif text-4xl sm:text-5xl mt-4 text-[color:var(--color-brand-primary)]">
            Une trajectoire
            <span class="italic text-[color:var(--color-brand-accent)]">simple</span>
          </h2>
        </div>

        <div class="relative">
          <svg
            aria-hidden="true"
            class="absolute left-1/2 top-0 hidden h-[260px] w-[860px] -translate-x-1/2 md:block"
            viewBox="0 0 860 260"
            fill="none"
          >
            <path
              d="M70 160 C 220 60, 320 220, 430 140 C 540 60, 630 220, 740 120"
              stroke="rgba(212,184,160,0.55)"
              stroke-width="4"
              stroke-linecap="round"
            />
            <circle
              cx="70"
              cy="160"
              r="18"
              fill="#FFFFFF"
              stroke="rgba(212,184,160,0.9)"
              stroke-width="3"
            />
            <circle
              cx="430"
              cy="140"
              r="18"
              fill="#FFFFFF"
              stroke="rgba(212,184,160,0.9)"
              stroke-width="3"
            />
            <circle
              cx="740"
              cy="120"
              r="18"
              fill="#FFFFFF"
              stroke="rgba(212,184,160,0.9)"
              stroke-width="3"
            />
          </svg>

          <div class="grid gap-6 md:grid-cols-3 md:items-start">
            <div class="rounded-blob-c border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur transition-base hover:shadow-floating">
              <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                01 — Mise en place
              </p>
              <h3 class="mt-3 font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Une page, un agenda.
              </h3>
              <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                Votre page publique et vos créneaux se configurent en douceur.
              </p>
            </div>

            <div class="rounded-blob-a border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur transition-base hover:shadow-floating md:translate-y-10">
              <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                02 — Automatisation
              </p>
              <h3 class="mt-3 font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Le flux suit.
              </h3>
              <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                Paiements, confirmations, organisation : la structure devient naturelle.
              </p>
            </div>

            <div class="rounded-blob-d border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur transition-base hover:shadow-floating md:-translate-y-6">
              <p class="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">
                03 — Expérience client
              </p>
              <h3 class="mt-3 font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Le soin reste.
              </h3>
              <p class="mt-3 text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
                Contenus, suivi et ressources : vos clientes restent engagées, sans surcharge.
              </p>
            </div>
          </div>

          <div class="mt-10 grid gap-6 md:grid-cols-2">
            <div class="rounded-blob-b border border-white/60 bg-white/80 p-4 shadow-floating backdrop-blur-md">
              <img
                src="/images/marketing-screen-payments.svg"
                class="w-full rounded-[calc(2.5rem_-_1.15rem)] border border-[rgba(231,229,228,0.9)] bg-white object-cover"
                alt="Paiements Kaora (aperçu)"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="rounded-blob-a border border-white/60 bg-white/80 p-4 shadow-floating backdrop-blur-md">
              <img
                src="/images/marketing-screen-library.svg"
                class="w-full rounded-[calc(2.5rem_-_1.15rem)] border border-[rgba(231,229,228,0.9)] bg-white object-cover"
                alt="Ressources Kaora (aperçu)"
                loading="lazy"
                decoding="async"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-24 px-6 bg-[rgba(28,25,23,0.04)]">
      <div class="max-w-[1200px] mx-auto">
        <h2 class="font-serif text-3xl md:text-4xl text-center mb-16 text-[color:var(--color-brand-primary)]">
          Échos de
          <span class="italic text-[color:var(--color-brand-accent)]">métamorphoses</span>
        </h2>
        <div class="flex flex-nowrap overflow-x-auto gap-6 pb-8 no-scrollbar md:justify-center">
          <div class="min-w-[300px] md:min-w-[350px] bg-white/90 p-8 rounded-2xl rounded-tr-[4rem] shadow-soft hover:shadow-floating transition-all duration-500">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-full bg-[rgba(212,184,160,0.22)] grid place-items-center font-semibold text-[color:var(--color-brand-primary)]">
                I
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Isabelle
                </p>
                <p class="text-xs text-[color:var(--color-brand-accent)] font-medium">
                  Coach
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic text-[color:var(--color-brand-secondary)] leading-relaxed">
              “Enfin un outil qui ne me donne pas l'impression de gérer une usine.”
            </p>
          </div>

          <div class="min-w-[300px] md:min-w-[350px] bg-white/90 p-8 rounded-2xl rounded-tl-[4rem] shadow-soft hover:shadow-floating transition-all duration-500 md:mt-8">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-full bg-[rgba(212,184,160,0.22)] grid place-items-center font-semibold text-[color:var(--color-brand-primary)]">
                C
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Claire
                </p>
                <p class="text-xs text-[color:var(--color-brand-accent)] font-medium">
                  Naturopathe
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic text-[color:var(--color-brand-secondary)] leading-relaxed">
              “Kaora a rendu mon parcours client plus fluide. C’est simple, doux, efficace.”
            </p>
          </div>

          <div class="min-w-[300px] md:min-w-[350px] bg-white/90 p-8 rounded-2xl rounded-br-[4rem] shadow-soft hover:shadow-floating transition-all duration-500">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-full bg-[rgba(212,184,160,0.22)] grid place-items-center font-semibold text-[color:var(--color-brand-primary)]">
                V
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Véronique
                </p>
                <p class="text-xs text-[color:var(--color-brand-accent)] font-medium">
                  Thérapeute
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic text-[color:var(--color-brand-secondary)] leading-relaxed">
              “Une interface premium, mais surtout apaisante. Mes clientes le sentent.”
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
