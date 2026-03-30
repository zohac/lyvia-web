<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { FeaturedProvider } from '~/components/organisms/SpecialistCard.vue'

import SpecialistCard from '~/components/organisms/SpecialistCard.vue'
import LeadCaptureForm from '~/components/organisms/LeadCaptureForm.vue'
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
    title: 'Ce que vous ressentez est réel.',
    text: 'Qu\u2019il s\u2019agisse de bouffées de chaleur à 45 ans ou de douleurs articulaires à 55 — vos symptômes sont réels, documentés, et reconnus.',
    detail: 'Selon l\u2019INSERM, 80\u00A0% des femmes en ménopause présentent des symptômes qui impactent leur qualité de vie. Et ils évoluent avec les années\u00A0: ce qui vous gêne aujourd\u2019hui ne sera pas ce qui vous préoccupera dans 5 ans.',
    coda: 'Vous n\u2019avez rien imaginé.',
    icon: 'i-lucide-brain',
    sourceLabel: 'INSERM',
    sourceUrl: 'https://www.inserm.fr/dossier/menopause'
  },
  {
    num: '02',
    title: 'Un accompagnement qui vous ressemble.',
    text: 'Chaque femme vit la ménopause différemment. Votre alimentation, votre sommeil, votre niveau de stress, votre histoire — tout compte. Une spécialiste prend le temps de comprendre votre quotidien avant de vous proposer des pistes concrètes.',
    detail: 'Pas un régime miracle. Pas un protocole copié-collé.',
    icon: 'i-lucide-heart-handshake'
  },
  {
    num: '03',
    title: 'Des professionnelles formées.',
    text: 'Les spécialistes référencées sur Keova sont des professionnelles du bien-être (naturopathes, sophrologues, coachs certifiées) formées spécifiquement à l\u2019accompagnement de la périménopause, de la ménopause et de la post-ménopause — y compris la prévention osseuse et cardiovasculaire.',
    detail: 'Chaque profil indique ses formations, ses spécialités et son approche.',
    icon: 'i-lucide-shield-check'
  },
  {
    num: '04',
    title: 'En complément du médical.',
    text: 'L\u2019accompagnement ménopause ne remplace pas votre médecin ou votre THM. Il complète le suivi médical avec ce que la consultation de 15 minutes ne couvre pas\u00A0: l\u2019alimentation adaptée, la gestion du stress, le sommeil, le mouvement — les 4 piliers d\u2019un mieux-être durable.',
    detail: 'Que vous soyez sous traitement hormonal ou non, l\u2019accompagnement s\u2019adapte à votre situation.',
    icon: 'i-lucide-leaf'
  }
]

// --- FAQ V2 — 11 questions ---
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
    label: 'Qu\u2019est-ce qu\u2019un accompagnement ménopause\u00A0?',
    content: 'C\u2019est un suivi personnalisé avec une professionnelle formée à la ménopause : naturopathe, sophrologue, coach santé. L\u2019accompagnement couvre l\u2019alimentation, le sommeil, la gestion du stress et le mouvement — en complément du suivi médical, pas à sa place.\n\nIl s\u2019adapte à votre phase : périménopause, ménopause ou post-ménopause.',
    value: 'faq-4'
  },
  {
    label: 'Comment choisir une spécialiste ménopause\u00A0?',
    content: 'Vérifiez ses formations et ses spécialités. Choisissez une approche qui vous parle (naturopathie, sophrologie, coaching holistique\u2026). Assurez-vous qu\u2019elle accompagne votre phase (périménopause, ménopause ou post-ménopause). Profitez du premier appel gratuit pour voir si le courant passe — c\u2019est le meilleur indicateur.',
    value: 'faq-5'
  },
  {
    label: 'Le premier appel est-il vraiment gratuit\u00A0?',
    content: 'Oui. Chaque spécialiste sur Keova propose un premier appel découverte de 15 minutes, gratuit et sans engagement. C\u2019est un échange pour comprendre votre situation et voir si l\u2019accompagnement peut vous aider. Aucune carte bancaire n\u2019est demandée.',
    value: 'faq-6'
  },
  {
    label: 'L\u2019accompagnement remplace-t-il un médecin\u00A0?',
    content: 'Non. L\u2019accompagnement ménopause complète le suivi médical. Si vous avez des symptômes sévères, consultez d\u2019abord votre médecin ou gynécologue. Les spécialistes sur Keova travaillent en complémentarité : alimentation, gestion du stress, sommeil, mouvement — ce que la consultation médicale de 15 minutes ne couvre pas.',
    value: 'faq-7'
  },
  {
    label: 'Mes symptômes peuvent-ils être liés à la périménopause, même avant 40 ans\u00A0?',
    content: 'Oui. La périménopause peut commencer dès 38-40 ans chez certaines femmes. Fatigue persistante, irritabilité inhabituelle, cycles qui changent, sommeil perturbé — ces symptômes sont souvent attribués au stress alors qu\u2019ils sont hormonaux. Si vous avez un doute, un premier échange avec une spécialiste peut vous aider à y voir clair.',
    value: 'faq-8'
  },
  {
    label: 'L\u2019accompagnement est-il compatible avec un traitement hormonal (THM)\u00A0?',
    content: 'Absolument. L\u2019accompagnement sur Keova est conçu comme un complément, pas une alternative. Si vous prenez un THM, une spécialiste peut vous aider sur ce que le traitement ne couvre pas toujours : le sommeil, l\u2019alimentation, le stress, le mouvement. Beaucoup de femmes sous THM constatent que l\u2019accompagnement complète efficacement leur traitement.',
    value: 'faq-9'
  },
  {
    label: 'L\u2019accompagnement sert-il encore après la ménopause\u00A0?',
    content: 'Oui — et c\u2019est souvent là qu\u2019il est le plus utile. La post-ménopause apporte ses propres défis : prévention osseuse, douleurs articulaires, maintien musculaire, santé cardiovasculaire, sécheresse intime. Un accompagnement adapté vous aide à construire un plan durable pour les années qui viennent. Il n\u2019est jamais trop tard pour agir.',
    value: 'faq-10'
  },
  {
    label: 'Comment prévenir l\u2019ostéoporose après la ménopause\u00A0?',
    content: 'La prévention repose sur 3 piliers : le renforcement musculaire (exercices en charge, pas juste de la marche), l\u2019alimentation (calcium, vitamine D, protéines), et le suivi médical (ostéodensitométrie régulière). Une spécialiste peut vous aider à construire un programme adapté à votre situation, en coordination avec votre médecin.\n\nSource : HAS — Prévention, diagnostic et traitement de l\u2019ostéoporose (has-sante.fr)',
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
      <div class="mx-auto max-w-3xl text-center">
        <!-- Eyebrow -->
        <div class="hero-appear mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/8 px-5 py-2.5 shadow-sm">
          <span class="size-2 animate-pulse rounded-full bg-[#d4956a]" />
          <span class="text-sm font-semibold tracking-wide text-[#b07a4a]">Le hub ménopause en France</span>
        </div>

        <!-- H1 -->
        <h1 class="hero-appear stagger-1 font-serif text-[2.5rem] leading-[1.1] tracking-tight text-[#3d3250] sm:text-5xl lg:text-[3.5rem]">
          La ménopause n'est pas une question de courage.
          <br>
          <span class="text-[#d4956a]">C'est une question d'accompagnement.</span>
        </h1>

        <!-- Sous-ligne phases (V2) -->
        <p class="hero-appear stagger-1 mt-4 text-base font-medium text-[#6b6177]">
          De la périménopause à l'après — chaque étape mérite un soutien adapté.
        </p>

        <!-- Sous-titre inclusif (V2) -->
        <p class="hero-appear stagger-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#6b6177]">
          Bouffées de chaleur, fatigue, douleurs articulaires, perte osseuse —
          à chaque étape de la ménopause, des symptômes réels méritent des réponses.
          <strong class="font-semibold text-[#3d3250]">Des spécialistes peuvent vous aider.</strong>
        </p>

        <!-- CTA -->
        <div class="hero-appear stagger-3 mt-10 flex flex-col items-center gap-4">
          <button
            class="group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#5b4b6e] via-[#6d5c82] to-[#7a6b8e] px-9 py-4 text-base font-semibold text-white shadow-lg shadow-[#5b4b6e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#5b4b6e]/30 active:scale-[0.98]"
            @click="scrollTo('specialistes')"
          >
            <span class="relative z-10 flex items-center gap-2.5">
              Trouver une spécialiste
              <UIcon
                name="i-lucide-arrow-down"
                class="size-5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </span>
          </button>
          <!-- Micro-copy -->
          <p class="text-sm text-[#857d8c]">
            Premier appel découverte gratuit · Sans engagement · Partout en France
          </p>
        </div>

        <!-- Stat sourcée (V2) -->
        <div class="hero-appear stagger-4 mx-auto mt-14 max-w-lg rounded-2xl border border-[#ebe7ef] bg-white/60 px-6 py-5 text-center backdrop-blur-sm">
          <p class="text-base leading-relaxed text-[#4a4255]">
            Plus de <strong class="font-semibold text-[#3d3250]">14 millions</strong> de femmes vivent la périménopause,
            la ménopause ou ses suites en France.
          </p>
          <p class="mt-1 text-sm text-[#857d8c]">
            La plupart traversent ces étapes sans accompagnement.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== BLOC DOULEUR 1 (AC-2) ==================== -->
    <section class="relative px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-3xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Ce que vous ressentez a un nom.
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            Vous vous réveillez à 3h du matin, trempée.
            Vous oubliez un mot que vous connaissiez par cœur hier.
            Vous pleurez sans raison — ou vous explosiez pour un rien.
            Vos règles deviennent imprévisibles — trop abondantes, puis plus rien pendant deux mois.
            Votre corps a changé, et personne autour de vous ne semble comprendre pourquoi.
          </p>
          <p class="font-medium text-[#3d3250]">
            Ce n'est pas le stress. Ce n'est pas l'âge. Ce n'est pas « dans votre tête ».
          </p>
          <p>
            C'est la ménopause — ou la périménopause, qui peut commencer dès 38-40 ans.
          </p>
          <p class="font-medium text-[#d4956a]">
            Et vous n'avez pas à traverser ça seule.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== BLOC DOULEUR 2 — post-ménopause (AC-3) ==================== -->
    <section class="relative bg-white/50 px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-3xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Et quand les bouffées de chaleur s'atténuent...
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            ...d'autres changements prennent le relais.
          </p>
          <p>
            Des douleurs articulaires au réveil — genoux, mains, épaules —
            que personne ne vous avait prévenue.
            Une prise de poids que rien ne fait bouger.
            Des os qui se fragilisent en silence.
            Une fatigue de fond qui ne part jamais vraiment.
          </p>
          <p class="font-medium text-[#3d3250]">
            La ménopause ne s'arrête pas aux bouffées de chaleur.
            Et l'accompagnement non plus.
          </p>
          <p class="font-medium text-[#d4956a]">
            Que vous soyez en pleine transition ou dix ans après,
            il n'est jamais trop tard pour agir.
          </p>
        </div>
      </div>
    </section>

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
            Pourquoi un accompagnement ménopause&#8239;?
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            La ménopause n'est pas une maladie. C'est une transition hormonale naturelle —
            mais elle mérite un soutien adapté à ce que vous vivez, pas un protocole générique.
          </p>
        </div>

        <!-- Pillar cards V2 — enrichis avec detail + source -->
        <div class="mt-16 grid gap-5 sm:grid-cols-2">
          <div
            v-for="(p, i) in pillars"
            :key="p.num"
            v-bind="reveal({ delay: i * 120 })"
            :class="['scroll-reveal group relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(91,75,110,0.1)]', i % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right']"
          >
            <div
              class="absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br from-[#d4956a]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div class="relative">
              <div class="mb-6 flex items-center justify-between">
                <div class="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3] shadow-sm">
                  <UIcon
                    :name="p.icon"
                    class="size-7 text-[#5b4b6e]"
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
              <p
                v-if="p.detail"
                class="mt-2 text-[0.9rem] leading-relaxed text-[#6b6177]"
              >
                {{ p.detail }}
              </p>
              <p
                v-if="p.coda"
                class="mt-2 text-[0.9rem] font-medium text-[#3d3250]"
              >
                {{ p.coda }}
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
    <section class="relative bg-white/50 px-4 py-24 sm:py-32">
      <div class="mx-auto max-w-4xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Le parcours</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Comment trouver de l'aide
          </h2>
        </div>

        <div class="mt-14 grid gap-8 sm:grid-cols-3">
          <div
            v-for="(step, i) in [
              { num: '1', title: 'Consultez les profils', text: 'Parcourez les fiches de nos spécialistes\u00A0: formation, spécialités, approche, localisation. Choisissez celle qui correspond à ce que vous cherchez — que ce soit pour la périménopause, la ménopause ou un suivi après la ménopause.', icon: 'i-lucide-search' },
              { num: '2', title: 'Réservez un appel gratuit', text: 'Chaque spécialiste propose un premier appel découverte gratuit de 15 minutes. Sans engagement, sans carte bancaire. C\u2019est un échange pour voir si le courant passe.', icon: 'i-lucide-calendar' },
              { num: '3', title: 'Démarrez à votre rythme', text: 'Si vous vous sentez en confiance, vous décidez ensemble de la suite\u00A0: une consultation ponctuelle, un programme sur plusieurs semaines, ou un suivi préventif régulier. Toujours à votre rythme.', icon: 'i-lucide-heart-handshake' }
            ]"
            :key="step.num"
            v-bind="reveal({ delay: i * 150 })"
            class="scroll-reveal group flex flex-col items-center rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3] shadow-sm">
              <UIcon
                :name="step.icon"
                class="size-7 text-[#5b4b6e]"
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

    <!-- ==================== SPÉCIALISTES (AC-12) ==================== -->
    <section
      id="specialistes"
      class="relative px-4 py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
        style="background: linear-gradient(180deg, transparent, rgba(122,107,142,0.04) 30%, rgba(122,107,142,0.04) 70%, transparent);"
      />
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Accompagnement</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Nos spécialistes accompagnement ménopause
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            Des professionnelles formées à l'accompagnement de la périménopause,
            de la ménopause et de la post-ménopause.
            Chaque profil détaille ses formations, ses spécialités et son approche.
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
            Symptômes de la ménopause et de la périménopause
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            La ménopause se manifeste de dizaines de façons — et beaucoup de femmes ne font pas le lien tout de suite.
            Les symptômes évoluent avec le temps : certains apparaissent dès la périménopause, d'autres après.
            Si vous vous reconnaissez, un accompagnement peut vous aider.
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
              class="scroll-reveal group rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
              class="scroll-reveal group rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
    <section class="relative bg-white/50 px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-2xl text-center"
      >
        <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Témoignages</span>
        <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Elles ont trouvé leur spécialiste
        </h2>
        <div class="mx-auto mt-8 max-w-lg rounded-2xl border border-[#ebe7ef] bg-white/80 px-8 py-10 backdrop-blur-sm">
          <p class="text-base leading-relaxed text-[#6b6177]">
            Nous construisons Keova avec les femmes et les spécialistes qui nous font confiance.
          </p>
          <p class="mt-4 text-base leading-relaxed text-[#6b6177]">
            Les premiers témoignages arrivent bientôt.
            En attendant, chaque spécialiste propose un appel gratuit pour que vous puissiez juger par vous-même.
          </p>
          <button
            class="mt-8 cursor-pointer rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e] px-8 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            @click="scrollTo('specialistes')"
          >
            Réserver un appel gratuit
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== QUI EST DERRIÈRE KEOVA (AC-9) ==================== -->
    <section class="relative px-4 py-20 sm:py-28">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto max-w-3xl"
      >
        <h2 class="font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
          Qui est derrière Keova&#8239;?
        </h2>
        <div class="mt-8 space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            Keova est né d'un constat : trop de femmes traversent la ménopause sans accompagnement adapté.
            Les informations sont dispersées, les spécialistes difficiles à trouver, et les solutions génériques.
          </p>
          <p>
            Keova est un hub de mise en relation entre les femmes en ménopause et des spécialistes formées —
            pas un cabinet médical, pas une application de bien-être généraliste.
          </p>
          <p class="text-[#857d8c]">
            Keova est développé et hébergé en France par [Nom entité], [Ville].
            Conforme RGPD. Vos données ne quittent jamais le territoire français.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== FAQ — 11 Q&A (AC-7) ==================== -->
    <section
      id="faq"
      class="relative bg-white/50 px-4 py-24 sm:py-32"
    >
      <div class="mx-auto max-w-3xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-12 text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">FAQ</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl">
            Questions fréquentes sur la ménopause
          </h2>
        </div>

        <UAccordion
          :items="faqItems"
          :default-value="faqDefaultValue"
          multiple
          aria-label="Questions fréquentes sur la ménopause"
        >
          <template #content="{ item }">
            <div class="space-y-3 pb-3.5 text-sm text-[#6b6177]">
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

    <!-- ==================== LEAD CAPTURE (AC-10) ==================== -->
    <section class="relative px-4 py-24 sm:py-32">
      <div
        v-bind="reveal()"
        class="scroll-reveal reveal-clip mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3d3250] via-[#4a3d5e] to-[#5b4b6e] p-10 shadow-2xl shadow-[#3d3250]/20 sm:p-14"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full opacity-30"
          style="background: radial-gradient(circle, rgba(212,149,106,0.5), transparent 70%); filter: blur(50px);"
        />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full opacity-20"
          style="background: radial-gradient(circle, rgba(122,107,142,0.6), transparent 70%); filter: blur(40px);"
        />
        <div class="relative text-center">
          <h2 class="font-serif text-3xl text-white sm:text-4xl">
            Recevez votre guide gratuit
          </h2>
          <p class="mt-4 text-base leading-relaxed text-[#c4bdd0]">
            Chaque semaine, recevez un conseil actionnable pour mieux vivre votre ménopause —
            que vous soyez au début, au milieu, ou après.
            Pas de spam, pas de jargon médical — juste ce qui marche.
          </p>
          <div class="mx-auto mt-10 max-w-md">
            <LeadCaptureForm />
          </div>
          <p class="mt-6 text-xs text-[#9685ab]">
            Données hébergées en France. Conforme RGPD. Désinscription en un clic.
          </p>
        </div>
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

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-appear,
  .hero-underline path,
  .animate-drift-slow,
  .animate-drift-slow-reverse {
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
