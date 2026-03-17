<script setup lang="ts">
// Import explicite obligatoire — pathPrefix Nuxt auto-import renommerait en OrganismsWaitlistForm (retro Epic 11)
import WaitlistForm from '~/components/organisms/WaitlistForm.vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const isWaitlistModalOpen = ref(false)
const { reveal } = useScrollReveal()

// --- Comparatif outils fragmentés ---
const fragmentedTools = [
  { name: 'Calendly', icon: 'i-lucide-calendar', color: '#006BFF' },
  { name: 'Stripe', icon: 'i-lucide-credit-card', color: '#635BFF' },
  { name: 'Excel', icon: 'i-lucide-table', color: '#217346' },
  { name: 'WordPress', icon: 'i-lucide-globe', color: '#21759B' },
  { name: 'Gmail', icon: 'i-lucide-mail', color: '#EA4335' }
]

// --- Stats pour le social proof ---
const stats = [
  { value: '1', label: 'espace', suffix: 'unique' },
  { value: '0', label: 'commission', suffix: 'en beta' },
  { value: '5', label: 'outils', suffix: 'remplacés' }
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f8f6fa]">
    <!-- Ambient gradient mesh background — elevated depth -->
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
      <!-- Subtle center glow -->
      <div
        class="absolute left-1/2 top-1/3 h-[40vh] w-[60vh] -translate-x-1/2 rounded-full opacity-20"
        style="background: radial-gradient(ellipse, rgba(212, 149, 106, 0.3), transparent 70%); filter: blur(100px);"
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
          <div class="relative z-10 flex flex-col gap-8">
            <!-- Eyebrow beta -->
            <div class="flex items-center gap-4">
              <span class="relative h-[2px] w-12 overflow-hidden rounded-full bg-[#d7cfdf]">
                <span class="eyebrow-shimmer absolute inset-0 bg-gradient-to-r from-[#5b4b6e] via-[#d4956a] to-[#5b4b6e]" />
              </span>
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
              <span class="hero-gradient-text">
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
              <button
                class="cta-primary group relative overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-lg"
                @click="isWaitlistModalOpen = true"
              >
                <span class="cta-primary-bg" />
                <span class="relative z-10 flex items-center gap-2">
                  Rejoindre la liste d'attente
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </button>

              <button
                class="group flex items-center gap-2 rounded-full border-2 border-[#d7cfdf] px-8 py-4 font-semibold text-[#4d3f5c] transition-all duration-300 hover:border-[#9685ab] hover:bg-white/60"
                @click="scrollTo('atelier')"
              >
                <UIcon
                  name="i-lucide-play-circle"
                  class="size-5 transition-transform duration-300 group-hover:scale-110"
                />
                Découvrir
              </button>
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
              <span
                v-for="badge in ['Beta privée', 'Places limitées', 'White-label']"
                :key="badge"
                class="trust-badge rounded-full border border-[#d7cfdf] bg-white/60 px-4 py-2 text-sm font-medium text-[#4d3f5c] backdrop-blur-sm"
              >
                {{ badge }}
              </span>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative flex items-center justify-center lg:justify-end">
            <!-- Floating notification cards -->
            <div class="animate-float absolute -left-8 top-1/4 z-20 hidden lg:block">
              <div class="glass-card rounded-2xl p-4 shadow-xl">
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
              <div class="glass-card rounded-2xl p-4 shadow-xl">
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

            <!-- Main dashboard mockup -->
            <div class="relative w-full max-w-lg">
              <div class="hero-glow absolute -inset-4 -z-10 rounded-[2rem]" />
              <div class="overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-2xl backdrop-blur-sm transition-transform duration-700 hover:scale-[1.01]">
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
          <button
            class="flex flex-col items-center gap-2 text-[#9685ab] transition-colors duration-300 hover:text-[#5b4b6e]"
            @click="scrollTo('pourquoi')"
          >
            <span class="text-xs font-medium uppercase tracking-widest">Explorer</span>
            <div class="relative h-8 w-5 rounded-full border-2 border-current">
              <div class="scroll-dot absolute left-1/2 top-1.5 h-2 w-1 -translate-x-1/2 rounded-full bg-current" />
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- ====================== POURQUOI KEOVA ====================== -->
    <section
      id="pourquoi"
      class="relative px-6 py-32 sm:px-12 lg:px-20"
    >
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-4xl text-center"
      >
        <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
        <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
          Moins d'onglets.
          <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">Plus de présence.</span>
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-[#857d8c]">
          Aujourd'hui, votre quotidien c'est 5 outils, 5 mots de passe, 5 onglets.
          Et si tout tenait dans un seul espace ?
        </p>

        <div class="mt-16 flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
          <!-- 5 outils fragmentés -->
          <div class="flex flex-wrap justify-center gap-4">
            <div
              v-for="(tool, i) in fragmentedTools"
              :key="tool.name"
              v-bind="reveal({ delay: i * 100 })"
              class="scroll-reveal tool-card group flex flex-col items-center gap-2 rounded-2xl border border-[#ebe7ef] bg-white p-4 shadow-sm"
            >
              <div class="grid size-12 place-items-center rounded-xl bg-[#f5f3f7] transition-all duration-300 group-hover:bg-[#ebe7ef]">
                <UIcon
                  :name="tool.icon"
                  class="size-6 text-[#857d8c] transition-colors duration-300"
                  :style="{ '--tool-color': tool.color }"
                />
              </div>
              <span class="text-xs font-medium text-[#857d8c]">{{ tool.name }}</span>
            </div>
          </div>

          <!-- Animated arrow -->
          <div
            v-bind="reveal({ delay: 500 })"
            class="scroll-reveal"
          >
            <div class="arrow-pulse hidden lg:block">
              <UIcon
                name="i-lucide-arrow-right"
                class="size-8 text-[#d4956a]"
              />
            </div>
            <div class="arrow-pulse lg:hidden">
              <UIcon
                name="i-lucide-arrow-down"
                class="size-8 text-[#d4956a]"
              />
            </div>
          </div>

          <!-- Bloc Keova — elevated -->
          <div
            v-bind="reveal({ delay: 600 })"
            class="scroll-reveal keova-card group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b4b6e] to-[#4d3f5c] p-8 text-white shadow-xl"
          >
            <div class="keova-card-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <UIcon
              name="i-lucide-sparkles"
              class="relative size-10 transition-transform duration-500 group-hover:scale-110"
            />
            <span class="relative text-xl font-bold">Keova</span>
            <span class="relative text-sm font-medium opacity-80">Tout-en-un</span>
          </div>
        </div>

        <p
          v-bind="reveal({ delay: 700 })"
          class="scroll-reveal mt-10 font-serif text-xl italic text-[#4a4255]"
        >
          5 outils, 5 abonnements &rarr; 1 seul espace
        </p>
      </div>
    </section>

    <!-- ====================== STATS BAND ====================== -->
    <section class="relative overflow-hidden border-y border-[#ebe7ef] bg-white/60 px-6 py-12 backdrop-blur-sm sm:px-12 lg:px-20">
      <div class="mx-auto flex max-w-4xl flex-col items-center justify-around gap-8 sm:flex-row">
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          v-bind="reveal({ delay: i * 150 })"
          class="scroll-reveal flex flex-col items-center gap-1 text-center"
        >
          <span class="font-serif text-4xl text-[#5b4b6e] lg:text-5xl">{{ stat.value }}</span>
          <span class="text-sm font-semibold uppercase tracking-wider text-[#857d8c]">{{ stat.label }}</span>
          <span class="text-xs text-[#b9aac7]">{{ stat.suffix }}</span>
        </div>
      </div>
    </section>

    <!-- ====================== ATELIER SECTION ====================== -->
    <section
      id="atelier"
      class="relative bg-gradient-to-b from-transparent via-[#f0edf3] to-transparent px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col items-center gap-16 lg:flex-row lg:gap-20">
          <!-- Image -->
          <div
            v-bind="reveal()"
            class="scroll-reveal relative w-full lg:w-1/2"
          >
            <div class="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-40 blur-[30px]" />
            <div class="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur-sm transition-transform duration-500 hover:scale-[1.02]">
              <NuxtImg
                src="/images/marketing-screen-calendar.svg"
                class="w-full rounded-2xl"
                alt="Agenda Keova"
                loading="lazy"
              />
            </div>
            <!-- Floating quote -->
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
          <div
            v-bind="reveal({ delay: 200 })"
            class="scroll-reveal flex w-full flex-col gap-8 lg:w-1/2"
          >
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

            <button
              class="group -ml-2 flex items-center gap-2 self-start font-semibold text-[#5b4b6e] transition-colors duration-200 hover:text-[#c47a4a]"
              @click="scrollTo('waitlist')"
            >
              Rejoindre la beta
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <!-- Feature cards -->
            <div class="grid gap-4 pt-4">
              <div
                v-bind="reveal({ delay: 300 })"
                class="scroll-reveal feature-card group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6"
              >
                <div class="feature-card-glow absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0" />
                <div class="flex items-start gap-4">
                  <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                    <UIcon
                      name="i-lucide-credit-card"
                      class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
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

              <div
                v-bind="reveal({ delay: 400 })"
                class="scroll-reveal feature-card group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6"
              >
                <div class="feature-card-glow absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0" />
                <div class="flex items-start gap-4">
                  <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                    <UIcon
                      name="i-lucide-folder-heart"
                      class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
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
      class="relative px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-20 text-center"
        >
          <span class="mb-4 inline-block bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
            Le parcours
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Une trajectoire
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">simple</span>
          </h2>
        </div>

        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#d7cfdf] via-[#f0b48f] to-[#d7cfdf] lg:block" />

          <div class="grid gap-12 lg:gap-24">
            <!-- Step 1 -->
            <div class="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div
                v-bind="reveal()"
                class="scroll-reveal order-2 lg:order-1 lg:text-right"
              >
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
              <div
                v-bind="reveal({ delay: 200 })"
                class="scroll-reveal order-1 lg:order-2"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
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
              <div
                v-bind="reveal({ delay: 200 })"
                class="scroll-reveal order-2"
              >
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
              <div
                v-bind="reveal()"
                class="scroll-reveal order-1"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
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
              <div
                v-bind="reveal()"
                class="scroll-reveal order-2 lg:order-1 lg:text-right"
              >
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
              <div
                v-bind="reveal({ delay: 200 })"
                class="scroll-reveal order-1 lg:order-2"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
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
    <section
      id="temoignage"
      class="relative bg-gradient-to-b from-transparent via-[#f5f3f7] to-transparent px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-4xl">
        <!-- Badge -->
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-8 text-center"
        >
          <span class="inline-flex items-center gap-2 rounded-full bg-[#fbeade] px-4 py-2 text-sm font-semibold text-[#a3603e]">
            <UIcon
              name="i-lucide-badge-check"
              class="size-4"
            />
            Première spécialiste vérifiée sur Keova
          </span>
        </div>

        <div
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal case-study-card group overflow-hidden rounded-3xl bg-white p-8 shadow-xl lg:p-12"
        >
          <div class="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            <!-- Avatar initiales — elevated -->
            <div class="relative shrink-0">
              <div class="avatar-ring absolute -inset-1 rounded-full" />
              <div class="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-[#d7cfdf] to-[#ebe7ef] font-serif text-3xl font-bold text-[#4d3f5c]">
                SJ
              </div>
            </div>

            <div class="flex-1">
              <!-- Citation -->
              <UIcon
                name="i-lucide-quote"
                class="mb-3 size-8 text-[#d4956a]"
              />
              <blockquote class="font-serif text-xl italic leading-relaxed text-[#4a4255] lg:text-2xl">
                &laquo;&nbsp;Keova a remplacé mes 5 outils par un seul espace calme.&nbsp;&raquo;
              </blockquote>

              <div class="mt-4">
                <p class="font-semibold text-[#3d3250]">
                  Sophie Jouan
                </p>
                <p class="text-sm text-[#857d8c]">
                  Sophrologue spécialisée ménopause, Lyon
                </p>
              </div>

              <!-- Comparatif avant/après — enhanced -->
              <div class="mt-6 flex flex-wrap items-center gap-2">
                <span
                  v-for="tool in ['Calendly', 'Stripe', 'Excel', 'WordPress', 'Gmail']"
                  :key="tool"
                  class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#857d8c] transition-all duration-300 group-hover:bg-[#f5f3f7]"
                >{{ tool }}</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="mx-1 size-5 text-[#d4956a]"
                />
                <span class="rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] px-4 py-1 text-xs font-semibold text-white shadow-md">
                  Keova
                </span>
              </div>

              <!-- Lien -->
              <a
                href="https://sophie-jouan.fr"
                target="_blank"
                rel="noopener"
                class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#5b4b6e] transition-colors duration-200 hover:text-[#c47a4a]"
              >
                Voir le profil de Sophie Jouan, spécialiste ménopause
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
      class="relative overflow-hidden bg-gradient-to-br from-[#3d3250] via-[#352c44] to-[#221d28] px-6 py-32 sm:px-12 lg:px-20"
    >
      <!-- Ambient particles -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0"
      >
        <div class="absolute -left-[10%] top-1/2 h-[50vh] w-[50vh] -translate-y-1/2 rounded-full bg-[#7a6b8e] opacity-30 blur-[60px]" />
        <div class="absolute -right-[10%] top-1/2 h-[40vh] w-[40vh] -translate-y-1/2 rounded-full bg-[#d4956a] opacity-20 blur-[60px]" />
        <!-- Floating dots -->
        <div class="particle particle-1" />
        <div class="particle particle-2" />
        <div class="particle particle-3" />
        <div class="particle particle-4" />
        <div class="particle particle-5" />
      </div>

      <div
        v-bind="reveal()"
        class="scroll-reveal relative mx-auto max-w-2xl text-center"
      >
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Rejoindre la
          <span class="bg-gradient-to-r from-[#e89560] to-[#f0b48f] bg-clip-text text-transparent">beta</span>
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-[#b9aac7]">
          Inscrivez-vous pour être prévenue dès qu'une place se libère.
        </p>
        <p class="mt-2 text-sm text-[#857d8c]">
          Aucune carte bancaire. Aucun engagement. Juste un email.
        </p>

        <div class="mt-10">
          <WaitlistForm mode="inline" />
        </div>
      </div>
    </section>

    <!-- ====================== WAITLIST MODAL ====================== -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isWaitlistModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-[#221d28]/60 backdrop-blur-sm"
            @click="isWaitlistModalOpen = false"
          />

          <!-- Modal card -->
          <div class="modal-card relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <!-- Gradient header band -->
            <div class="relative overflow-hidden bg-gradient-to-r from-[#5b4b6e] via-[#7a6b8e] to-[#5b4b6e] px-8 pb-6 pt-8">
              <div
                class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d4956a] opacity-20 blur-[40px]"
                aria-hidden="true"
              />
              <button
                class="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
                @click="isWaitlistModalOpen = false"
              >
                <UIcon
                  name="i-lucide-x"
                  class="size-5"
                />
              </button>
              <h3 class="font-serif text-2xl text-white">
                Rejoindre la beta
                <span class="bg-gradient-to-r from-[#f0b48f] to-[#e89560] bg-clip-text text-transparent">Keova</span>
              </h3>
              <p class="mt-1 text-sm text-[#d7cfdf]">
                Votre demande reste confidentielle. Aucun engagement.
              </p>
            </div>

            <!-- Form body -->
            <div class="px-8 py-6">
              <WaitlistForm
                mode="modal"
                @submitted="isWaitlistModalOpen = false"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* =================================================================================================
 * MODAL TRANSITIONS
 * ================================================================================================= */

.modal-enter-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-card {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-leave-active .modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-card {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-card {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* =================================================================================================
 * ANIMATIONS
 * ================================================================================================= */

/* --- Scroll reveal base --- */
.scroll-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* --- Float animations --- */
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
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

/* --- Hero gradient text animation --- */
.hero-gradient-text {
  background: linear-gradient(
    135deg,
    #5b4b6e 0%,
    #d4956a 25%,
    #5b4b6e 50%,
    #d4956a 75%,
    #5b4b6e 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 6s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

/* --- Eyebrow shimmer --- */
.eyebrow-shimmer {
  animation: shimmer 3s ease-in-out infinite;
  background-size: 200% 100%;
}

@keyframes shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* --- Scroll indicator bounce --- */
.scroll-dot {
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
  50% { transform: translateX(-50%) translateY(8px); opacity: 0.5; }
}

/* =================================================================================================
 * GLASS & CARD EFFECTS
 * ================================================================================================= */

.glass-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* --- Hero mockup glow --- */
.hero-glow {
  background: linear-gradient(135deg, #b9aac7, #f0b48f);
  opacity: 0.5;
  filter: blur(40px);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.02); }
}

/* --- CTA primary with animated gradient border --- */
.cta-primary {
  position: relative;
  background: linear-gradient(135deg, #5b4b6e, #4d3f5c);
  transition: transform 0.3s, box-shadow 0.3s;
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(91, 75, 110, 0.3);
}

.cta-primary-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #5b4b6e, #7a6b8e, #5b4b6e);
  background-size: 200% 100%;
  opacity: 0;
  transition: opacity 0.3s;
}

.cta-primary:hover .cta-primary-bg {
  opacity: 1;
  animation: gradientSlide 2s ease-in-out infinite;
}

@keyframes gradientSlide {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

/* --- Trust badges hover --- */
.trust-badge {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.trust-badge:hover {
  border-color: #f0b48f;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 75, 110, 0.08);
}

/* --- Tool cards --- */
.tool-card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.12);
}

/* --- Arrow pulse --- */
.arrow-pulse {
  animation: arrowPulse 2s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* --- Keova card glow --- */
.keova-card-glow {
  background: radial-gradient(circle at center, rgba(212, 149, 106, 0.3), transparent 70%);
}

/* --- Feature cards --- */
.feature-card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-card:hover {
  border-color: #d7cfdf;
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
}

.feature-card:hover .feature-card-glow {
  opacity: 0.2;
  transition: opacity 0.3s;
}

/* --- Case study card --- */
.case-study-card {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.case-study-card:hover {
  box-shadow: 0 20px 50px rgba(91, 75, 110, 0.15);
  transform: translateY(-2px);
}

/* --- Avatar ring --- */
.avatar-ring {
  background: linear-gradient(135deg, #d4956a, #5b4b6e, #d4956a);
  background-size: 200% 200%;
  animation: ringRotate 4s linear infinite;
  opacity: 0.6;
}

@keyframes ringRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* =================================================================================================
 * WAITLIST PARTICLES
 * ================================================================================================= */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(212, 149, 106, 0.4);
}

.particle-1 { top: 20%; left: 10%; animation: particleFloat 8s ease-in-out infinite; }
.particle-2 { top: 60%; left: 85%; animation: particleFloat 10s ease-in-out 1s infinite; }
.particle-3 { top: 30%; left: 70%; animation: particleFloat 7s ease-in-out 2s infinite; width: 3px; height: 3px; background: rgba(185, 170, 199, 0.3); }
.particle-4 { top: 80%; left: 25%; animation: particleFloat 9s ease-in-out 3s infinite; width: 5px; height: 5px; background: rgba(212, 149, 106, 0.25); }
.particle-5 { top: 45%; left: 50%; animation: particleFloat 11s ease-in-out 0.5s infinite; width: 3px; height: 3px; background: rgba(185, 170, 199, 0.2); }

@keyframes particleFloat {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  25% { transform: translate(10px, -20px) scale(1.2); opacity: 0.7; }
  50% { transform: translate(-5px, -40px) scale(0.8); opacity: 0.5; }
  75% { transform: translate(15px, -20px) scale(1.1); opacity: 0.6; }
}
</style>
