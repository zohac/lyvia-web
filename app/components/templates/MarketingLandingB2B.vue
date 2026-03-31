<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

// Import explicite obligatoire — pathPrefix Nuxt auto-import renommerait en OrganismsWaitlistForm (retro Epic 11)
import WaitlistForm from '~/components/organisms/WaitlistForm.vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const isWaitlistModalOpen = ref(false)
const { reveal, isReady: scrollReady } = useScrollReveal()

// --- Comparatif outils fragmentés ---
const fragmentedTools = [
  { name: 'Calendly', icon: 'i-lucide-calendar', color: '#006BFF' },
  { name: 'Stripe', icon: 'i-lucide-credit-card', color: '#635BFF' },
  { name: 'Excel', icon: 'i-lucide-table', color: '#217346' },
  { name: 'WordPress', icon: 'i-lucide-globe', color: '#21759B' },
  { name: 'Doctolib', icon: 'i-lucide-stethoscope', color: '#0596DE' }
]

// --- Stats pour le social proof ---
const stats = [
  { value: '1', label: 'seul espace' },
  { value: '0\u00A0%', label: 'de commission' },
  { value: '10\u00A0min', label: 'pour démarrer' }
]

// --- Features V5 ---
const features = [
  {
    icon: 'i-lucide-calendar',
    title: 'Agenda en ligne',
    paragraphs: [
      'Vos clientes réservent en ligne, 24h/24. Confirmation et rappel envoyés automatiquement. Plus de SMS « on était bien mardi à 14h\u00A0? ».',
      'Vous choisissez vos créneaux, Keova gère les disponibilités. Les rendez-vous apparaissent dans votre agenda — sans double saisie.'
    ]
  },
  {
    icon: 'i-lucide-credit-card',
    title: 'Paiements automatiques',
    paragraphs: [
      'Votre cliente paie en 1 clic après la séance. Facture envoyée automatiquement. Relance si impayé. Vous ne touchez à rien.',
      'Stripe intégré, conforme aux normes françaises. Votre trésorerie est visible en temps réel — plus besoin d\'Excel.'
    ]
  },
  {
    icon: 'i-lucide-folder-heart',
    title: 'Suivi client et ressources',
    paragraphs: [
      'Envoyez un exercice après la séance, une fiche à J+7, ou structurez un programme complet — 6, 8, 12 séances. Chaque cliente reçoit le bon contenu au bon moment.',
      'L\'historique des séances et les notes sont centralisés. Vous retrouvez le dossier d\'une cliente en 2 clics.'
    ]
  }
]

// --- FAQ V5 ---
const faqItems: AccordionItem[] = [
  {
    label: 'Keova est-il gratuit\u00A0?',
    content: 'Oui, pendant toute la durée de la beta. Au lancement, les premières inscrites bénéficieront d\'une réduction sur leur première année — bien en-dessous de ce que coûtent 5 outils séparément.',
    value: 'faq-1'
  },
  {
    label: 'Quelles sont les fonctionnalités de Keova\u00A0?',
    content: 'Keova réunit trois fonctionnalités principales :\n— Agenda en ligne avec réservation et rappels automatiques\n— Paiements intégrés (Stripe) avec facturation et relance automatiques\n— Suivi client avec partage de ressources et programmes structurés\n\nD\'autres fonctionnalités sont en cours de développement, co-construites avec les praticiennes de la beta.',
    value: 'faq-2'
  },
  {
    label: 'Est-ce que Keova remplace Doctolib\u00A0?',
    content: 'Keova n\'est pas un annuaire de praticiens. C\'est votre espace de gestion : agenda, paiements, suivi client, tout-en-un. Doctolib vous donne de la visibilité. Keova gère tout ce qui se passe après le premier contact. Les deux peuvent coexister.',
    value: 'faq-3'
  },
  {
    label: 'Comment migrer depuis Calendly ou un autre outil\u00A0?',
    content: 'Vous n\'avez rien à migrer. Créez votre page Keova en 10 minutes, partagez le lien à vos clientes, et les nouvelles réservations passent par Keova. Vos anciens outils peuvent rester actifs le temps de la transition.',
    value: 'faq-4'
  },
  {
    label: 'Mes données sont-elles en sécurité\u00A0?',
    content: 'Keova est développé et hébergé en France. Vos données et celles de vos clientes ne quittent jamais le territoire français. Les paiements sont sécurisés par Stripe, leader mondial du paiement en ligne. Keova est conforme au RGPD.',
    value: 'faq-5'
  },
  {
    label: 'Keova est-il adapté si j\'ai peu de clientes\u00A0?',
    content: 'Oui. Keova est particulièrement utile quand vous démarrez : il vous donne une page pro, un agenda en ligne et une facturation automatique dès le premier jour — sans investir dans un site web ou 5 outils différents.',
    value: 'faq-6'
  },
  {
    label: 'Puis-je utiliser Keova si je ne suis pas spécialiste ménopause\u00A0?',
    content: 'Oui. Keova est conçu pour les coachs ménopause mais fonctionne pour tous les métiers de l\'accompagnement : sophrologie, naturopathie, coaching bien-être, coaching de vie. Les fonctionnalités (agenda, paiements, suivi) sont les mêmes.',
    value: 'faq-7'
  }
]

// FAQ SSR: all items open on server, closed after hydration (crawlability)
const allFaqValues = faqItems.map(item => item.value).filter((v): v is string => !!v)
const faqDefaultValue = ref<string[]>(allFaqValues)

onMounted(() => {
  faqDefaultValue.value = []
})

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div
    :class="['relative min-h-screen overflow-hidden bg-[#f8f6fa]', { 'js-scroll-ready': scrollReady }]"
  >
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
      class="relative min-h-[calc(100svh-80px)] px-6 pb-24 pt-32 sm:px-12 lg:px-20"
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
              Le logiciel
              <span class="relative inline-block">
                tout-en-un
                <span class="absolute -bottom-2 left-0 h-3 w-full -skew-x-6 bg-gradient-to-r from-[#e89560] to-[#d4956a] opacity-30" />
              </span>
              <br>
              <span class="hero-gradient-text">
                pour coachs ménopause
              </span>.
            </h1>

            <!-- Description V5 -->
            <div class="space-y-3">
              <p class="max-w-xl text-lg leading-relaxed text-[#4a4255]">
                Agenda en ligne, paiements automatiques, suivi client — réunis dans un seul outil.
                Vous ouvrez Keova, vous voyez vos rendez-vous, vos règlements, vos clientes.
                Tout ce qu'il faut. Rien de superflu.
              </p>
              <p class="text-sm text-[#6b6278]">
                Conçu pour les coachs ménopause. Adapté à tous les métiers de l'accompagnement.
              </p>
            </div>
            <p class="text-sm text-[#6b6278]">
              Les premières praticiennes construisent Keova avec nous avant le lancement.
              Il reste des places — inscrivez-vous pour en faire partie.
            </p>

            <!-- CTA + reassurance pills -->
            <div class="flex flex-col gap-5 pt-2">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  class="cta-primary group relative overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-lg"
                  @click="isWaitlistModalOpen = true"
                >
                  <span class="cta-primary-bg" />
                  <span class="relative z-10 flex items-center gap-2">
                    Je réserve ma place
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </button>

                <!-- Login link discret -->
                <NuxtLink
                  to="/login"
                  class="text-sm text-[#6b6278] underline-offset-2 transition-colors duration-200 hover:text-[#5b4b6e] hover:underline"
                >
                  Déjà inscrite ?
                </NuxtLink>
              </div>

              <!-- Réassurance pills -->
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#ebe7ef] bg-white/60 px-3.5 py-1.5 text-xs font-medium text-[#4a4255] backdrop-blur-sm">
                  <UIcon
                    name="i-lucide-credit-card"
                    class="size-3.5 text-[#d4956a]"
                  />
                  Sans carte bancaire
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#ebe7ef] bg-white/60 px-3.5 py-1.5 text-xs font-medium text-[#4a4255] backdrop-blur-sm">
                  <UIcon
                    name="i-lucide-zap"
                    class="size-3.5 text-[#d4956a]"
                  />
                  Inscription en 30 secondes
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#ebe7ef] bg-white/60 px-3.5 py-1.5 text-xs font-medium text-[#4a4255] backdrop-blur-sm">
                  <UIcon
                    name="i-lucide-shield-check"
                    class="size-3.5 text-[#d4956a]"
                  />
                  Données hébergées en France
                </span>
              </div>
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
                    <p class="text-xs font-medium text-[#6b6278]">
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
                    <p class="text-xs font-medium text-[#6b6278]">
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
                  src="/images/screenshot-dashboard.png"
                  format="webp"
                  class="w-full rounded-2xl"
                  alt="Interface Keova — agenda, paiements et suivi client"
                  loading="eager"
                  fetchpriority="high"
                  width="1200"
                  height="800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator — positioned relative to the section, centered on full width -->
      <div class="absolute inset-x-0 bottom-8 flex justify-center">
        <button
          class="flex flex-col items-center gap-2 text-[#6b6278] transition-colors duration-300 hover:text-[#5b4b6e]"
          aria-label="Explorer — défiler vers la section suivante"
          @click="scrollTo('pourquoi')"
        >
          <span class="text-xs font-medium uppercase tracking-widest">Explorer</span>
          <div class="flex h-8 w-5 justify-center rounded-full border-2 border-current pt-1.5">
            <div class="scroll-dot h-2 w-1 rounded-full bg-current" />
          </div>
        </button>
      </div>
    </section>

    <!-- ====================== BLOC DOULEUR (V5) ====================== -->
    <section class="relative bg-white px-6 py-24 sm:px-12 lg:px-20">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-3xl"
      >
        <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
        <h2 class="font-serif text-3xl leading-tight text-[#221d28] lg:text-4xl">
          Combien d'outils ouvrez-vous avant votre première séance&#8239;?
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#4a4255]">
          <p>
            Calendly ou Google Agenda pour les créneaux.
            Stripe ou des virements à la main pour les paiements.
            Un tableur pour le suivi.
            Un site — ou juste un lien Instagram.
          </p>
          <p>
            Trois, quatre, cinq outils. Aucun ne se parle.
            Et entre chaque séance, c'est l'admin qui prend le dessus.
          </p>
          <p>
            Vous relancez un paiement. Vous recopiez un créneau.
            Vous cherchez où vous aviez noté le bilan d'une cliente.
          </p>
          <p class="font-medium text-[#221d28]">
            À 10 clientes, ça tient. À 25, ça déborde.
            Pas parce que vous n'êtes pas organisée — parce que vos outils ne suivent pas.
          </p>
          <p class="text-[#6b6278]">
            Et si vous débutez sans aucun de ces outils&#8239;?
            C'est le moment de poser les bonnes bases.
          </p>
        </div>
      </div>
    </section>

    <!-- ====================== SECTION COMPARATIVE — Split Chaos vs Calm ====================== -->
    <section
      id="pourquoi"
      class="relative bg-[#f0edf3] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-5xl">
        <!-- H2 -->
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-16 text-center"
        >
          <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Un seul logiciel
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">au lieu de cinq.</span>
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-[#6b6278]">
            Calendly pour l'agenda. Stripe pour les paiements. Excel pour le suivi.
            WordPress pour le site. Doctolib pour la visibilité.
            Cinq abonnements, cinq mots de passe, zéro lien entre eux.
            Keova réunit tout dans un seul espace.
          </p>
        </div>

        <!-- Split card: Avant / Avec Keova -->
        <div
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-xl"
        >
          <div class="grid lg:grid-cols-2">
            <!-- LEFT — Avant (dark, chaos) -->
            <div class="relative bg-[#2d2438] px-8 py-10 lg:px-10 lg:py-12">
              <p class="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#a99bb8]">
                Avant
              </p>
              <div class="space-y-3">
                <div
                  v-for="(tool, i) in fragmentedTools"
                  :key="tool.name"
                  class="avant-tool flex items-center gap-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3 transition-all duration-300"
                >
                  <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 transition-colors duration-300">
                    <UIcon
                      :name="tool.icon"
                      class="size-5 text-[#a99bb8] transition-colors duration-300"
                    />
                  </div>
                  <span class="text-sm text-[#c8bfd4]">{{ tool.name }}</span>
                  <div class="ml-auto h-px flex-1 border-b border-dashed border-white/10" />
                  <span class="text-xs text-[#8a7d9a]">login #{{ i + 1 }}</span>
                </div>
              </div>
              <p class="mt-8 text-center text-sm text-[#8a7d9a]">
                5 outils · 5 logins · 5 factures
              </p>
            </div>

            <!-- RIGHT — Avec Keova (light, calm) — 5 items mapping 1:1 -->
            <div class="relative flex flex-col bg-white px-8 py-10 lg:px-10 lg:py-12">
              <p class="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#d4956a]">
                Avec Keova
              </p>
              <div class="space-y-3">
                <div
                  v-for="item in [
                    { icon: 'i-lucide-calendar', label: 'Agenda et créneaux' },
                    { icon: 'i-lucide-credit-card', label: 'Paiements automatiques' },
                    { icon: 'i-lucide-folder-heart', label: 'Dossier client complet' },
                    { icon: 'i-lucide-globe', label: 'Votre site pro' },
                    { icon: 'i-lucide-mouse-pointer-click', label: 'Réservation en ligne' }
                  ]"
                  :key="item.label"
                  class="flex items-center gap-4 rounded-xl border border-[#ebe7ef] px-4 py-3 transition-all duration-300 hover:border-[#d4956a]/30 hover:bg-[#fdf6f1]"
                >
                  <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f5f3f7]">
                    <UIcon
                      :name="item.icon"
                      class="size-5 text-[#d4956a]"
                    />
                  </div>
                  <span class="text-sm font-medium text-[#3d3250]">{{ item.label }}</span>
                </div>
              </div>
              <p class="mt-6 text-center text-sm text-[#6b6278]">
                1 espace · 1 connexion · 0 friction
              </p>
            </div>
          </div>
        </div>

        <!-- Stats — 3 cards avec header dark -->
        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <div
            v-for="(stat, i) in stats"
            :key="stat.label"
            v-bind="reveal({ delay: 400 + i * 120 })"
            class="stat-card scroll-reveal group overflow-hidden rounded-2xl shadow-sm"
          >
            <div class="bg-[#2d2438] px-4 py-3 text-center">
              <span class="font-serif text-3xl text-white transition-transform duration-300 group-hover:scale-110 inline-block">
                {{ stat.value }}
              </span>
            </div>
            <div class="bg-white px-4 py-4 text-center">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#6b6278]">
                {{ stat.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====================== FEATURES V5 ====================== -->
    <section
      id="atelier"
      class="relative bg-white px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-16 text-center"
        >
          <span class="mb-4 inline-block bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
            La solution
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#221d28] lg:text-5xl">
            Ce que Keova fait pour vous
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">chaque jour</span>
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-[#6b6278]">
            Rendez-vous, paiements, ressources — les trois piliers de votre pratique,
            réunis dans un seul logiciel.
            Vous gardez la relation avec vos clientes. Keova s'occupe du reste.
          </p>
        </div>

        <div class="grid gap-8">
          <div
            v-for="(feature, i) in features"
            :key="feature.title"
            v-bind="reveal({ delay: i * 150 })"
            class="scroll-reveal feature-card group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8"
          >
            <div class="feature-card-glow absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0" />
            <div class="flex items-start gap-5">
              <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                <UIcon
                  :name="feature.icon"
                  class="size-7 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                />
              </div>
              <div>
                <h3 class="font-serif text-xl font-semibold text-[#3d3250]">
                  {{ feature.title }}
                </h3>
                <p
                  v-for="(paragraph, j) in feature.paragraphs"
                  :key="j"
                  class="mt-3 text-[#6b6278]"
                >
                  {{ paragraph }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA intermédiaire -->
        <div class="mt-12 text-center">
          <button
            class="cta-primary group relative overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-lg"
            @click="isWaitlistModalOpen = true"
          >
            <span class="cta-primary-bg" />
            <span class="relative z-10 flex items-center gap-2">
              Je réserve ma place
              <UIcon
                name="i-lucide-arrow-right"
                class="size-5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- ====================== PARCOURS SECTION ====================== -->
    <section
      id="parcours"
      class="relative bg-[#f5f3f7] px-6 py-32 sm:px-12 lg:px-20"
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
            Prête en
            <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">3 étapes</span>
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
                  Créez votre page pro
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  10 minutes, c'est prêt.
                </h3>
                <p class="mt-4 text-[#6b6278]">
                  Ajoutez votre photo, vos horaires et vos tarifs.
                  Votre page est en ligne — vos clientes peuvent réserver.
                  Pas besoin de webmaster ni de site WordPress.
                </p>
              </div>
              <div
                v-bind="reveal({ delay: 200 })"
                class="scroll-reveal order-1 lg:order-2"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
                  <NuxtImg
                    src="/images/screenshot-scheduling.png"
                    format="webp"
                    class="w-full rounded-xl"
                    alt="Configuration créneaux et tarifs"
                    loading="lazy"
                    width="400"
                    height="280"
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
                  Laissez Keova gérer l'admin
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  Paiements, confirmations, rappels — automatiques.
                </h3>
                <p class="mt-4 text-[#6b6278]">
                  Une cliente réserve&#8239;? Elle reçoit la confirmation.
                  La veille du RDV&#8239;? Elle reçoit le rappel.
                  Après la séance&#8239;? La facture part toute seule.
                </p>
              </div>
              <div
                v-bind="reveal()"
                class="scroll-reveal order-1"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
                  <NuxtImg
                    src="/images/screenshot-payments.png"
                    format="webp"
                    class="w-full rounded-xl"
                    alt="Finance et paiements automatisés"
                    loading="lazy"
                    width="400"
                    height="280"
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
                  Gardez le lien entre les séances
                </span>
                <h3 class="mt-4 font-serif text-2xl text-[#3d3250] lg:text-3xl">
                  Vos clientes restent engagées.
                </h3>
                <p class="mt-4 text-[#6b6278]">
                  Partagez un exercice, un article, un bilan.
                  Vos clientes reçoivent le bon contenu au bon moment de leur parcours.
                </p>
              </div>
              <div
                v-bind="reveal({ delay: 200 })"
                class="scroll-reveal order-1 lg:order-2"
              >
                <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg transition-transform duration-500 hover:scale-[1.02]">
                  <NuxtImg
                    src="/images/screenshot-clients.png"
                    format="webp"
                    class="w-full rounded-xl"
                    alt="Suivi et gestion des clientes"
                    loading="lazy"
                    width="400"
                    height="280"
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
      class="relative bg-white px-6 py-32 sm:px-12 lg:px-20"
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
                <p class="text-sm text-[#6b6278]">
                  Spécialiste ménopause, Valognes (Normandie)
                </p>
              </div>

              <!-- Comparatif avant/après — enhanced -->
              <div class="mt-6 flex flex-wrap items-center gap-2">
                <span
                  v-for="tool in ['Calendly', 'Stripe', 'Excel', 'WordPress', 'Doctolib']"
                  :key="tool"
                  class="rounded-full bg-[#ebe7ef] px-3 py-1 text-xs text-[#6b6278] transition-all duration-300 group-hover:bg-[#f5f3f7]"
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
                href="https://sophiejouan.fr"
                target="_blank"
                rel="noopener noreferrer"
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

    <!-- ====================== CO-CONSTRUCTION (V5) ====================== -->
    <section class="relative bg-[#f5f3f7] px-6 py-24 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-4xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal"
        >
          <span class="mb-4 inline-block h-1 w-12 rounded-full bg-gradient-to-r from-[#7a6b8e] to-[#d4956a]" />
          <h2 class="font-serif text-3xl leading-tight text-[#221d28] lg:text-4xl">
            Un outil jeune. Co-construit avec vous.
          </h2>
          <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#4a4255]">
            <p>
              Keova n'est pas parfait. Il est jeune, il évolue vite,
              et c'est exactement pour ça qu'il sera meilleur que les autres.
            </p>
            <p>
              Chaque fonctionnalité est pensée avec les praticiennes qui l'utilisent.
              Pas dans un bureau. Pas sur des suppositions.
              Avec vous, vos retours, vos besoins réels.
            </p>
            <p>
              Les premières inscrites ne seront pas des testeuses.
              Elles co-construiront l'outil.
              Ce que vous demandez aujourd'hui, on le construit demain.
            </p>
            <p class="font-medium text-[#221d28]">
              La gestion des programmes par séances&#8239;? Demandée par une praticienne.
              Livrée en deux semaines.
            </p>
          </div>

          <!-- 3 piliers visuels — stepped flow -->
          <div class="mt-12 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            <template
              v-for="(pillar, i) in [
                { icon: 'i-lucide-mouse-pointer-click', title: 'Vous utilisez', subtitle: 'Keova au quotidien', num: '01' },
                { icon: 'i-lucide-message-circle', title: 'Vous dites', subtitle: 'ce qui manque', num: '02' },
                { icon: 'i-lucide-hammer', title: 'On construit', subtitle: 'la version suivante', num: '03' }
              ]"
              :key="pillar.title"
            >
              <!-- Arrow connector between cards -->
              <div
                v-if="i > 0"
                class="hidden justify-center sm:flex"
              >
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-5 text-[#d4956a]"
                />
              </div>

              <!-- Step card -->
              <div
                v-bind="reveal({ delay: i * 150 })"
                class="scroll-reveal group relative flex flex-col items-center gap-3 rounded-2xl border border-[#ebe7ef] bg-white px-6 py-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d7cfdf] hover:shadow-lg"
              >
                <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e] px-3 py-0.5 text-[10px] font-bold text-white">
                  {{ pillar.num }}
                </span>
                <div class="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                  <UIcon
                    :name="pillar.icon"
                    class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                  />
                </div>
                <p class="font-serif text-lg font-semibold text-[#3d3250]">
                  {{ pillar.title }}
                </p>
                <p class="text-sm text-[#6b6278]">
                  {{ pillar.subtitle }}
                </p>
              </div>
            </template>
          </div>

          <!-- Citation -->
          <blockquote class="mt-12 border-l-4 border-[#d4956a] pl-6 font-serif text-xl italic text-[#4a4255]">
            &laquo;&nbsp;Aucun logiciel du marché n'a été conçu en écoutant des praticiennes ménopause.
            Keova est le premier.&nbsp;&raquo;
          </blockquote>
        </div>
      </div>
    </section>

    <!-- ====================== BLOC AUTORITÉ (V5) ====================== -->
    <section class="relative bg-white px-6 py-24 sm:px-12 lg:px-20">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-3xl"
      >
        <h3 class="font-serif text-2xl text-[#221d28] lg:text-3xl">
          Qui est derrière Keova&#8239;?
        </h3>
        <div class="mt-6 space-y-4 text-lg leading-relaxed text-[#4a4255]">
          <p>
            Keova est né d'un constat simple : les logiciels du marché sont faits
            pour les marketeurs, pas pour les praticiennes du soin.
          </p>
          <p>
            L'outil est jeune, l'équipe est petite, et c'est un choix :
            rester proche de chaque praticienne plutôt que de grossir trop vite.
          </p>
          <p class="text-[#6b6278]">
            Keova est développé et hébergé en France par Simon Jouan, conçu en Normandie et hébergé en France par Scalingo (Paris).
            Chaque membre de la beta a un accès direct à l'équipe — par message, appel ou visio.
          </p>
        </div>
      </div>
    </section>

    <!-- ====================== FAQ (V5) ====================== -->
    <section
      id="faq"
      class="relative bg-[#f5f3f7] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-12 text-center"
        >
          <span class="mb-4 inline-block bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
            FAQ
          </span>
          <h2 class="font-serif text-3xl leading-tight text-[#221d28] lg:text-4xl">
            Questions fréquentes
          </h2>
        </div>

        <UAccordion
          :items="faqItems"
          :default-value="faqDefaultValue"
          multiple
          aria-label="Questions fréquentes"
        >
          <template #content="{ item }">
            <div class="space-y-3 pb-3.5 text-sm text-[#4a4255]">
              <p
                v-for="(paragraph, i) in (item.content ?? '').split('\n\n')"
                :key="i"
              >
                {{ paragraph }}
              </p>
            </div>
          </template>
        </UAccordion>
      </div>
    </section>

    <!-- ====================== WAITLIST SECTION ====================== -->
    <section
      id="waitlist"
      class="relative overflow-hidden bg-gradient-to-br from-[#3d3250] via-[#352c44] to-[#221d28] px-6 pb-40 pt-32 sm:px-12 lg:px-20"
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
          Réservez votre
          <span class="bg-gradient-to-r from-[#e89560] to-[#f0b48f] bg-clip-text text-transparent">place</span>
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-[#c8bfd4]">
          Quelques places pour construire Keova avec nous. Inscrivez-vous en 30 secondes.
          Aucune carte bancaire. On vous prévient dès qu'un accès se libère.
        </p>

        <div class="mt-10">
          <WaitlistForm mode="inline" />
        </div>

        <p class="mx-auto mt-4 max-w-lg text-sm text-[#a99bb8]">
          Jamais de spam. Données hébergées en France. Conforme RGPD.
        </p>

        <!-- P.S. V5 -->
        <p class="mx-auto mt-10 max-w-lg text-left text-sm leading-relaxed text-[#c8bfd4]">
          <strong class="text-[#f0b48f]">P.S.</strong> — Keova est gratuit pendant toute la beta.
          Les premières inscrites bénéficieront d'une réduction sur leur première année —
          bien en-dessous de ce que coûtent vos 5 outils actuels —
          et un accès direct à l'équipe pour orienter les prochaines fonctionnalités.
          Si vous hésitez, inscrivez-vous — vous pourrez toujours dire non plus tard.
        </p>
      </div>
    </section>

    <!-- ====================== WAITLIST MODAL ====================== -->
    <!-- ClientOnly: prevents SSR of second WaitlistForm instance which causes useId() mismatch -->
    <ClientOnly>
      <UModal
        v-model:open="isWaitlistModalOpen"
        title="Rejoindre la beta Keova"
        description="Votre demande reste confidentielle. Aucun engagement."
        :ui="{
          content: 'rounded-3xl border border-[#ebe7ef] bg-white shadow-2xl max-w-lg overflow-hidden',
          header: 'relative overflow-hidden bg-gradient-to-r from-[#5b4b6e] via-[#7a6b8e] to-[#5b4b6e] px-8 pt-8 pb-6',
          body: 'px-8 pb-8 pt-6',
          title: 'font-serif text-2xl text-white',
          description: 'text-sm text-[#d7cfdf]',
          close: 'text-white/70 hover:text-white hover:bg-white/10 rounded-full'
        }"
      >
        <template #header>
          <!-- Ambient glow in header -->
          <div
            class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d4956a] opacity-20 blur-[40px]"
            aria-hidden="true"
          />
          <h3 class="relative font-serif text-2xl text-white">
            Rejoindre la beta
            <span class="bg-gradient-to-r from-[#f0b48f] to-[#e89560] bg-clip-text text-transparent">Keova</span>
          </h3>
          <p class="relative mt-1 text-sm text-[#d7cfdf]">
            Votre demande reste confidentielle. Aucun engagement.
          </p>
        </template>

        <template #body>
          <WaitlistForm
            mode="modal"
            @submitted="isWaitlistModalOpen = false"
          />
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* =================================================================================================
 * ANIMATIONS
 * ================================================================================================= */

/* --- Scroll reveal base --- */
/* Default: visible (SSR-safe for crawlers and no-JS) */
.scroll-reveal {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

/* JS-enhanced: hide until IntersectionObserver reveals */
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(24px);
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
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.5; }
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

/* --- Compare cards hover --- */
.compare-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(45, 36, 56, 0.18);
}

/* --- Stat cards hover --- */
.stat-card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-card:hover {
  border-color: #d4956a;
  box-shadow: 0 8px 24px rgba(212, 149, 106, 0.12);
  transform: translateY(-4px);
}

/* --- Avant tool rows (dark side hover) --- */
.avant-tool:hover {
  border-color: rgba(212, 149, 106, 0.3);
  background: rgba(212, 149, 106, 0.08);
  transform: translateX(4px);
}

.avant-tool:hover .size-5 {
  color: #d4956a;
}

.avant-tool:hover .rounded-lg {
  background: rgba(212, 149, 106, 0.15);
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

/* =================================================================================================
 * REDUCED MOTION — disable perpetual animations
 * ================================================================================================= */
@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-float-delayed,
  .animate-float-slow,
  .hero-gradient-text,
  .eyebrow-shimmer,
  .scroll-dot,
  .arrow-pulse,
  .hero-glow,
  .avatar-ring,
  .particle,
  .cta-primary-bg {
    animation: none !important;
  }
}
</style>
