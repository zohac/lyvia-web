<script setup lang="ts">
// Import explicite obligatoire — pathPrefix Nuxt auto-import renommerait en OrganismsWaitlistForm (retro Epic 11)
import WaitlistForm from '~/components/organisms/WaitlistForm.vue'

const isWaitlistModalOpen = ref(false)

// --- Comparatif outils fragmentés ---
const fragmentedTools = [
  { name: 'Calendly', icon: 'i-lucide-calendar' },
  { name: 'Stripe', icon: 'i-lucide-credit-card' },
  { name: 'Excel', icon: 'i-lucide-table' },
  { name: 'WordPress', icon: 'i-lucide-globe' },
  { name: 'Gmail', icon: 'i-lucide-mail' }
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f8f6fa]">
    <!-- Ambient gradient mesh background -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <div
        class="absolute -left-[20%] -top-[10%] h-[70vh] w-[70vh] rounded-full opacity-60"
        style="background: radial-gradient(circle at 30% 30%, rgba(122, 107, 142, 0.4), rgba(91, 75, 110, 0.15) 50%, transparent 70%); filter: blur(80px);"
      />
      <div
        class="absolute -bottom-[20%] -right-[10%] h-[80vh] w-[80vh] rounded-full opacity-50"
        style="background: radial-gradient(circle at 70% 70%, rgba(212, 149, 106, 0.35), rgba(232, 149, 96, 0.1) 50%, transparent 70%); filter: blur(100px);"
      />
    </div>

    <!-- ====================== HERO SECTION ====================== -->
    <section
      id="essence"
      class="relative min-h-screen px-6 pb-24 pt-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <div class="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <!-- Content -->
          <div class="animate-section relative z-10 flex flex-col gap-8">
            <!-- Eyebrow beta -->
            <div class="flex items-center gap-4">
              <span class="h-[2px] w-12 rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#d4956a]" />
              <span class="text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
                Beta privée — Places limitées
              </span>
            </div>

            <!-- Main headline -->
            <h1 class="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] text-[#221d28]">
              Votre espace pro
              <br>
              <span class="relative inline-block">
                pour accompagner
                <span class="absolute -bottom-2 left-0 h-3 w-full -skew-x-6 bg-gradient-to-r from-[#e89560] to-[#d4956a] opacity-30" />
              </span>
              <br>
              <span class="bg-gradient-to-r from-[#5b4b6e] to-[#d4956a] bg-clip-text text-transparent">
                les femmes en ménopause
              </span>.
            </h1>

            <!-- Description -->
            <p class="max-w-md text-lg leading-relaxed text-[#4a4255]">
              Keova réunit agenda, paiements et suivi client dans une expérience calme
              — pensée pour les métiers du soin, pas pour les dashboards bruyants.
            </p>
            <p class="max-w-md text-sm text-[#857d8c]">
              Keova est en beta privée avec un nombre limité de praticiennes.
              Inscrivez-vous pour être prévenue de l'ouverture.
            </p>

            <!-- CTAs -->
            <div class="flex flex-col gap-4 pt-2 sm:flex-row">
              <UButton
                size="xl"
                class="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                @click="isWaitlistModalOpen = true"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Rejoindre la liste d'attente
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </UButton>

              <UButton
                size="xl"
                variant="ghost"
                class="group rounded-full border-2 border-[#d7cfdf] px-8 py-4 font-semibold text-[#4d3f5c] transition-all duration-300 hover:border-[#9685ab] hover:bg-[#f5f3f7]"
                @click="scrollTo('atelier')"
              >
                <UIcon
                  name="i-lucide-play-circle"
                  class="size-5 transition-transform duration-300 group-hover:scale-110"
                />
                Découvrir
              </UButton>
            </div>

            <!-- Login link discret -->
            <NuxtLink
              to="/login"
              class="self-start text-sm text-[#857d8c] underline-offset-2 transition-colors duration-200 hover:text-[#5b4b6e] hover:underline"
            >
              Déjà inscrite ? Se connecter
            </NuxtLink>

            <!-- Trust badges -->
            <div class="flex flex-wrap gap-3">
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                Beta privée
              </span>
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                Places limitées
              </span>
              <span class="rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm transition-all duration-300 hover:border-[#f0b48f] hover:bg-white">
                White-label
              </span>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative flex items-center justify-center lg:justify-end">
            <!-- Floating elements -->
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

            <div class="relative w-full max-w-lg">
              <div class="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[#b9aac7] to-[#f0b48f] opacity-50 blur-[40px]" />
              <div class="overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-2xl backdrop-blur-sm">
                <NuxtImg
                  src="/images/marketing-dashboard-mockup.svg"
                  class="w-full rounded-2xl"
                  alt="Interface Keova — agenda, paiements et suivi client"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div class="flex flex-col items-center gap-2 text-[#9685ab]">
            <span class="text-xs font-medium uppercase tracking-widest">Explorer</span>
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

    <!-- ====================== POURQUOI KEOVA ====================== -->
    <section
      id="pourquoi"
      class="animate-section relative px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-4xl text-center">
        <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
        <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
          Moins d'onglets.
          <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">Plus de présence.</span>
        </h2>

        <div class="mt-16 flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
          <!-- 5 outils fragmentés -->
          <div class="flex flex-wrap justify-center gap-4">
            <div
              v-for="tool in fragmentedTools"
              :key="tool.name"
              class="flex flex-col items-center gap-2 rounded-2xl border border-[#ebe7ef] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <UIcon
                :name="tool.icon"
                class="size-8 text-[#857d8c]"
              />
              <span class="text-xs text-[#857d8c]">{{ tool.name }}</span>
            </div>
          </div>

          <!-- Flèche -->
          <UIcon
            name="i-lucide-arrow-right"
            class="hidden size-8 text-[#d4956a] lg:block"
          />
          <UIcon
            name="i-lucide-arrow-down"
            class="size-8 text-[#d4956a] lg:hidden"
          />

          <!-- Bloc Keova -->
          <div class="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-[#5b4b6e] to-[#4d3f5c] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <UIcon
              name="i-lucide-sparkles"
              class="size-10"
            />
            <span class="text-lg font-semibold">Keova</span>
            <span class="text-sm opacity-80">Tout-en-un</span>
          </div>
        </div>

        <p class="mt-8 text-lg text-[#857d8c]">
          5 outils, 5 abonnements &rarr; 1 seul espace
        </p>
      </div>
    </section>

    <!-- ====================== ATELIER SECTION ====================== -->
    <section
      id="atelier"
      class="animate-section relative bg-gradient-to-b from-transparent via-[#f0edf3] to-transparent px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col items-center gap-16 lg:flex-row lg:gap-20">
          <!-- Image -->
          <div class="relative w-full lg:w-1/2">
            <div class="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-40 blur-[30px]" />
            <div class="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur-sm">
              <NuxtImg
                src="/images/marketing-screen-calendar.svg"
                class="w-full rounded-2xl"
                alt="Agenda Keova"
                loading="lazy"
              />
            </div>
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
                Un outil pensé pour les
                <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">spécialistes ménopause</span>
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
              variant="link"
              class="group -ml-2 self-start text-[#5b4b6e] hover:text-[#c47a4a]"
              @click="scrollTo('waitlist')"
            >
              <span class="flex items-center gap-2 font-semibold">
                Rejoindre la beta
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </UButton>

            <!-- Feature cards -->
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

    <!-- ====================== PARCOURS SECTION ====================== -->
    <section
      id="parcours"
      class="animate-section relative px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div class="mb-20 text-center">
          <span class="mb-4 inline-block bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
            Le parcours
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Une trajectoire
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">simple</span>
          </h2>
        </div>

        <div class="relative">
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
                    alt="Configuration agenda"
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
                    alt="Automatisation paiements"
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

    <!-- ====================== CASE STUDY SOPHIE ====================== -->
    <section class="animate-section relative bg-gradient-to-b from-transparent via-[#f5f3f7] to-transparent px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-4xl">
        <!-- Badge -->
        <div class="mb-8 text-center">
          <span class="inline-block rounded-full bg-[#fbeade] px-4 py-2 text-sm font-semibold text-[#a3603e]">
            Première spécialiste vérifiée sur Keova
          </span>
        </div>

        <div class="overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl lg:p-12">
          <div class="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            <!-- Avatar initiales -->
            <div class="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#d7cfdf] to-[#ebe7ef] text-3xl font-bold text-[#4d3f5c] transition-transform duration-500 hover:scale-105">
              SJ
            </div>

            <div class="flex-1">
              <!-- Citation -->
              <UIcon
                name="i-lucide-quote"
                class="mb-3 size-8 text-[#d4956a]"
              />
              <blockquote class="font-serif text-xl italic leading-relaxed text-[#4a4255]">
                &laquo;&nbsp;Keova a remplacé mes 5 outils par un seul espace calme.&nbsp;&raquo;
              </blockquote>

              <p class="mt-4 font-semibold text-[#3d3250]">
                Sophie Jouan
              </p>
              <p class="text-sm text-[#857d8c]">
                Sophrologue spécialisée ménopause
              </p>

              <!-- Comparatif avant/après -->
              <div class="mt-6 flex flex-wrap items-center gap-3">
                <span class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c]">Calendly</span>
                <span class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c]">Stripe</span>
                <span class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c]">Excel</span>
                <span class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c]">WordPress</span>
                <span class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c]">Gmail</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-5 text-[#d4956a]"
                />
                <span class="rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] px-4 py-1 text-xs font-semibold text-white">
                  Keova
                </span>
              </div>

              <!-- Lien -->
              <a
                href="https://sophie-jouan.fr"
                target="_blank"
                rel="noopener"
                class="mt-4 inline-flex items-center gap-1 text-sm text-[#5b4b6e] transition-colors duration-200 hover:text-[#c47a4a]"
              >
                Découvrir le site de Sophie
                <UIcon
                  name="i-lucide-external-link"
                  class="size-3"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====================== WAITLIST SECTION ====================== -->
    <section
      id="waitlist"
      class="animate-section relative overflow-hidden bg-gradient-to-br from-[#3d3250] via-[#352c44] to-[#221d28] px-6 py-32 sm:px-12 lg:px-20"
    >
      <!-- Accent orbs -->
      <div class="absolute -left-[10%] top-1/2 h-[50vh] w-[50vh] -translate-y-1/2 rounded-full bg-[#7a6b8e] opacity-30 blur-[60px]" />
      <div class="absolute -right-[10%] top-1/2 h-[40vh] w-[40vh] -translate-y-1/2 rounded-full bg-[#d4956a] opacity-20 blur-[60px]" />

      <div class="relative mx-auto max-w-2xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Rejoindre la
          <span class="bg-gradient-to-r from-[#e89560] to-[#f0b48f] bg-clip-text text-transparent">beta</span>
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-[#b9aac7]">
          Inscrivez-vous pour être prévenue dès qu'une place se libère.
        </p>

        <div class="mt-10">
          <WaitlistForm mode="inline" />
        </div>
      </div>
    </section>

    <!-- ====================== WAITLIST MODAL ====================== -->
    <UModal
      v-model:open="isWaitlistModalOpen"
      title="Rejoindre la beta Keova"
      description="Votre demande reste confidentielle. Aucun engagement."
    >
      <template #body>
        <WaitlistForm
          mode="modal"
          @submitted="isWaitlistModalOpen = false"
        />
      </template>
    </UModal>
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

/* Subtle section reveal on scroll via CSS (no JS IntersectionObserver needed for v1) */
.animate-section {
  animation: sectionReveal 0.8s ease-out both;
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

@keyframes sectionReveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
