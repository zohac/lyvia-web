<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { FeaturedProvider } from '~/features/seo/api/featured-provider.contract'

import SpecialistCard from '~/components/organisms/SpecialistCard.vue'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { useB2CLandingSchemaOrg } from '~/features/seo/useB2CLandingSchemaOrg'

const { reveal, isReady: scrollReady } = useScrollReveal()

// OG image B2C — override global fallback
useSeoMeta({
  ogImage: '/images/og-default-b2c.png'
})

// --- Providers featured (SSR-compatible) ---
const { data: featuredData } = await useFetch<{ providers: FeaturedProvider[] }>('/api/public/providers/featured', {
  default: () => ({ providers: [] })
})
const providers = computed(() => featuredData.value?.providers ?? [])

// Schema.org B2C: ProfessionalService + ItemList + BreadcrumbList (AC-17)
useB2CLandingSchemaOrg(providers)

// --- Symptômes V2 — 10 symptômes en 2 groupes ---
const symptomsGroup1 = [
  {
    icon: 'i-lucide-heart-pulse',
    title: 'Cycles irréguliers',
    text: 'Des règles qui deviennent imprévisibles\u00A0: plus abondantes, plus espacées, parfois absentes pendant des mois. C\u2019est souvent le premier signe de la périménopause — et beaucoup de femmes ne font pas le lien tout de suite.'
  },
  {
    icon: 'i-lucide-flame',
    title: 'Bouffées de chaleur',
    text: 'Des vagues de chaleur soudaines qui montent du torse au visage, parfois plusieurs fois par jour. Elles perturbent le sommeil, la concentration et la vie sociale. C\u2019est le symptôme le plus fréquent\u00A0: il touche 75 à 80\u00A0% des femmes en ménopause.'
  },
  {
    icon: 'i-lucide-moon',
    title: 'Troubles du sommeil',
    text: 'Réveils nocturnes, insomnies, sommeil fragmenté — souvent liés aux sueurs nocturnes ou à l\u2019anxiété. Le manque de sommeil amplifie tous les autres symptômes.'
  },
  {
    icon: 'i-lucide-battery-low',
    title: 'Fatigue chronique',
    text: 'Un épuisement qui ne passe pas, même après une nuit correcte. La fatigue de la ménopause est hormonale, pas psychologique. Elle s\u2019améliore avec un accompagnement adapté.'
  },
  {
    icon: 'i-lucide-cloud-rain',
    title: 'Anxiété et irritabilité',
    text: 'Des émotions qui débordent sans prévenir\u00A0: anxiété diffuse, irritabilité soudaine, crises de larmes. Les fluctuations hormonales affectent directement les neurotransmetteurs du bien-être (sérotonine, GABA).'
  },
  {
    icon: 'i-lucide-scale',
    title: 'Prise de poids',
    text: 'Un changement métabolique qui redistribue les graisses, surtout au niveau abdominal. Ce n\u2019est pas un manque de volonté — c\u2019est une réponse hormonale. L\u2019alimentation et le mouvement adaptés font une vraie différence.'
  },
  {
    icon: 'i-lucide-brain',
    title: 'Troubles de la mémoire',
    text: 'Le «\u00A0brouillard mental\u00A0»\u00A0: vous cherchez vos mots, vous oubliez pourquoi vous êtes entrée dans une pièce. C\u2019est un symptôme bien documenté de la ménopause, souvent temporaire.'
  }
]

const symptomsGroup2 = [
  {
    icon: 'i-lucide-bone',
    title: 'Douleurs articulaires',
    text: 'Genoux, mains, épaules, hanches — des douleurs qui apparaissent ou s\u2019aggravent avec la ménopause. Souvent confondues avec de l\u2019arthrose, elles sont en réalité liées à la chute des œstrogènes. Un accompagnement adapté (mouvement, alimentation anti-inflammatoire) peut réduire significativement la gêne.'
  },
  {
    icon: 'i-lucide-droplets',
    title: 'Sécheresse intime',
    text: 'La baisse des œstrogènes entraîne une sécheresse vaginale qui touche jusqu\u2019à 50\u00A0% des femmes après la ménopause. Ce symptôme souvent tabou a des solutions concrètes — traitements locaux, hydratation, accompagnement adapté. On en parle peu, mais on peut agir.'
  },
  {
    icon: 'i-lucide-shield-alert',
    title: 'Perte osseuse et ostéoporose',
    text: 'Après la ménopause, la densité osseuse diminue de 2 à 3\u00A0% par an pendant les 5 à 10 premières années. L\u2019ostéoporose touche 1 femme sur 3 après 50 ans. Le renforcement musculaire, l\u2019alimentation riche en calcium et vitamine D, et le suivi médical sont les 3 piliers de la prévention. Il n\u2019est jamais trop tard pour agir.',
    source: 'INSERM — Ostéoporose',
    sourceUrl: 'https://www.inserm.fr/dossier/osteoporose'
  }
]

// --- Éducation pillars V2 (enrichis, source INSERM) ---
const pillars = [
  {
    num: '01',
    title: 'C\u2019est réel.',
    text: '80\u00A0% des femmes en ménopause ont des symptômes qui leur changent le quotidien (INSERM). Et ça évolue\u00A0: ce qui vous gêne maintenant ne sera pas forcément ce qui vous gênera dans 5 ans.',
    icon: 'i-lucide-brain',
    sourceLabel: 'INSERM',
    sourceUrl: 'https://www.inserm.fr/dossier/menopause'
  },
  {
    num: '02',
    title: 'Chaque situation est différente.',
    text: 'Votre sommeil, votre alimentation, votre stress, votre histoire. Tout ça compte. La spécialiste prend le temps de comprendre votre situation avant de proposer quoi que ce soit.',
    icon: 'i-lucide-heart-handshake'
  },
  {
    num: '03',
    title: 'Des professionnelles, pas des influenceuses.',
    text: 'Naturopathes, sophrologues, coachs santé. Formées à la ménopause. Leurs formations sont sur leur profil. Vous pouvez vérifier.',
    icon: 'i-lucide-shield-check'
  },
  {
    num: '04',
    title: 'Ça va avec votre médecin.',
    text: 'On ne remplace pas le médecin. On complète\u00A0: alimentation, stress, sommeil, mouvement. Traitement hormonal ou pas.',
    icon: 'i-lucide-leaf'
  }
]

// --- FAQ V2 — 11 questions (AC-7, mot-pour-mot) ---
const faqItems: AccordionItem[] = [
  {
    label: 'Qu\u2019est-ce que la ménopause\u00A0?',
    content: 'La ménopause est l\u2019arrêt définitif des menstruations, confirmé après 12 mois consécutifs sans règles. Elle survient en moyenne vers 51 ans en France. La périménopause — la phase de transition qui précède — peut commencer dès 38-40 ans et durer 4 à 8 ans. Après la ménopause, une nouvelle phase commence avec ses propres enjeux (os, cœur, articulations).\n\nSource : INSERM, « Ménopause » (inserm.fr/dossier/menopause)',
    value: 'faq-1'
  },
  {
    label: 'Quels sont les symptômes de la ménopause\u00A0?',
    content: 'Les symptômes les plus fréquents sont les bouffées de chaleur (75-80\u00A0% des femmes), les troubles du sommeil, la fatigue, l\u2019anxiété, la prise de poids, les troubles de la mémoire, la sécheresse vaginale et les douleurs articulaires.\n\nAprès la ménopause, d\u2019autres symptômes peuvent apparaître : perte de densité osseuse, douleurs articulaires chroniques, perte musculaire.\n\nChaque femme les vit différemment en intensité et en durée.',
    value: 'faq-2'
  },
  {
    label: 'Quelle différence entre ménopause et périménopause\u00A0?',
    content: 'La périménopause est la phase de transition hormonale qui précède la ménopause. Elle peut commencer dès 38-40 ans et durer plusieurs années. Les symptômes (cycles irréguliers, bouffées de chaleur, fatigue) commencent souvent pendant cette phase. La ménopause est confirmée quand les règles ont cessé depuis 12 mois.',
    value: 'faq-3'
  },
  {
    label: 'Qu\u2019est-ce que l\u2019accompagnement ménopause\u00A0?',
    content: 'C\u2019est un suivi personnalisé avec une professionnelle formée à la ménopause : naturopathe, sophrologue, coach santé. L\u2019accompagnement couvre l\u2019alimentation, le sommeil, la gestion du stress et le mouvement — en complément du suivi médical, pas à sa place.\n\nIl s\u2019adapte à votre phase : périménopause, ménopause ou post-ménopause.',
    value: 'faq-4'
  },
  {
    label: 'Qui sont les spécialistes sur Keova\u00A0?',
    content: 'Les spécialistes référencées sur Keova sont des professionnelles du bien-être formées spécifiquement à l\u2019accompagnement de la ménopause : naturopathes, sophrologues, coachs certifiées. Chaque profil indique ses formations, ses spécialités et son approche. Vous pouvez vérifier leurs qualifications et choisir celle qui vous correspond avant de réserver un appel.',
    value: 'faq-5'
  },
  {
    label: 'Combien coûte un accompagnement\u00A0?',
    content: 'Le premier appel découverte est toujours gratuit (15 minutes, sans engagement, sans carte bancaire). Ensuite, chaque spécialiste fixe ses propres tarifs pour les consultations et les programmes. Les prix sont affichés sur le profil de chaque spécialiste. Comptez en moyenne entre 50 et 90\u00A0€ par séance, avec des programmes à tarif réduit pour un suivi régulier.',
    value: 'faq-6'
  },
  {
    label: 'Est-ce compatible avec un traitement hormonal (THM)\u00A0?',
    content: 'Absolument. L\u2019accompagnement sur Keova est conçu comme un complément, pas une alternative. Si vous prenez un THM, une spécialiste peut vous aider sur ce que le traitement ne couvre pas toujours : le sommeil, l\u2019alimentation, le stress, le mouvement. Beaucoup de femmes sous THM constatent que l\u2019accompagnement complète efficacement leur traitement.',
    value: 'faq-7'
  },
  {
    label: 'L\u2019accompagnement remplace-t-il un médecin\u00A0?',
    content: 'Non. L\u2019accompagnement ménopause complète le suivi médical. Si vous avez des symptômes sévères, consultez d\u2019abord votre médecin ou gynécologue. Les spécialistes sur Keova travaillent en complémentarité : alimentation, gestion du stress, sommeil, mouvement — ce que la consultation médicale de 15 minutes ne couvre pas.',
    value: 'faq-8'
  },
  {
    label: 'Comment se déroule un appel découverte\u00A0?',
    content: 'L\u2019appel découverte dure 15 minutes, en visio. C\u2019est un échange libre pour comprendre votre situation, vos symptômes et vos attentes. La spécialiste vous explique son approche et vous pouvez poser toutes vos questions. Aucun engagement, aucune carte bancaire demandée. Vous décidez ensuite si vous souhaitez poursuivre avec un accompagnement.',
    value: 'faq-9'
  },
  {
    label: 'Je ne suis pas sûre d\u2019être en ménopause. Puis-je quand même consulter\u00A0?',
    content: 'Oui. La périménopause peut commencer dès 38-40 ans chez certaines femmes. Fatigue persistante, irritabilité inhabituelle, cycles qui changent, sommeil perturbé — ces symptômes sont souvent attribués au stress alors qu\u2019ils sont hormonaux. Si vous avez un doute, un premier échange avec une spécialiste peut vous aider à y voir clair.',
    value: 'faq-10'
  },
  {
    label: 'Et après la ménopause, c\u2019est trop tard\u00A0?',
    content: 'Pas du tout — c\u2019est souvent là que l\u2019accompagnement est le plus utile. La post-ménopause apporte ses propres défis : prévention osseuse, douleurs articulaires, maintien musculaire, santé cardiovasculaire, sécheresse intime. Un accompagnement adapté vous aide à construire un plan durable pour les années qui viennent. Il n\u2019est jamais trop tard pour agir.',
    value: 'faq-11'
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
  <div :class="['relative min-h-screen overflow-hidden bg-[#faf8f6]', { 'js-scroll-ready': scrollReady }]">
    <!-- ========= AMBIENT MESH (fixed, organic biophilic) ========= -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <div
        class="absolute -left-[20%] -top-[8%] h-[80vh] w-[80vh] rounded-full animate-drift-slow"
        style="background: radial-gradient(circle at 30% 40%, rgba(212,149,106,0.35), rgba(232,149,96,0.08) 55%, transparent 75%); filter: blur(100px);"
      />
      <div
        class="absolute -bottom-[12%] -right-[15%] h-[70vh] w-[70vh] rounded-full animate-drift-slow-reverse"
        style="background: radial-gradient(circle at 60% 60%, rgba(122,107,142,0.3), rgba(91,75,110,0.06) 55%, transparent 75%); filter: blur(110px);"
      />
      <div
        class="absolute left-[40%] top-[20%] h-[40vh] w-[55vh] -translate-x-1/2 rounded-full opacity-25"
        style="background: radial-gradient(ellipse, rgba(212,149,106,0.2), transparent 70%); filter: blur(120px);"
      />
    </div>

    <!-- ==================== HERO (AC-1) ==================== -->
    <section class="relative px-4 pb-24 pt-32 sm:pb-36 sm:pt-44">
      <div class="mx-auto max-w-5xl text-center">
        <!-- Eyebrow -->
        <div class="hero-appear mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/8 px-5 py-2.5 shadow-sm">
          <span class="size-2 animate-pulse rounded-full bg-[#d4956a]" />
          <span class="text-sm font-semibold tracking-wide text-[#b07a4a]">Accompagnement ménopause en France</span>
        </div>

        <!-- H1 -->
        <h1 class="hero-appear stagger-1 font-serif text-[2.5rem] leading-[1.1] tracking-tight text-[#3d3250] sm:text-5xl lg:text-6xl">
          <span class="bg-gradient-to-r from-[#d4956a] to-[#c87a4a] bg-clip-text text-transparent">Ce n'est pas dans votre tête.</span>
        </h1>

        <!-- Sous-ligne -->
        <p class="hero-appear stagger-1 mt-5 text-lg leading-relaxed text-[#6b6177] sm:text-xl">
          Bouffées de chaleur, fatigue, douleurs articulaires — la ménopause,
          ça se vit dans le corps. Et on peut se faire aider.
        </p>

        <!-- CTA -->
        <div class="hero-appear stagger-3 mt-10 flex flex-col items-center gap-4">
          <button
            class="cta-glow group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#d4956a] via-[#e0a87d] to-[#c8845e] px-9 py-4 text-base font-semibold text-white shadow-lg shadow-[#d4956a]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#d4956a]/35 hover:brightness-105 active:scale-[0.98]"
            @click="scrollTo('specialistes')"
          >
            <!-- Shine sweep on hover -->
            <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span class="relative z-10 flex items-center gap-2.5">
              Parler à une spécialiste
              <UIcon
                name="i-lucide-arrow-down"
                class="size-5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </span>
          </button>
          <!-- Micro-copy -->
          <p class="text-sm text-[#857d8c]">
            Premier appel gratuit · 15 min · Sans engagement
          </p>
        </div>

        <!-- Stat impact (V2) — full-width, vivante -->
        <div class="hero-appear stagger-4 mx-auto mt-16 max-w-2xl">
          <div class="relative overflow-hidden rounded-3xl border border-[#d4956a]/15 bg-gradient-to-br from-[#3d3250] to-[#4a3d5e] px-8 py-10 text-center shadow-xl sm:px-12">
            <!-- Warm glow -->
            <div
              class="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-40"
              style="background: radial-gradient(circle, rgba(212,149,106,0.5), transparent 70%); filter: blur(50px);"
              aria-hidden="true"
            />
            <div
              class="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full opacity-25"
              style="background: radial-gradient(circle, rgba(122,107,142,0.6), transparent 70%); filter: blur(40px);"
              aria-hidden="true"
            />
            <div class="relative">
              <p class="font-serif text-5xl font-bold text-[#d4956a] sm:text-6xl">
                14 millions
              </p>
              <p class="mt-4 text-base leading-relaxed text-[#d7cfdf]">
                de femmes en France.
              </p>
              <div class="mx-auto my-4 h-px w-16 bg-gradient-to-r from-transparent via-[#d4956a]/40 to-transparent" />
              <p class="text-sm font-medium text-[#b9aac7]">
                La plupart gèrent ça seules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Scrolltelling transition: journey begins -->
    <div
      v-bind="reveal()"
      class="scroll-reveal mx-auto -mb-8 max-w-xs text-center"
    >
      <div class="mx-auto h-12 w-px bg-gradient-to-b from-transparent via-[#d4956a]/30 to-[#d4956a]/10" />
      <span class="mt-2 inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#d4956a]/60">Votre réalité</span>
    </div>

    <!-- ==================== BLOC DOULEUR 1 (AC-2) ==================== -->
    <section class="relative bg-gradient-to-b from-transparent via-[#fdf6f0]/60 to-transparent px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-5xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Ce que vous vivez a un nom.
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            Vous vous réveillez à 3h du matin, trempée.
            Vous cherchez un mot que vous connaissiez hier.
            Vous pleurez sans savoir pourquoi.
            Vos règles font n'importe quoi.
          </p>
          <p>
            Votre corps a changé. Et personne autour de vous ne comprend.
          </p>
          <p class="font-medium text-[#3d3250]">
            Ce n'est pas le stress. Ce n'est pas l'âge.
            C'est hormonal. Et ça peut commencer dès 38 ans.
          </p>
          <p class="font-medium text-[#d4956a]">
            Vous n'avez pas à gérer ça seule.
          </p>
        </div>
      </div>
    </section>

    <!-- Organic wave separator -->
    <div
      class="relative -mb-px h-16 overflow-hidden sm:h-24"
      aria-hidden="true"
    >
      <svg
        class="absolute bottom-0 w-full"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,50 C360,90 720,10 1080,50 C1260,70 1380,40 1440,50 L1440,80 L0,80 Z"
          fill="#f5ede6"
        />
      </svg>
    </div>

    <!-- ==================== BLOC DOULEUR 2 — post-ménopause (AC-3) ==================== -->
    <section class="relative bg-[#f5ede6] px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-5xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Et après les bouffées de chaleur...
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            D'autres choses arrivent. Des douleurs dans les mains au réveil.
            Du poids qui ne bouge plus. Des os qui se fragilisent.
            Une fatigue de fond, tout le temps.
          </p>
          <p class="font-medium text-[#3d3250]">
            Ça ne s'arrête pas là. L'aide non plus.
          </p>
          <p class="font-medium text-[#d4956a]">
            Même dix ans après, il y a des choses à faire.
          </p>
        </div>
      </div>
    </section>

    <!-- Organic wave separator bottom -->
    <div
      class="relative -mt-px h-16 overflow-hidden sm:h-24"
      aria-hidden="true"
    >
      <svg
        class="absolute top-0 w-full rotate-180"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,50 C360,90 720,10 1080,50 C1260,70 1380,40 1440,50 L1440,80 L0,80 Z"
          fill="#f5ede6"
        />
      </svg>
    </div>

    <!-- Scrolltelling transition: understanding -->
    <div
      v-bind="reveal()"
      class="scroll-reveal mx-auto max-w-xs py-4 text-center"
    >
      <div class="mx-auto h-12 w-px bg-gradient-to-b from-transparent via-[#5b4b6e]/20 to-[#5b4b6e]/10" />
      <span class="mt-2 inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#5b4b6e]/50">Comprendre</span>
    </div>

    <!-- ==================== COMPRENDRE — 4 piliers (AC-4) ==================== -->
    <section
      id="education"
      class="relative px-4 py-24 sm:py-32"
    >
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Comprendre</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Pourquoi se faire accompagner&#8239;?
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            La ménopause n'est pas une maladie. Mais elle change des choses dans votre corps
            et dans votre quotidien. Un coup de main adapté, ça change tout.
          </p>
        </div>

        <!-- Pillar cards V2 — enrichis avec detail + source -->
        <div class="mt-16 grid gap-5 sm:grid-cols-2">
          <div
            v-for="(p, i) in pillars"
            :key="p.num"
            v-bind="reveal({ delay: i * 120 })"
            :class="['scroll-reveal group relative overflow-hidden rounded-3xl border border-[#ebe4f3]/60 bg-white/80 p-8 shadow-[0_4px_24px_rgba(91,75,110,0.06)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(212,149,106,0.12)]', i % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right']"
          >
            <div
              class="absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br from-[#d4956a]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div class="relative">
              <div class="mb-6 flex items-center justify-between">
                <div class="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#d4956a]/15 to-[#e8a878]/10 shadow-sm transition-all duration-500 group-hover:from-[#d4956a]/25 group-hover:to-[#e8a878]/15 group-hover:shadow-md">
                  <UIcon
                    :name="p.icon"
                    class="size-7 text-[#d4956a] transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span class="font-serif text-3xl font-light text-[#d4956a]/30">{{ p.num }}</span>
              </div>
              <h3 class="font-serif text-xl leading-snug text-[#3d3250]">
                {{ p.title }}
              </h3>
              <p class="mt-3 text-[0.9rem] leading-relaxed text-[#6b6177]">
                {{ p.text }}
              </p>
              <a
                v-if="p.sourceUrl"
                :href="p.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-block text-xs text-[#d4956a] hover:underline"
              >
                Source : {{ p.sourceLabel }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== COMMENT TROUVER DE L'AIDE — 3 étapes (AC-5) ==================== -->
    <section class="relative bg-gradient-to-b from-[#faf5f0] via-[#f8f0ea] to-[#faf8f6] px-4 py-24 sm:py-32">
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Le parcours</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Comment ça marche
          </h2>
        </div>

        <div class="mt-14 grid gap-8 sm:grid-cols-3">
          <div
            v-for="(step, i) in [
              { num: '1', title: 'Regardez les profils', text: 'Formations, spécialités, approche. Tout est là. Vous choisissez quelqu\u2019un qui vous parle.', icon: 'i-lucide-search' },
              { num: '2', title: 'Appelez gratuitement', text: '15 minutes pour faire connaissance. Pas de carte bancaire, pas d\u2019engagement. Juste un échange.', icon: 'i-lucide-calendar' },
              { num: '3', title: 'Vous décidez de la suite', text: 'Une séance, un programme, un suivi régulier. C\u2019est vous qui voyez.', icon: 'i-lucide-heart-handshake' }
            ]"
            :key="step.num"
            v-bind="reveal({ delay: i * 150 })"
            class="scroll-reveal group flex flex-col items-center rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#d4956a]/15 to-[#e8a878]/10 shadow-sm">
              <UIcon
                :name="step.icon"
                class="size-7 text-[#d4956a]"
              />
            </div>
            <span class="mb-2 text-xs font-bold text-[#d4956a]">
              Étape {{ step.num }}
            </span>
            <h3 class="font-serif text-lg text-[#3d3250]">
              {{ step.title }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[#6b6177]">
              {{ step.text }}
            </p>
          </div>
        </div>

        <p
          v-bind="reveal({ delay: 500 })"
          class="scroll-reveal mt-8 text-center text-sm text-[#857d8c]"
        >
          Aucun frais côté Keova. Le premier échange est toujours gratuit.
        </p>
      </div>
    </section>

    <!-- Scrolltelling transition: find help -->
    <div
      v-bind="reveal()"
      class="scroll-reveal mx-auto max-w-xs py-4 text-center"
    >
      <div class="mx-auto h-12 w-px bg-gradient-to-b from-transparent via-[#d4956a]/25 to-[#d4956a]/10" />
      <span class="mt-2 inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#d4956a]/60">Trouver de l'aide</span>
    </div>

    <!-- ==================== SPÉCIALISTES (AC-12) ==================== -->
    <section
      id="specialistes"
      class="relative px-4 py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
        style="background: linear-gradient(180deg, transparent, rgba(212,149,106,0.05) 30%, rgba(122,107,142,0.05) 70%, transparent);"
      />
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Accompagnement</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Les spécialistes
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            Formées à la ménopause. En visio ou en cabinet.
          </p>
        </div>

        <div
          v-if="providers.length"
          class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SpecialistCard
            v-for="(prov, i) in providers"
            :key="prov.slug"
            v-bind="reveal({ delay: i * 150 })"
            class="scroll-reveal"
            :provider="prov"
          />
        </div>

        <div
          v-else
          v-bind="reveal()"
          class="scroll-reveal mt-14 rounded-3xl border border-dashed border-[#d4956a]/20 bg-white/50 px-8 py-20 text-center backdrop-blur-sm"
        >
          <div class="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3]">
            <UIcon
              name="i-lucide-sparkles"
              class="size-9 text-[#7a6b8e]"
            />
          </div>
          <p class="font-serif text-2xl text-[#3d3250]">
            Nos spécialistes arrivent bientôt
          </p>
          <p class="mt-3 text-sm text-[#857d8c]">
            Inscrivez-vous pour être prévenue dès qu'une spécialiste
            est disponible près de chez vous — en cabinet ou en visio.
          </p>
        </div>
      </div>
    </section>

    <!-- Scrolltelling transition: identify -->
    <div
      v-bind="reveal()"
      class="scroll-reveal mx-auto max-w-xs py-4 text-center"
    >
      <div class="mx-auto h-12 w-px bg-gradient-to-b from-transparent via-[#5b4b6e]/20 to-[#5b4b6e]/10" />
      <span class="mt-2 inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#5b4b6e]/50">Identifier</span>
    </div>

    <!-- ==================== SYMPTÔMES — 10 en 2 groupes (AC-6) ==================== -->
    <section
      id="symptomes"
      class="relative px-4 py-24 sm:py-32"
    >
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Identifier</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Ce que la ménopause peut changer
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            Pas juste les bouffées de chaleur. Beaucoup de femmes mettent du temps
            à faire le lien entre ce qu'elles vivent et leurs hormones.
          </p>
        </div>

        <!-- Groupe 1 — Périménopause et ménopause -->
        <div class="mt-14">
          <h3
            v-bind="reveal()"
            class="scroll-reveal mb-6 text-center font-serif text-xl text-[#3d3250]"
          >
            Périménopause et ménopause <span class="text-sm font-normal text-[#857d8c]">(40-55 ans)</span>
          </h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="(s, i) in symptomsGroup1"
              :key="s.title"
              v-bind="reveal({ delay: i * 80 })"
              class="scroll-reveal group rounded-2xl border border-white/70 border-l-[3px] border-l-[#d4956a]/30 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-l-[#d4956a]/60 hover:shadow-md"
            >
              <div class="mb-3 flex items-center gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#d4956a]/12 to-[#e89560]/8">
                  <UIcon
                    :name="s.icon"
                    class="size-5 text-[#d4956a]"
                  />
                </div>
                <h4 class="font-semibold text-[#3d3250]">
                  {{ s.title }}
                </h4>
              </div>
              <p class="text-sm leading-relaxed text-[#6b6177]">
                {{ s.text }}
              </p>
            </div>
          </div>
        </div>

        <!-- Groupe 2 — Post-ménopause -->
        <div class="mt-12">
          <h3
            v-bind="reveal()"
            class="scroll-reveal mb-6 text-center font-serif text-xl text-[#3d3250]"
          >
            Ménopause confirmée et après <span class="text-sm font-normal text-[#857d8c]">(50 ans et +)</span>
          </h3>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(s, i) in symptomsGroup2"
              :key="s.title"
              v-bind="reveal({ delay: i * 100 })"
              class="scroll-reveal group rounded-2xl border border-white/70 border-l-[3px] border-l-[#d4956a]/30 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-l-[#d4956a]/60 hover:shadow-md"
            >
              <div class="mb-3 flex items-center gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#d4956a]/12 to-[#e89560]/8">
                  <UIcon
                    :name="s.icon"
                    class="size-5 text-[#d4956a]"
                  />
                </div>
                <h4 class="font-semibold text-[#3d3250]">
                  {{ s.title }}
                </h4>
              </div>
              <p class="text-sm leading-relaxed text-[#6b6177]">
                {{ s.text }}
              </p>
              <a
                v-if="s.sourceUrl"
                :href="s.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-block text-xs text-[#d4956a] hover:underline"
              >
                Source : {{ s.source }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== TÉMOIGNAGE placeholder (AC-8) ==================== -->
    <section class="relative bg-gradient-to-b from-[#faf8f6] via-[#f8f0ea] to-[#faf8f6] px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-2xl text-center"
      >
        <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Témoignages</span>
        <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Ce qu'elles en pensent
        </h2>
        <div class="mx-auto mt-8 max-w-lg rounded-2xl border border-[#ebe7ef] bg-white/80 px-8 py-10 backdrop-blur-sm">
          <p class="text-base leading-relaxed text-[#6b6177]">
            Keova démarre avec ses premières spécialistes et clientes.
            Les retours arrivent.
          </p>
          <p class="mt-4 text-base leading-relaxed text-[#6b6177]">
            En attendant, le meilleur moyen de se faire une idée,
            c'est l'appel gratuit.
          </p>
          <button
            class="mt-8 cursor-pointer rounded-full bg-gradient-to-r from-[#d4956a] to-[#c8845e] px-8 py-3.5 font-semibold text-white shadow-md shadow-[#d4956a]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#d4956a]/30 hover:brightness-105"
            @click="scrollTo('specialistes')"
          >
            Réserver un appel gratuit
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== QUI EST DERRIÈRE KEOVA (AC-9) ==================== -->
    <section class="relative bg-gradient-to-br from-[#f5ede6]/50 via-transparent to-[#f0eaf5]/30 px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-5xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Qui est derrière Keova&#8239;?
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            Trop de femmes traversent la ménopause sans aide.
            Les infos sont partout et nulle part. Les bonnes spécialistes, difficiles à trouver.
          </p>
          <p>
            Simon Jouan a créé Keova pour ça. Un endroit simple pour trouver une pro
            formée à la ménopause. Pas un cabinet médical. Pas une app bien-être de plus.
          </p>
          <p>
            Les spécialistes sur Keova sont indépendantes.
            Leur profil, leurs formations, leur approche : tout est public.
          </p>
          <p class="text-[#857d8c]">
            Conçu en Normandie, hébergé en France (Scalingo, Paris).
            Conforme RGPD. Vos données restent en France.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== FAQ — 11 Q&A (AC-7) ==================== -->
    <section
      id="faq"
      class="relative bg-gradient-to-br from-[#3d3250] via-[#4a3d5e] to-[#352a45] px-4 py-24 sm:py-32"
    >
      <!-- Warm glow decorations -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full opacity-20"
        style="background: radial-gradient(circle, rgba(212,149,106,0.4), transparent 70%); filter: blur(80px);"
      />
      <div class="mx-auto max-w-3xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-12 text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">FAQ</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-white sm:text-4xl">
            Questions fréquentes sur la ménopause
          </h2>
        </div>

        <UAccordion
          :items="faqItems"
          :default-value="faqDefaultValue"
          multiple
          aria-label="Questions fréquentes sur la ménopause"
          class="faq-dark"
        >
          <template #content="{ item }">
            <div class="space-y-3 pb-3.5 text-sm text-[#c4bdd0]">
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

    <!-- ==================== DISCLAIMER ENRICHI (AC-11) ==================== -->
    <section class="px-4 py-8 text-center">
      <p class="mx-auto max-w-2xl text-xs leading-relaxed text-[#857d8c]">
        L'accompagnement proposé sur Keova ne se substitue pas à un suivi médical.
        En cas de symptômes sévères, consultez votre médecin traitant ou gynécologue.
        Les spécialistes référencées sur Keova sont des professionnelles du bien-être, pas des médecins.
      </p>
      <p class="mx-auto mt-2 max-w-2xl text-xs text-[#9685ab]">
        Sources médicales :
        <a
          href="https://www.inserm.fr/dossier/menopause"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >INSERM — Ménopause</a>,
        <a
          href="https://www.has-sante.fr"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >HAS — Prise en charge de la ménopause</a>,
        <a
          href="https://www.inserm.fr/dossier/osteoporose"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >INSERM — Ostéoporose</a>
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Hero staggered appear */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-appear {
  animation: appear 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.stagger-1 { animation-delay: 120ms; }
.stagger-2 { animation-delay: 240ms; }
.stagger-3 { animation-delay: 400ms; }
.stagger-4 { animation-delay: 600ms; }

/* SVG underline draw */
@keyframes draw-underline {
  from { stroke-dashoffset: 300; }
  to { stroke-dashoffset: 0; }
}

.hero-underline path {
  stroke-dasharray: 300;
  animation: draw-underline 1s ease-out 0.5s backwards;
}

/* Ambient mesh drift */
@keyframes drift-slow {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(15px, -10px); }
  66% { transform: translate(-10px, 8px); }
}

@keyframes drift-slow-reverse {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-12px, 8px); }
  66% { transform: translate(10px, -12px); }
}

.animate-drift-slow {
  animation: drift-slow 20s ease-in-out infinite;
}

.animate-drift-slow-reverse {
  animation: drift-slow-reverse 25s ease-in-out infinite;
}

/* ========= SCROLLTELLING ========= */

.scroll-reveal {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(32px);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0) translateX(0) scale(1);
}

.js-scroll-ready .scroll-reveal.reveal-from-left:not(.is-visible) {
  transform: translateX(-40px) translateY(0);
}

.js-scroll-ready .scroll-reveal.reveal-from-right:not(.is-visible) {
  transform: translateX(40px) translateY(0);
}

.js-scroll-ready .scroll-reveal.reveal-clip:not(.is-visible) {
  transform: translateY(48px);
}

/* CTA breathing glow */
@keyframes cta-pulse {
  0%, 100% { box-shadow: 0 4px 24px rgba(212, 149, 106, 0.25); }
  50% { box-shadow: 0 8px 40px rgba(212, 149, 106, 0.4); }
}

.cta-glow {
  animation: cta-pulse 3s ease-in-out infinite;
}

/* FAQ dark theme overrides */
.faq-dark :deep(button) {
  color: #f0ebe5;
}

.faq-dark :deep(button:hover) {
  color: #d4956a;
}

.faq-dark :deep([data-state="open"] > button) {
  color: #d4956a;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-appear,
  .hero-underline path,
  .animate-drift-slow,
  .animate-drift-slow-reverse,
  .cta-glow {
    animation: none;
  }
  .hero-appear {
    opacity: 1;
    transform: none;
  }
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
