<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f8f6fa]">
    <!-- Ambient gradient mesh background -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <!-- Primary gradient orb - top left -->
      <div
        class="absolute -left-[20%] -top-[10%] h-[70vh] w-[70vh] rounded-full opacity-60"
        style="background: radial-gradient(circle at 30% 30%, rgba(122, 107, 142, 0.4), rgba(91, 75, 110, 0.15) 50%, transparent 70%); filter: blur(80px);"
      />
      <!-- Accent gradient orb - bottom right -->
      <div
        class="absolute -bottom-[20%] -right-[10%] h-[80vh] w-[80vh] rounded-full opacity-50"
        style="background: radial-gradient(circle at 70% 70%, rgba(212, 149, 106, 0.35), rgba(232, 149, 96, 0.1) 50%, transparent 70%); filter: blur(100px);"
      />
    </div>

    <!-- Hero Section -->
    <section
      id="essence"
      class="relative min-h-screen px-6 pb-24 pt-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <div class="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <!-- Content -->
          <div class="relative z-10 flex flex-col gap-8">
            <!-- Eyebrow with decorative line -->
            <div class="flex items-center gap-4">
              <span class="h-[2px] w-12 rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#d4956a]" />
              <span class="text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
                Keova Studio
              </span>
            </div>

            <!-- Main headline with gradient accent -->
            <h1 class="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] text-[#221d28]">
              L'écrin digital
              <br>
              <span class="relative inline-block">
                pour vos
                <span class="absolute -bottom-2 left-0 h-3 w-full -skew-x-6 bg-gradient-to-r from-[#e89560] to-[#d4956a] opacity-30" />
              </span>
              <br>
              <span class="bg-gradient-to-r from-[#5b4b6e] to-[#d4956a] bg-clip-text text-transparent">
                accompagnements
              </span>.
            </h1>

            <!-- Description -->
            <p class="max-w-md text-lg leading-relaxed text-[#4a4255]">
              Keova réunit agenda, paiements et suivi client dans une expérience calme — pensée pour les métiers du soin,
              pas pour les dashboards bruyants.
            </p>

            <!-- CTAs -->
            <div class="flex flex-col gap-4 pt-4 sm:flex-row">
              <UButton
                to="/login"
                size="xl"
                class="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Créer mon espace pro
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </UButton>

              <UButton
                to="#atelier"
                size="xl"
                variant="ghost"
                class="group rounded-full border-2 border-[#d7cfdf] px-8 py-4 font-semibold text-[#4d3f5c] transition-all duration-300 hover:border-[#9685ab] hover:bg-[#f5f3f7]"
              >
                <UIcon
                  name="i-lucide-play-circle"
                  class="size-5 transition-transform duration-300 group-hover:scale-110"
                />
                Découvrir
              </UButton>
            </div>

            <!-- Trust badges with hover effect -->
            <div class="flex flex-wrap gap-3 pt-2">
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                Essai gratuit
              </span>
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                Sans carte bancaire
              </span>
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                White-label
              </span>
            </div>
          </div>

          <!-- Hero Visual - Floating dashboard mockup -->
          <div class="relative flex items-center justify-center lg:justify-end">
            <!-- Decorative floating elements -->
            <div class="animate-float absolute -left-8 top-1/4 z-20 hidden lg:block">
              <div class="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-xl backdrop-blur-md">
                <div class="flex items-center gap-3">
                  <div class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a]">
                    <UIcon
                      name="i-lucide-calendar-check"
                      class="size-5 text-white"
                    />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-[#857d8c]">
                      Nouveau RDV
                    </p>
                    <p class="font-semibold text-[#4d3f5c]">
                      Marie D.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="animate-float-delayed absolute -right-4 bottom-1/4 z-20 hidden lg:block">
              <div class="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-xl backdrop-blur-md">
                <div class="flex items-center gap-3">
                  <div class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#4ade80] to-[#4a8b6e]">
                    <UIcon
                      name="i-lucide-check"
                      class="size-5 text-white"
                    />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-[#857d8c]">
                      Paiement reçu
                    </p>
                    <p class="font-semibold text-[#4d3f5c]">
                      120 €
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main dashboard card -->
            <div class="relative w-full max-w-lg">
              <!-- Glow effect behind card -->
              <div class="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[#b9aac7] to-[#f0b48f] opacity-50 blur-[40px]" />

              <div class="overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-2xl backdrop-blur-sm">
                <NuxtImg
                  src="/images/marketing-dashboard-mockup.svg"
                  class="w-full rounded-2xl"
                  alt="Interface Keova"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div class="flex flex-col items-center gap-2 text-[#9685ab]">
            <span class="text-xs font-medium uppercase tracking-widest">
              Explorer
            </span>
            <div class="relative h-8 w-5 rounded-full border-2 border-current">
              <div
                class="absolute left-1/2 top-1.5 h-2 w-1 -translate-x-1/2 rounded-full bg-current"
                style="animation: scrollBounce 2s ease-in-out infinite;"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Atelier Section -->
    <section
      id="atelier"
      class="relative bg-gradient-to-b from-transparent via-[#f0edf3] to-transparent px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col items-center gap-16 lg:flex-row lg:gap-20">
          <!-- Image with decorative frame -->
          <div class="relative w-full lg:w-1/2">
            <!-- Decorative accent -->
            <div class="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-40 blur-[30px]" />

            <div class="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur-sm">
              <NuxtImg
                src="/images/marketing-screen-calendar.svg"
                class="w-full rounded-2xl"
                alt="Agenda Keova"
                loading="lazy"
              />
            </div>

            <!-- Quote card floating -->
            <div class="animate-float-slow absolute -bottom-6 -right-6 max-w-xs rounded-2xl border border-white/50 bg-white/90 p-5 shadow-lg backdrop-blur-md lg:-right-12">
              <UIcon
                name="i-lucide-quote"
                class="mb-2 size-6 text-[#d4956a]"
              />
              <p class="font-serif text-base italic text-[#4d3f5c]">
                "On ne gère pas des clientes. On les accompagne."
              </p>
            </div>
          </div>

          <!-- Content -->
          <div class="flex w-full flex-col gap-8 lg:w-1/2">
            <div>
              <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
              <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
                L'atelier
                <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">Keova</span>
              </h2>
            </div>

            <p class="text-lg leading-relaxed text-[#4a4255]">
              Une interface qui se vit comme un espace de travail calme : rendez-vous, paiements et ressources sont
              orchestrés sans effort.
            </p>

            <p class="text-[#857d8c]">
              Chaque détail vise à réduire la charge mentale. Vous gardez la relation, Keova garde la structure.
            </p>

            <UButton
              to="/login"
              variant="link"
              class="group -ml-2 self-start text-[#5b4b6e] hover:text-[#c47a4a]"
            >
              <span class="flex items-center gap-2 font-semibold">
                Découvrir l'expérience
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </UButton>

            <!-- Feature cards with hover effect -->
            <div class="grid gap-4 pt-4">
              <div class="group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6 transition-all duration-300 hover:border-[#d7cfdf] hover:shadow-lg">
                <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                <div class="flex items-start gap-4">
                  <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7]">
                    <UIcon
                      name="i-lucide-credit-card"
                      class="size-6 text-[#5b4b6e]"
                    />
                  </div>
                  <div>
                    <p class="font-semibold text-[#3d3250]">
                      Paiements
                    </p>
                    <p class="mt-1 text-sm text-[#857d8c]">
                      Stripe, factures, statuts : la trésorerie devient lisible, sans effort.
                    </p>
                  </div>
                </div>
              </div>

              <div class="group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6 transition-all duration-300 hover:border-[#d7cfdf] hover:shadow-lg">
                <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                <div class="flex items-start gap-4">
                  <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7]">
                    <UIcon
                      name="i-lucide-folder-heart"
                      class="size-6 text-[#5b4b6e]"
                    />
                  </div>
                  <div>
                    <p class="font-semibold text-[#3d3250]">
                      Ressources
                    </p>
                    <p class="mt-1 text-sm text-[#857d8c]">
                      Des contenus au bon moment, pour prolonger le travail entre les séances.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Parcours Section -->
    <section
      id="parcours"
      class="relative px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <!-- Section header -->
        <div class="mb-20 text-center">
          <span class="mb-4 inline-block bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
            Le parcours
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Une trajectoire
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">simple</span>
          </h2>
        </div>

        <!-- Journey steps with connecting line -->
        <div class="relative">
          <!-- Connecting gradient line -->
          <div class="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#d7cfdf] via-[#f0b48f] to-[#d7cfdf] lg:block" />

          <div class="grid gap-12 lg:gap-24">
            <!-- Step 1 -->
            <div class="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div class="order-2 lg:order-1 lg:text-right">
                <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ebe7ef] px-4 py-2 text-sm font-semibold text-[#4d3f5c]">
                  <span class="grid size-6 place-items-center rounded-full bg-[#5b4b6e] text-xs font-bold text-white">1</span>
                  Mise en place
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  Une page, un agenda.
                </h3>
                <p class="mt-4 text-[#857d8c]">
                  Votre page publique et vos créneaux se configurent en douceur. Quelques minutes suffisent.
                </p>
              </div>
              <div class="order-1 lg:order-2">
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg">
                  <NuxtImg
                    src="/images/marketing-screen-calendar.svg"
                    class="w-full rounded-xl"
                    alt="Configuration"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div class="order-2">
                <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fbeade] px-4 py-2 text-sm font-semibold text-[#a3603e]">
                  <span class="grid size-6 place-items-center rounded-full bg-[#d4956a] text-xs font-bold text-white">2</span>
                  Automatisation
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  Le flux suit.
                </h3>
                <p class="mt-4 text-[#857d8c]">
                  Paiements, confirmations, rappels : la structure devient naturelle et invisible.
                </p>
              </div>
              <div class="order-1">
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg">
                  <NuxtImg
                    src="/images/marketing-screen-payments.svg"
                    class="w-full rounded-xl"
                    alt="Automatisation"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div class="order-2 lg:order-1 lg:text-right">
                <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ebe7ef] px-4 py-2 text-sm font-semibold text-[#4d3f5c]">
                  <span class="grid size-6 place-items-center rounded-full bg-[#5b4b6e] text-xs font-bold text-white">3</span>
                  Expérience client
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  Le soin reste.
                </h3>
                <p class="mt-4 text-[#857d8c]">
                  Contenus, suivi et ressources : vos clientes restent engagées, sans surcharge.
                </p>
              </div>
              <div class="order-1 lg:order-2">
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg">
                  <NuxtImg
                    src="/images/marketing-screen-library.svg"
                    class="w-full rounded-xl"
                    alt="Expérience client"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="relative bg-gradient-to-b from-transparent via-[#f5f3f7] to-transparent px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-6xl">
        <div class="mb-16 text-center">
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Échos de
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">métamorphoses</span>
          </h2>
        </div>

        <div class="grid gap-8 md:grid-cols-3">
          <!-- Testimonial 1 -->
          <div class="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#9685ab] to-[#e89560] opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
            <div class="relative">
              <div class="mb-6 flex items-center gap-4">
                <div class="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#d7cfdf] to-[#ebe7ef] text-xl font-bold text-[#4d3f5c]">
                  I
                </div>
                <div>
                  <p class="font-semibold text-[#3d3250]">
                    Isabelle
                  </p>
                  <span class="inline-block rounded-full bg-[#ebe7ef] px-3 py-1 text-xs font-medium text-[#5b4b6e]">
                    Coach
                  </span>
                </div>
              </div>
              <UIcon
                name="i-lucide-quote"
                class="mb-3 size-8 text-[#e89560]"
              />
              <p class="font-serif text-lg italic leading-relaxed text-[#4a4255]">
                "Enfin un outil qui ne me donne pas l'impression de gérer une usine."
              </p>
            </div>
          </div>

          <!-- Testimonial 2 - Featured -->
          <div class="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:-mt-4 md:mb-4">
            <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#e89560] to-[#9685ab] opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
            <div class="relative">
              <div class="mb-6 flex items-center gap-4">
                <div class="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#f6d2bc] to-[#fbeade] text-xl font-bold text-[#a3603e]">
                  C
                </div>
                <div>
                  <p class="font-semibold text-[#3d3250]">
                    Claire
                  </p>
                  <span class="inline-block rounded-full bg-[#fbeade] px-3 py-1 text-xs font-medium text-[#c47a4a]">
                    Naturopathe
                  </span>
                </div>
              </div>
              <UIcon
                name="i-lucide-quote"
                class="mb-3 size-8 text-[#e89560]"
              />
              <p class="font-serif text-lg italic leading-relaxed text-[#4a4255]">
                "Keova a rendu mon parcours client plus fluide. C'est simple, doux, efficace."
              </p>
            </div>
          </div>

          <!-- Testimonial 3 -->
          <div class="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#9685ab] to-[#e89560] opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
            <div class="relative">
              <div class="mb-6 flex items-center gap-4">
                <div class="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#d7cfdf] to-[#ebe7ef] text-xl font-bold text-[#4d3f5c]">
                  V
                </div>
                <div>
                  <p class="font-semibold text-[#3d3250]">
                    Véronique
                  </p>
                  <span class="inline-block rounded-full bg-[#ebe7ef] px-3 py-1 text-xs font-medium text-[#5b4b6e]">
                    Thérapeute
                  </span>
                </div>
              </div>
              <UIcon
                name="i-lucide-quote"
                class="mb-3 size-8 text-[#e89560]"
              />
              <p class="font-serif text-lg italic leading-relaxed text-[#4a4255]">
                "Une interface premium, mais surtout apaisante. Mes clientes le sentent."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#3d3250] via-[#352c44] to-[#221d28] px-6 py-32 sm:px-12 lg:px-20">
      <!-- Accent orbs -->
      <div class="absolute -left-[10%] top-1/2 h-[50vh] w-[50vh] -translate-y-1/2 rounded-full bg-[#7a6b8e] opacity-30 blur-[60px]" />
      <div class="absolute -right-[10%] top-1/2 h-[40vh] w-[40vh] -translate-y-1/2 rounded-full bg-[#d4956a] opacity-20 blur-[60px]" />

      <div class="relative mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Prête à simplifier
          <br>
          <span class="bg-gradient-to-r from-[#e89560] to-[#f0b48f] bg-clip-text text-transparent">votre pratique</span> ?
        </h2>

        <p class="mx-auto mt-6 max-w-lg text-lg text-[#b9aac7]">
          Rejoignez les professionnelles qui ont choisi Keova pour se concentrer sur l'essentiel : accompagner.
        </p>

        <div class="mt-10">
          <UButton
            to="/login"
            size="xl"
            class="group rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] px-10 py-5 font-semibold text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(212,149,106,0.4)]"
          >
            <span class="flex items-center gap-3">
              Commencer gratuitement
              <UIcon
                name="i-lucide-sparkles"
                class="size-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              />
            </span>
          </UButton>
        </div>

        <p class="mt-6 text-sm text-[#9685ab]">
          Essai gratuit · Sans carte bancaire · Configuration en 5 minutes
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 6s ease-in-out 2s infinite;
}

.animate-float-slow {
  animation: float 8s ease-in-out 1s infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes scrollBounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-50%) translateY(8px);
    opacity: 0.5;
  }
}
</style>
