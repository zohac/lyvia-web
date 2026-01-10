<template>
  <div class="landing-alt min-h-[100svh] bg-[#0a0a09] text-[#fafaf8] overflow-x-hidden">
    <!-- Kinetic grain overlay -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 z-[100] opacity-[0.03] mix-blend-overlay"
      :style="{ backgroundImage: 'url(\'data:image/svg+xml,%3Csvg viewBox=\\\'0 0 256 256\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cfilter id=\\\'n\\\'%3E%3CfeTurbulence type=\\\'fractalNoise\\\' baseFrequency=\\\'0.85\\\' numOctaves=\\\'4\\\' stitchTiles=\\\'stitch\\\'/%3E%3C/filter%3E%3Crect width=\\\'100%25\\\' height=\\\'100%25\\\' filter=\\\'url(%23n)\\\'/%3E%3C/svg%3E\')' }"
    />

    <!-- Hero Section -->
    <section class="relative min-h-[100svh] flex flex-col">
      <!-- Top bar -->
      <header class="relative z-20 flex items-center justify-between px-6 py-6 lg:px-12">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#d4b8a0] flex items-center justify-center">
            <span class="font-display text-[#0a0a09] text-lg font-semibold">K</span>
          </div>
          <span class="font-display text-xl tracking-tight">Kaora</span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm tracking-wide text-[#a8a29e]">
          <a href="#atelier" class="hover:text-[#fafaf8] transition-colors duration-300">L'atelier</a>
          <a href="#parcours" class="hover:text-[#fafaf8] transition-colors duration-300">Parcours</a>
          <a href="#temoignages" class="hover:text-[#fafaf8] transition-colors duration-300">Témoignages</a>
        </nav>
        <UButton to="/login" size="sm" class="alt-btn-primary">
          Commencer
        </UButton>
      </header>

      <!-- Main hero content -->
      <div class="flex-1 grid lg:grid-cols-12 gap-8 px-6 lg:px-12 py-12 lg:py-0 items-center">
        <!-- Left column - Typography heavy -->
        <div class="lg:col-span-7 flex flex-col gap-8 relative z-10">
          <div class="overflow-hidden">
            <p
              class="text-[#d4b8a0] text-sm tracking-[0.4em] uppercase font-medium hero-line"
              style="animation-delay: 0.1s"
            >
              Studio digital pour professionnels du soin
            </p>
          </div>

          <div class="overflow-hidden">
            <h1
              class="font-display text-[clamp(3rem,12vw,9rem)] leading-[0.9] tracking-[-0.03em] hero-line"
              style="animation-delay: 0.2s"
            >
              L'écrin
            </h1>
          </div>

          <div class="overflow-hidden">
            <h1
              class="font-display text-[clamp(3rem,12vw,9rem)] leading-[0.9] tracking-[-0.03em] text-[#d4b8a0] italic hero-line"
              style="animation-delay: 0.3s"
            >
              digital
            </h1>
          </div>

          <div class="overflow-hidden max-w-xl">
            <p
              class="text-lg lg:text-xl text-[#a8a29e] leading-relaxed hero-line"
              style="animation-delay: 0.5s"
            >
              Agenda, paiements et suivi client réunis dans une expérience calme —
              pensée pour les métiers du soin, pas pour les dashboards bruyants.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 pt-4 hero-line" style="animation-delay: 0.6s">
            <UButton to="/login" size="xl" class="alt-btn-primary group">
              Créer mon espace
              <template #trailing>
                <Icon name="lucide:arrow-right" class="group-hover:translate-x-2 transition-transform duration-300" />
              </template>
            </UButton>
            <UButton to="#atelier" size="xl" variant="ghost" class="alt-btn-ghost">
              <template #leading>
                <Icon name="lucide:play" class="w-4 h-4" />
              </template>
              Explorer l'atelier
            </UButton>
          </div>

          <!-- Trust badges as a strip -->
          <div class="flex flex-wrap gap-6 pt-8 text-xs text-[#78716c] uppercase tracking-[0.2em] hero-line" style="animation-delay: 0.7s">
            <span class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#b5c0a3]" />
              Essai gratuit
            </span>
            <span class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#b5c0a3]" />
              Sans carte bancaire
            </span>
            <span class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#b5c0a3]" />
              White-label
            </span>
          </div>
        </div>

        <!-- Right column - Visual -->
        <div class="lg:col-span-5 relative h-[50vh] lg:h-auto lg:self-stretch flex items-center justify-center">
          <!-- Dramatic circular accent -->
          <div
            aria-hidden="true"
            class="absolute w-[120%] aspect-square rounded-full border border-[#d4b8a0]/20 -right-[30%] top-1/2 -translate-y-1/2 hero-circle"
          />
          <div
            aria-hidden="true"
            class="absolute w-[90%] aspect-square rounded-full border border-[#d4b8a0]/10 -right-[20%] top-1/2 -translate-y-1/2 hero-circle"
            style="animation-delay: 0.1s"
          />

          <!-- Dashboard mockup with editorial frame -->
          <div class="relative w-full max-w-md hero-mockup">
            <div class="absolute -inset-4 bg-gradient-to-br from-[#d4b8a0]/20 via-transparent to-[#b5c0a3]/10 rounded-2xl blur-2xl" />
            <div class="relative bg-[#1c1917] rounded-xl p-2 border border-[#292524]">
              <img
                src="/images/marketing-dashboard-mockup.svg"
                class="w-full rounded-lg"
                alt="Interface Kaora"
                loading="lazy"
              >
            </div>

            <!-- Floating stat card -->
            <div class="absolute -left-8 bottom-12 bg-[#1c1917] border border-[#292524] rounded-lg p-4 floating-card" style="animation-delay: 0.8s">
              <p class="text-[#78716c] text-xs uppercase tracking-widest mb-1">Clients actifs</p>
              <p class="font-display text-3xl text-[#d4b8a0]">+47%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[#78716c]">
        <span class="text-xs uppercase tracking-[0.3em]">Scroll</span>
        <div class="w-px h-12 bg-gradient-to-b from-[#78716c] to-transparent scroll-line" />
      </div>
    </section>

    <!-- Atelier Section -->
    <section id="atelier" class="relative py-32 lg:py-48">
      <!-- Horizontal rule accent -->
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#292524] to-transparent" />

      <div class="px-6 lg:px-12 max-w-7xl mx-auto">
        <!-- Section header with editorial styling -->
        <div class="grid lg:grid-cols-12 gap-12 mb-20">
          <div class="lg:col-span-4">
            <span class="text-[#d4b8a0] text-xs tracking-[0.4em] uppercase">01 — L'atelier</span>
          </div>
          <div class="lg:col-span-8">
            <h2 class="font-display text-5xl lg:text-7xl leading-[1.05] tracking-[-0.02em]">
              Un espace de travail
              <span class="italic text-[#d4b8a0]">apaisé</span>
            </h2>
          </div>
        </div>

        <!-- Content grid with asymmetric layout -->
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <!-- Image column -->
          <div class="lg:col-span-6 lg:col-start-1 relative">
            <div class="relative">
              <div class="absolute -inset-8 bg-[#d4b8a0]/5 rounded-3xl -z-10" />
              <div class="bg-[#1c1917] rounded-xl p-2 border border-[#292524]">
                <img
                  src="/images/marketing-screen-calendar.svg"
                  class="w-full rounded-lg"
                  alt="Calendrier Kaora"
                  loading="lazy"
                >
              </div>
            </div>

            <!-- Pull quote -->
            <div class="mt-8 pl-8 border-l-2 border-[#d4b8a0]">
              <p class="font-display text-2xl italic text-[#a8a29e] leading-relaxed">
                "On ne gère pas des clientes. On les accompagne."
              </p>
            </div>
          </div>

          <!-- Text column with features -->
          <div class="lg:col-span-5 lg:col-start-8 flex flex-col gap-12">
            <p class="text-lg text-[#a8a29e] leading-relaxed">
              Une interface qui se vit comme un atelier calme : rendez-vous, paiements
              et ressources sont orchestrés sans effort. Chaque détail vise à réduire
              la charge mentale.
            </p>

            <!-- Feature cards with numbers -->
            <div class="space-y-6">
              <div class="group p-6 bg-[#1c1917]/50 border border-[#292524] rounded-xl hover:border-[#d4b8a0]/30 transition-colors duration-300">
                <div class="flex items-start gap-6">
                  <span class="font-display text-4xl text-[#d4b8a0]/30 group-hover:text-[#d4b8a0]/60 transition-colors">01</span>
                  <div>
                    <h3 class="font-display text-xl mb-2">Agenda intelligent</h3>
                    <p class="text-sm text-[#78716c] leading-relaxed">
                      Disponibilités, créneaux et rappels. Tout s'orchestre automatiquement.
                    </p>
                  </div>
                </div>
              </div>

              <div class="group p-6 bg-[#1c1917]/50 border border-[#292524] rounded-xl hover:border-[#d4b8a0]/30 transition-colors duration-300">
                <div class="flex items-start gap-6">
                  <span class="font-display text-4xl text-[#d4b8a0]/30 group-hover:text-[#d4b8a0]/60 transition-colors">02</span>
                  <div>
                    <h3 class="font-display text-xl mb-2">Paiements fluides</h3>
                    <p class="text-sm text-[#78716c] leading-relaxed">
                      Stripe intégré, factures automatiques, suivi de trésorerie limpide.
                    </p>
                  </div>
                </div>
              </div>

              <div class="group p-6 bg-[#1c1917]/50 border border-[#292524] rounded-xl hover:border-[#d4b8a0]/30 transition-colors duration-300">
                <div class="flex items-start gap-6">
                  <span class="font-display text-4xl text-[#d4b8a0]/30 group-hover:text-[#d4b8a0]/60 transition-colors">03</span>
                  <div>
                    <h3 class="font-display text-xl mb-2">Ressources partagées</h3>
                    <p class="text-sm text-[#78716c] leading-relaxed">
                      Documents et contenus au bon moment, pour prolonger le travail.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UButton to="/login" variant="link" class="alt-link group self-start">
              Découvrir l'expérience
              <template #trailing>
                <Icon name="lucide:arrow-right" class="group-hover:translate-x-2 transition-transform duration-300" />
              </template>
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Parcours Section -->
    <section id="parcours" class="relative py-32 lg:py-48 bg-[#0f0f0e]">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#292524] to-transparent" />

      <div class="px-6 lg:px-12 max-w-7xl mx-auto">
        <!-- Section header -->
        <div class="grid lg:grid-cols-12 gap-12 mb-20">
          <div class="lg:col-span-4">
            <span class="text-[#d4b8a0] text-xs tracking-[0.4em] uppercase">02 — Le parcours</span>
          </div>
          <div class="lg:col-span-8">
            <h2 class="font-display text-5xl lg:text-7xl leading-[1.05] tracking-[-0.02em]">
              Une trajectoire
              <span class="italic text-[#d4b8a0]">simple</span>
            </h2>
          </div>
        </div>

        <!-- Journey steps - Editorial timeline -->
        <div class="relative">
          <!-- Vertical line -->
          <div class="hidden lg:block absolute left-[16.666%] top-0 bottom-0 w-px bg-gradient-to-b from-[#d4b8a0]/40 via-[#d4b8a0]/20 to-transparent" />

          <div class="space-y-24">
            <!-- Step 1 -->
            <div class="grid lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-2 relative">
                <div class="lg:absolute lg:right-0 lg:translate-x-1/2 w-12 h-12 rounded-full bg-[#d4b8a0] flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-lg">01</span>
                </div>
              </div>
              <div class="lg:col-span-4">
                <h3 class="font-display text-3xl mb-4">Mise en place</h3>
                <p class="text-[#78716c] leading-relaxed">
                  Votre page publique et vos créneaux se configurent en quelques minutes.
                  Une identité qui vous ressemble, sans effort technique.
                </p>
              </div>
              <div class="lg:col-span-6">
                <div class="bg-[#1c1917] rounded-xl p-2 border border-[#292524]">
                  <img
                    src="/images/marketing-screen-calendar.svg"
                    class="w-full rounded-lg opacity-80"
                    alt="Configuration"
                    loading="lazy"
                  >
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="grid lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-2 relative">
                <div class="lg:absolute lg:right-0 lg:translate-x-1/2 w-12 h-12 rounded-full bg-[#d4b8a0]/80 flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-lg">02</span>
                </div>
              </div>
              <div class="lg:col-span-4">
                <h3 class="font-display text-3xl mb-4">Automatisation</h3>
                <p class="text-[#78716c] leading-relaxed">
                  Paiements, confirmations, rappels : le flux suit naturellement.
                  La structure devient invisible, la relation reste au centre.
                </p>
              </div>
              <div class="lg:col-span-6">
                <div class="bg-[#1c1917] rounded-xl p-2 border border-[#292524]">
                  <img
                    src="/images/marketing-screen-payments.svg"
                    class="w-full rounded-lg opacity-80"
                    alt="Automatisation"
                    loading="lazy"
                  >
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="grid lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-2 relative">
                <div class="lg:absolute lg:right-0 lg:translate-x-1/2 w-12 h-12 rounded-full bg-[#d4b8a0]/60 flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-lg">03</span>
                </div>
              </div>
              <div class="lg:col-span-4">
                <h3 class="font-display text-3xl mb-4">Expérience client</h3>
                <p class="text-[#78716c] leading-relaxed">
                  Contenus, suivi et ressources partagés au bon moment.
                  Vos clientes restent engagées, sans surcharge.
                </p>
              </div>
              <div class="lg:col-span-6">
                <div class="bg-[#1c1917] rounded-xl p-2 border border-[#292524]">
                  <img
                    src="/images/marketing-screen-library.svg"
                    class="w-full rounded-lg opacity-80"
                    alt="Ressources"
                    loading="lazy"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="temoignages" class="relative py-32 lg:py-48">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#292524] to-transparent" />

      <div class="px-6 lg:px-12 max-w-7xl mx-auto">
        <!-- Section header -->
        <div class="grid lg:grid-cols-12 gap-12 mb-20">
          <div class="lg:col-span-4">
            <span class="text-[#d4b8a0] text-xs tracking-[0.4em] uppercase">03 — Témoignages</span>
          </div>
          <div class="lg:col-span-8">
            <h2 class="font-display text-5xl lg:text-7xl leading-[1.05] tracking-[-0.02em]">
              Échos de
              <span class="italic text-[#d4b8a0]">métamorphoses</span>
            </h2>
          </div>
        </div>

        <!-- Testimonials grid -->
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Testimonial 1 -->
          <div class="group relative p-8 bg-[#1c1917]/30 border border-[#292524] rounded-2xl hover:bg-[#1c1917]/50 transition-all duration-500">
            <div class="absolute top-8 right-8 font-display text-6xl text-[#d4b8a0]/10 group-hover:text-[#d4b8a0]/20 transition-colors">"</div>
            <div class="relative">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4b8a0] to-[#b5c0a3] flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-xl">I</span>
                </div>
                <div>
                  <p class="font-display text-lg">Isabelle</p>
                  <p class="text-xs text-[#78716c] uppercase tracking-widest">Coach</p>
                </div>
              </div>
              <p class="font-display text-xl italic text-[#a8a29e] leading-relaxed">
                "Enfin un outil qui ne me donne pas l'impression de gérer une usine."
              </p>
            </div>
          </div>

          <!-- Testimonial 2 -->
          <div class="group relative p-8 bg-[#1c1917]/30 border border-[#292524] rounded-2xl hover:bg-[#1c1917]/50 transition-all duration-500 md:mt-12">
            <div class="absolute top-8 right-8 font-display text-6xl text-[#d4b8a0]/10 group-hover:text-[#d4b8a0]/20 transition-colors">"</div>
            <div class="relative">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#b5c0a3] to-[#d4b8a0] flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-xl">C</span>
                </div>
                <div>
                  <p class="font-display text-lg">Claire</p>
                  <p class="text-xs text-[#78716c] uppercase tracking-widest">Naturopathe</p>
                </div>
              </div>
              <p class="font-display text-xl italic text-[#a8a29e] leading-relaxed">
                "Kaora a rendu mon parcours client plus fluide. C'est simple, doux, efficace."
              </p>
            </div>
          </div>

          <!-- Testimonial 3 -->
          <div class="group relative p-8 bg-[#1c1917]/30 border border-[#292524] rounded-2xl hover:bg-[#1c1917]/50 transition-all duration-500">
            <div class="absolute top-8 right-8 font-display text-6xl text-[#d4b8a0]/10 group-hover:text-[#d4b8a0]/20 transition-colors">"</div>
            <div class="relative">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4b8a0] to-[#78716c] flex items-center justify-center">
                  <span class="font-display text-[#0a0a09] text-xl">V</span>
                </div>
                <div>
                  <p class="font-display text-lg">Véronique</p>
                  <p class="text-xs text-[#78716c] uppercase tracking-widest">Thérapeute</p>
                </div>
              </div>
              <p class="font-display text-xl italic text-[#a8a29e] leading-relaxed">
                "Une interface premium, mais surtout apaisante. Mes clientes le sentent."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="relative py-32 lg:py-48">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#292524] to-transparent" />

      <!-- Large typography CTA -->
      <div class="px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <h2 class="font-display text-5xl md:text-7xl lg:text-8xl leading-[1] tracking-[-0.03em] mb-8">
          Prêt·e à créer
          <br>
          <span class="italic text-[#d4b8a0]">votre écrin ?</span>
        </h2>
        <p class="text-lg text-[#78716c] max-w-lg mx-auto mb-12">
          Rejoignez les professionnels du soin qui ont choisi le calme.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton to="/login" size="xl" class="alt-btn-primary group">
            Créer mon espace pro
            <template #trailing>
              <Icon name="lucide:arrow-right" class="group-hover:translate-x-2 transition-transform duration-300" />
            </template>
          </UButton>
          <UButton to="#atelier" size="xl" variant="ghost" class="alt-btn-ghost">
            Revoir la démo
          </UButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-[#292524] py-12 px-6 lg:px-12">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#d4b8a0] flex items-center justify-center">
            <span class="font-display text-[#0a0a09] text-sm font-semibold">K</span>
          </div>
          <span class="font-display text-lg tracking-tight">Kaora</span>
        </div>
        <p class="text-sm text-[#78716c]">
          © 2025 Kaora Studio. L'écrin digital pour vos accompagnements.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Meta for this alternative landing page
useHead({
  title: 'Kaora — L\'écrin digital pour vos accompagnements',
  meta: [
    { name: 'description', content: 'Agenda, paiements et suivi client réunis dans une expérience calme — pensée pour les métiers du soin.' }
  ]
})
</script>

<style scoped>
/* =============================================================================
 * KAORA LANDING B2B — ALTERNATIVE VERSION
 * =============================================================================
 * Direction esthétique : Éditorial Moderniste / Dark Luxury
 *
 * Contraste avec l'original :
 * - Original : Organique, doux, fond clair, formes blob, atmosphère pastorale
 * - Alternative : Éditorial, dramatique, fond sombre, lignes nettes, magazine haut de gamme
 * ============================================================================= */

.landing-alt {
  /* Custom font stack - Display font for headlines */
  --font-display: 'Fraunces', ui-serif, Georgia, serif;
}

/* Display font utility */
.font-display {
  font-family: var(--font-display);
  font-variation-settings: "SOFT" 50, "WONK" 1;
}

/* =============================================================================
 * BUTTONS
 * ============================================================================= */

.alt-btn-primary {
  --ui-bg: #d4b8a0 !important;
  --ui-color: #0a0a09 !important;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  border-radius: 9999px;
  padding-left: 2rem;
  padding-right: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alt-btn-primary:hover {
  --ui-bg: #c4a890 !important;
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -12px rgba(212, 184, 160, 0.3);
}

.alt-btn-ghost {
  font-family: var(--font-display);
  color: #a8a29e !important;
  border: 1px solid #292524 !important;
  border-radius: 9999px;
  padding-left: 2rem;
  padding-right: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alt-btn-ghost:hover {
  color: #fafaf8 !important;
  border-color: #d4b8a0 !important;
  background: transparent !important;
}

.alt-link {
  color: #d4b8a0 !important;
  font-family: var(--font-display);
  text-decoration: none !important;
}

.alt-link:hover {
  text-decoration: none !important;
}

/* =============================================================================
 * HERO ANIMATIONS
 * ============================================================================= */

.hero-line {
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(40px);
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-circle {
  animation: expandCircle 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: scale(0.8) translateY(-50%);
}

@keyframes expandCircle {
  to {
    opacity: 1;
    transform: scale(1) translateY(-50%);
  }
}

.hero-mockup {
  animation: floatIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
  opacity: 0;
  transform: translateY(60px);
}

@keyframes floatIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-card {
  animation: cardFloat 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes cardFloat {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.scroll-line {
  animation: scrollPulse 2s ease-in-out infinite;
}

@keyframes scrollPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scaleY(1);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

/* =============================================================================
 * HOVER & INTERACTIVE STATES
 * ============================================================================= */

/* Smooth image hover */
section img {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

section:hover img {
  transform: scale(1.02);
}

/* Link underline animation */
nav a {
  position: relative;
}

nav a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1px;
  background: #d4b8a0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

nav a:hover::after {
  width: 100%;
}

/* =============================================================================
 * RESPONSIVE ADJUSTMENTS
 * ============================================================================= */

@media (max-width: 768px) {
  .hero-line {
    animation-delay: 0s !important;
  }

  .font-display {
    font-variation-settings: "SOFT" 70, "WONK" 0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-line,
  .hero-circle,
  .hero-mockup,
  .floating-card {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .scroll-line {
    animation: none;
  }
}
</style>
