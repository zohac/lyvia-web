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
  { icon: 'i-lucide-heart-pulse', title: 'Cycles irréguliers', text: 'Des règles qui deviennent imprévisibles\u00A0: plus abondantes, plus espacées, parfois absentes pendant des mois. C\u2019est souvent le premier signe de la périménopause.' },
  { icon: 'i-lucide-flame', title: 'Bouffées de chaleur', text: 'Des vagues de chaleur soudaines qui montent du torse au visage. Elles perturbent le sommeil, la concentration et la vie sociale. Ça touche 75 à 80\u00A0% des femmes.' },
  { icon: 'i-lucide-moon', title: 'Troubles du sommeil', text: 'Réveils nocturnes, insomnies, sommeil fragmenté. Le manque de sommeil amplifie tous les autres symptômes.' },
  { icon: 'i-lucide-battery-low', title: 'Fatigue chronique', text: 'Un épuisement qui ne passe pas, même après une nuit correcte. La fatigue de la ménopause est hormonale, pas psychologique.' },
  { icon: 'i-lucide-cloud-rain', title: 'Anxiété et irritabilité', text: 'Des émotions qui débordent sans prévenir. Les fluctuations hormonales affectent directement les neurotransmetteurs du bien-être.' },
  { icon: 'i-lucide-scale', title: 'Prise de poids', text: 'Un changement métabolique qui redistribue les graisses. Ce n\u2019est pas un manque de volonté. L\u2019alimentation et le mouvement adaptés font une vraie différence.' },
  { icon: 'i-lucide-brain', title: 'Troubles de la mémoire', text: 'Le brouillard mental\u00A0: vous cherchez vos mots, vous oubliez pourquoi vous êtes entrée dans une pièce. C\u2019est documenté et souvent temporaire.' }
]

const symptomsGroup2 = [
  { icon: 'i-lucide-bone', title: 'Douleurs articulaires', text: 'Genoux, mains, épaules. Souvent confondues avec de l\u2019arthrose, elles sont liées à la chute des œstrogènes.' },
  { icon: 'i-lucide-droplets', title: 'Sécheresse intime', text: 'Touche jusqu\u2019à 50\u00A0% des femmes après la ménopause. Ce symptôme tabou a des solutions concrètes.' },
  { icon: 'i-lucide-shield-alert', title: 'Perte osseuse', text: 'L\u2019ostéoporose touche 1 femme sur 3 après 50 ans. Renforcement musculaire, calcium, vitamine D et suivi médical sont les 3 piliers.', source: 'INSERM', sourceUrl: 'https://www.inserm.fr/dossier/osteoporose' }
]

const allSymptoms = [...symptomsGroup1, ...symptomsGroup2]

// --- 4 piliers ---
const pillars = [
  { num: '01', title: 'C\u2019est réel.', text: '80\u00A0% des femmes en ménopause ont des symptômes qui leur changent le quotidien (INSERM). Et ça évolue avec les années.', icon: 'i-lucide-brain', sourceLabel: 'INSERM', sourceUrl: 'https://www.inserm.fr/dossier/menopause' },
  { num: '02', title: 'Chaque situation est différente.', text: 'Votre sommeil, votre alimentation, votre stress, votre histoire. La spécialiste prend le temps de comprendre avant de proposer quoi que ce soit.', icon: 'i-lucide-heart-handshake' },
  { num: '03', title: 'Des pros, pas des influenceuses.', text: 'Naturopathes, sophrologues, coachs santé. Formées à la ménopause. Leurs formations sont sur leur profil.', icon: 'i-lucide-shield-check' },
  { num: '04', title: 'Ça va avec votre médecin.', text: 'On ne remplace pas le médecin. On complète\u00A0: alimentation, stress, sommeil, mouvement. Traitement hormonal ou pas.', icon: 'i-lucide-leaf' }
]

// --- FAQ V2 — 11 questions (AC-7) ---
const faqItems: AccordionItem[] = [
  { label: 'Qu\u2019est-ce que la ménopause\u00A0?', content: 'La ménopause est l\u2019arrêt définitif des menstruations, confirmé après 12 mois consécutifs sans règles. Elle survient en moyenne vers 51 ans en France. La périménopause peut commencer dès 38-40 ans et durer 4 à 8 ans.\n\nSource : INSERM (inserm.fr/dossier/menopause)', value: 'faq-1' },
  { label: 'Quels sont les symptômes de la ménopause\u00A0?', content: 'Bouffées de chaleur (75-80\u00A0% des femmes), troubles du sommeil, fatigue, anxiété, prise de poids, troubles de la mémoire, sécheresse vaginale, douleurs articulaires.\n\nAprès la ménopause : perte osseuse, douleurs chroniques, perte musculaire.\n\nChaque femme les vit différemment.', value: 'faq-2' },
  { label: 'Quelle différence entre ménopause et périménopause\u00A0?', content: 'La périménopause est la phase de transition hormonale qui précède la ménopause. Elle peut commencer dès 38-40 ans. Les symptômes commencent souvent pendant cette phase. La ménopause est confirmée quand les règles ont cessé depuis 12 mois.', value: 'faq-3' },
  { label: 'Qu\u2019est-ce que l\u2019accompagnement ménopause\u00A0?', content: 'Un suivi personnalisé avec une professionnelle formée : naturopathe, sophrologue, coach santé. Alimentation, sommeil, stress, mouvement. En complément du médical, pas à sa place.', value: 'faq-4' },
  { label: 'Qui sont les spécialistes sur Keova\u00A0?', content: 'Des professionnelles du bien-être formées à la ménopause. Chaque profil indique ses formations, ses spécialités et son approche. Vous pouvez vérifier avant de réserver.', value: 'faq-5' },
  { label: 'Combien coûte un accompagnement\u00A0?', content: 'Le premier appel est gratuit (15 min, sans CB). Ensuite, chaque spécialiste fixe ses tarifs. Comptez 50 à 90\u00A0€ par séance. Des programmes existent pour un suivi régulier.', value: 'faq-6' },
  { label: 'Est-ce compatible avec un traitement hormonal (THM)\u00A0?', content: 'Oui. L\u2019accompagnement complète le THM sur ce qu\u2019il ne couvre pas toujours : sommeil, alimentation, stress, mouvement.', value: 'faq-7' },
  { label: 'L\u2019accompagnement remplace-t-il un médecin\u00A0?', content: 'Non. Il complète le suivi médical. Si vous avez des symptômes sévères, consultez d\u2019abord votre médecin.', value: 'faq-8' },
  { label: 'Comment se déroule un appel découverte\u00A0?', content: '15 minutes en visio. Un échange libre pour comprendre votre situation. Aucun engagement, aucune CB. Vous décidez ensuite.', value: 'faq-9' },
  { label: 'Je ne suis pas sûre d\u2019être en ménopause. Puis-je quand même consulter\u00A0?', content: 'Oui. La périménopause peut commencer dès 38 ans. Si vous avez un doute, un premier échange peut vous aider à y voir clair.', value: 'faq-10' },
  { label: 'Et après la ménopause, c\u2019est trop tard\u00A0?', content: 'Pas du tout. La post-ménopause a ses propres défis : os, articulations, muscles, cœur. Un accompagnement aide à construire un plan durable.', value: 'faq-11' }
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

// --- Animated counter (0 → 14) ---
const statCount = ref(0)
const statEl = useTemplateRef<HTMLElement>('stat-card')
onMounted(() => {
  if (!statEl.value) return
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || statCount.value >= 14) return
    observer.disconnect()
    const duration = 1200
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      statCount.value = Math.round(eased * 14)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, { threshold: 0.5 })
  observer.observe(statEl.value)
})
</script>

<template>
  <div :class="['relative overflow-hidden', { 'js-scroll-ready': scrollReady }]">
    <!-- ══════════════════════════════════════════════════════════
         CHAPITRE 1 — HERO (dark, immersif, typo massive)
         ══════════════════════════════════════════════════════════ -->
    <section class="relative flex min-h-[100dvh] items-center overflow-hidden bg-[#1a1525] px-6 sm:px-12 lg:px-20">
      <!-- Ambient glows -->
      <div
        class="pointer-events-none absolute -left-[20%] top-[10%] h-[70vh] w-[70vh] rounded-full opacity-30"
        style="background: radial-gradient(circle, rgba(212,149,106,0.5), transparent 65%); filter: blur(120px);"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-[10%] bottom-[5%] h-[50vh] w-[50vh] rounded-full opacity-20"
        style="background: radial-gradient(circle, rgba(122,107,142,0.5), transparent 65%); filter: blur(100px);"
        aria-hidden="true"
      />

      <div class="relative z-10 mx-auto w-full max-w-6xl py-32">
        <!-- Eyebrow -->
        <div class="hero-appear mb-10 inline-flex items-center gap-2.5 rounded-full border border-[#d4956a]/25 bg-[#d4956a]/10 px-5 py-2 backdrop-blur-sm">
          <span class="size-2 animate-pulse rounded-full bg-[#d4956a]" />
          <span class="text-sm font-medium tracking-wide text-[#d4956a]">Accompagnement ménopause en France</span>
        </div>

        <!-- H1 — massive, asymmetric -->
        <h1 class="hero-appear stagger-1 max-w-4xl font-serif text-5xl font-bold leading-[1.05] text-white sm:text-7xl lg:text-8xl">
          Ce n'est pas
          <br>
          dans votre
          <span class="bg-gradient-to-r from-[#d4956a] to-[#e8a878] bg-clip-text text-transparent"> tête.</span>
        </h1>

        <!-- Sous-ligne -->
        <p class="hero-appear stagger-2 mt-8 max-w-xl text-xl leading-relaxed text-white/60">
          Bouffées de chaleur, fatigue, douleurs articulaires.
          La ménopause, ça se vit dans le corps. Et on peut se faire aider.
        </p>

        <!-- CTA row -->
        <div class="hero-appear stagger-3 mt-12 flex flex-wrap items-center gap-5">
          <button
            class="cta-glow group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#d4956a] to-[#c8845e] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#d4956a]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            @click="scrollTo('specialistes')"
          >
            <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span class="relative flex items-center gap-2.5">
              Parler à une spécialiste
              <UIcon
                name="i-lucide-arrow-down"
                class="size-5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </span>
          </button>
          <span class="text-sm text-white/40">Premier appel gratuit · 15 min · Sans engagement</span>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2">
        <span class="text-xs font-medium uppercase tracking-[0.3em] text-white/30">Découvrir</span>
        <div class="scroll-indicator relative h-10 w-5 rounded-full border border-white/20">
          <div class="absolute left-1/2 top-2 size-1.5 -translate-x-1/2 animate-scroll-dot rounded-full bg-[#d4956a]" />
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         CHAPITRE 2 — LA RÉALITÉ (warm transition, split layout)
         ══════════════════════════════════════════════════════════ -->
    <section class="relative bg-gradient-to-b from-[#1a1525] via-[#2d2438] to-[#f5ede6] px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <!-- Left: text -->
        <div
          v-bind="reveal()"
          class="scroll-reveal"
        >
          <h2 class="font-serif text-4xl leading-tight text-white sm:text-5xl">
            Ce que vous vivez<br>a un nom.
          </h2>
          <div class="mt-8 space-y-5 text-lg leading-relaxed text-white/70">
            <p>
              Vous vous réveillez à 3h du matin, trempée.
              Vous cherchez un mot que vous connaissiez hier.
              Vous pleurez sans savoir pourquoi.
              Vos règles font n'importe quoi.
            </p>
            <p class="font-medium text-white/90">
              Ce n'est pas le stress. Ce n'est pas l'âge.
              C'est hormonal. Et ça peut commencer dès 38 ans.
            </p>
            <p class="text-[#d4956a]">
              Vous n'avez pas à gérer ça seule.
            </p>
          </div>
        </div>

        <!-- Right: stat card + after-menopause — stacked with reveal -->
        <div class="flex flex-col gap-10">
          <!-- Stat card — hero-sized number -->
          <div
            ref="stat-card"
            class="stat-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-10 text-center sm:p-12"
          >
            <!-- Animated warm glow behind number -->
            <div
              class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-1000"
              :class="{ 'opacity-100': statCount > 0 }"
              style="background: radial-gradient(ellipse at 50% 40%, rgba(212,149,106,0.15), transparent 70%);"
              aria-hidden="true"
            />
            <div class="relative">
              <p class="font-serif text-7xl font-bold tabular-nums text-[#d4956a] sm:text-8xl lg:text-9xl">
                {{ statCount }}<span class="text-4xl sm:text-5xl">M</span>
              </p>
              <p class="mt-4 text-lg text-white/50">
                de femmes en France.
              </p>
              <div class="mx-auto my-5 h-px w-20 bg-gradient-to-r from-transparent via-[#d4956a]/30 to-transparent" />
              <p class="text-base font-medium text-white/40">
                La plupart gèrent ça seules.
              </p>
            </div>
          </div>

          <!-- After menopause — slides in from right -->
          <div
            v-bind="reveal({ delay: 300 })"
            class="scroll-reveal reveal-from-right group relative overflow-hidden rounded-[2rem] border border-[#d4956a]/20 p-8 sm:p-10"
            style="background: linear-gradient(135deg, #f5ede6, #faf5f0);"
          >
            <!-- Decorative accent line -->
            <div
              class="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#d4956a] to-[#d4956a]/20"
              aria-hidden="true"
            />
            <h3 class="font-serif text-2xl text-[#3d3250] sm:text-3xl">
              Et après les bouffées de chaleur...
            </h3>
            <p class="mt-5 text-lg leading-relaxed text-[#6b6177]">
              D'autres choses arrivent. Des douleurs dans les mains au réveil.
              Du poids qui ne bouge plus. Des os qui se fragilisent.
              Une fatigue de fond, tout le temps.
            </p>
            <p class="mt-4 text-lg font-medium text-[#d4956a]">
              Même dix ans après, il y a des choses à faire.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         CHAPITRE 3 — LA RENAISSANCE (lumineux, piliers + étapes)
         ══════════════════════════════════════════════════════════ -->
    <section class="relative bg-[#faf8f6] px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-6xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-20 max-w-2xl"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Comprendre</span>
          <h2 class="mt-4 font-serif text-4xl leading-tight text-[#3d3250] sm:text-5xl">
            Pourquoi se faire accompagner&#8239;?
          </h2>
          <p class="mt-5 text-lg text-[#857d8c]">
            La ménopause n'est pas une maladie. Mais elle change des choses
            dans votre corps et dans votre quotidien.
          </p>
        </div>

        <!-- Piliers — alternating left/right full-width -->
        <div class="space-y-6">
          <div
            v-for="(p, i) in pillars"
            :key="p.num"
            v-bind="reveal({ delay: i * 100 })"
            class="scroll-reveal group grid items-center gap-8 rounded-[2rem] border border-[#ebe4f3]/60 bg-white/80 p-8 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_16px_48px_rgba(212,149,106,0.08)] sm:grid-cols-[auto_1fr] sm:p-10"
          >
            <div class="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#d4956a]/15 to-[#e8a878]/10 transition-all duration-500 group-hover:from-[#d4956a]/25 group-hover:shadow-md">
              <UIcon
                :name="p.icon"
                class="size-8 text-[#d4956a] transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div>
              <div class="flex items-baseline gap-3">
                <span class="font-serif text-2xl font-light text-[#d4956a]/30">{{ p.num }}</span>
                <h3 class="font-serif text-xl text-[#3d3250]">
                  {{ p.title }}
                </h3>
              </div>
              <p class="mt-2 text-base leading-relaxed text-[#6b6177]">
                {{ p.text }}
              </p>
              <a
                v-if="p.sourceUrl"
                :href="p.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-block text-xs text-[#d4956a] hover:underline"
              >Source : {{ p.sourceLabel }}</a>
            </div>
          </div>
        </div>

        <!-- 3 étapes — horizontal minimal -->
        <div class="mt-24">
          <h2
            v-bind="reveal()"
            class="scroll-reveal mb-12 font-serif text-3xl text-[#3d3250] sm:text-4xl"
          >
            Comment ça marche
          </h2>
          <div class="grid gap-6 sm:grid-cols-3">
            <div
              v-for="(step, i) in [
                { num: '01', title: 'Regardez les profils', text: 'Formations, spécialités, approche. Tout est là.', icon: 'i-lucide-search' },
                { num: '02', title: 'Appelez gratuitement', text: '15 minutes pour faire connaissance. Pas de CB.', icon: 'i-lucide-phone' },
                { num: '03', title: 'Vous décidez', text: 'Une séance, un programme, un suivi. C\u2019est vous qui voyez.', icon: 'i-lucide-heart-handshake' }
              ]"
              :key="step.num"
              v-bind="reveal({ delay: i * 150 })"
              class="scroll-reveal group rounded-2xl border border-transparent bg-gradient-to-br from-[#f5ede6]/80 to-white p-6 transition-all duration-300 hover:border-[#d4956a]/15 hover:shadow-lg"
            >
              <span class="text-4xl font-bold text-[#d4956a]/15">{{ step.num }}</span>
              <h3 class="mt-3 text-lg font-semibold text-[#3d3250]">
                {{ step.title }}
              </h3>
              <p class="mt-2 text-sm text-[#6b6177]">
                {{ step.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         CHAPITRE 4 — LA RENCONTRE (spécialistes + symptômes)
         ══════════════════════════════════════════════════════════ -->
    <section
      id="specialistes"
      class="relative bg-gradient-to-b from-[#faf8f6] to-[#f0eaf5] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-16 text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Rencontre</span>
          <h2 class="mt-4 font-serif text-4xl text-[#3d3250] sm:text-5xl">
            Les spécialistes
          </h2>
          <p class="mt-4 text-lg text-[#857d8c]">
            Formées à la ménopause. En visio ou en cabinet.
          </p>
        </div>

        <!-- Specialist cards -->
        <div
          v-if="providers.length"
          class="flex flex-wrap justify-center gap-8"
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
          class="scroll-reveal mx-auto max-w-md rounded-3xl border border-dashed border-[#d4956a]/20 bg-white/50 px-8 py-16 text-center backdrop-blur-sm"
        >
          <p class="font-serif text-2xl text-[#3d3250]">
            Nos spécialistes arrivent bientôt
          </p>
          <p class="mt-3 text-sm text-[#857d8c]">
            L'appel gratuit est le meilleur moyen de juger par vous-même.
          </p>
        </div>

        <!-- Symptômes — compact grid below specialists -->
        <div
          id="symptomes"
          class="mt-28"
        >
          <h2
            v-bind="reveal()"
            class="scroll-reveal mb-4 font-serif text-3xl text-[#3d3250] sm:text-4xl"
          >
            Ce que la ménopause peut changer
          </h2>
          <p
            v-bind="reveal()"
            class="scroll-reveal mb-10 max-w-xl text-base text-[#857d8c]"
          >
            Pas juste les bouffées de chaleur. Beaucoup de femmes mettent du temps
            à faire le lien entre ce qu'elles vivent et leurs hormones.
          </p>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(s, i) in allSymptoms"
              :key="s.title"
              v-bind="reveal({ delay: i * 50 })"
              class="scroll-reveal flex items-start gap-3 rounded-xl border border-white/70 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
            >
              <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#d4956a]/8">
                <UIcon
                  :name="s.icon"
                  class="size-4.5 text-[#d4956a]"
                />
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#3d3250]">
                  {{ s.title }}
                </h4>
                <p class="mt-1 text-xs leading-relaxed text-[#6b6177]">
                  {{ s.text }}
                </p>
                <a
                  v-if="s.sourceUrl"
                  :href="s.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-[0.65rem] text-[#d4956a] hover:underline"
                >Source : {{ s.source }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         CHAPITRE 5 — L'AVENIR (dark FAQ, Keova, CTA final)
         ══════════════════════════════════════════════════════════ -->

    <!-- Qui est derrière Keova -->
    <section class="relative bg-[#faf8f6] px-6 py-24 sm:px-12 lg:px-20">
      <div
        v-bind="reveal()"
        class="scroll-reveal mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.2fr]"
      >
        <div>
          <h2 class="font-serif text-3xl text-[#3d3250] sm:text-4xl">
            Qui est derrière Keova
          </h2>
        </div>
        <div class="space-y-4 text-lg leading-relaxed text-[#6b6177]">
          <p>
            Trop de femmes traversent la ménopause sans aide.
            Les infos sont partout et nulle part. Les bonnes spécialistes, difficiles à trouver.
          </p>
          <p>
            Simon Jouan a créé Keova pour ça. Un endroit simple pour trouver une pro formée à la ménopause.
            Pas un cabinet médical. Pas une app bien-être de plus.
          </p>
          <p class="text-sm text-[#857d8c]">
            Conçu en Normandie, hébergé en France (Scalingo, Paris). Conforme RGPD. Vos données restent en France.
          </p>
        </div>
      </div>
    </section>

    <!-- FAQ — dark warm -->
    <section
      id="faq"
      class="relative bg-gradient-to-br from-[#1a1525] via-[#2d2438] to-[#1a1525] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div
        class="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full opacity-20"
        style="background: radial-gradient(circle, rgba(212,149,106,0.4), transparent 70%); filter: blur(80px);"
        aria-hidden="true"
      />
      <div class="mx-auto max-w-3xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mb-12 text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">FAQ</span>
          <h2 class="mt-4 font-serif text-3xl text-white sm:text-4xl">
            Questions fréquentes
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

    <!-- CTA final — full-width warm -->
    <section class="relative bg-gradient-to-r from-[#d4956a] to-[#c8845e] px-6 py-24 text-center sm:px-12">
      <div class="mx-auto max-w-2xl">
        <h2 class="font-serif text-3xl font-bold text-white sm:text-4xl">
          Prête à en parler&#8239;?
        </h2>
        <p class="mx-auto mt-4 max-w-md text-lg text-white/80">
          15 minutes, gratuites, sans engagement. Juste un échange avec une spécialiste.
        </p>
        <button
          class="mt-10 cursor-pointer rounded-full bg-white px-10 py-4 text-base font-semibold text-[#3d3250] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
          @click="scrollTo('specialistes')"
        >
          Réserver un appel gratuit
        </button>
      </div>
    </section>

    <!-- Disclaimer -->
    <section class="bg-[#1a1525] px-6 py-8 text-center">
      <p class="mx-auto max-w-2xl text-xs leading-relaxed text-white/30">
        L'accompagnement proposé sur Keova ne se substitue pas à un suivi médical.
        En cas de symptômes sévères, consultez votre médecin.
      </p>
      <p class="mx-auto mt-2 max-w-2xl text-xs text-white/20">
        Sources :
        <a
          href="https://www.inserm.fr/dossier/menopause"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >INSERM</a>,
        <a
          href="https://www.has-sante.fr"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >HAS</a>,
        <a
          href="https://www.inserm.fr/dossier/osteoporose"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-[#d4956a]"
        >INSERM Ostéoporose</a>
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Hero staggered appear */
@keyframes appear {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-appear { animation: appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
.stagger-1 { animation-delay: 150ms; }
.stagger-2 { animation-delay: 350ms; }
.stagger-3 { animation-delay: 550ms; }

/* CTA breathing glow */
@keyframes cta-pulse {
  0%, 100% { box-shadow: 0 4px 24px rgba(212, 149, 106, 0.3); }
  50% { box-shadow: 0 8px 48px rgba(212, 149, 106, 0.5); }
}
.cta-glow { animation: cta-pulse 3s ease-in-out infinite; }

/* Scroll indicator bounce */
@keyframes scroll-dot {
  0%, 100% { top: 6px; opacity: 1; }
  50% { top: 22px; opacity: 0.3; }
}
.animate-scroll-dot { animation: scroll-dot 2s ease-in-out infinite; }

/* Stat card glass */
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 40px rgba(0, 0, 0, 0.2);
}

/* Scroll reveal */
.scroll-reveal {
  opacity: 1;
  transform: translateY(0) translateX(0);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(40px);
  will-change: opacity, transform;
}
.js-scroll-ready .scroll-reveal.reveal-from-right:not(.is-visible) {
  opacity: 0;
  transform: translateX(60px) translateY(0);
}
.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0) translateX(0);
}

/* FAQ dark theme */
.faq-dark :deep(button) { color: #f0ebe5; }
.faq-dark :deep(button:hover) { color: #d4956a; }
.faq-dark :deep([data-state="open"] > button) { color: #d4956a; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-appear, .cta-glow, .animate-scroll-dot { animation: none; }
  .hero-appear { opacity: 1; transform: none; }
  .scroll-reveal { opacity: 1; transform: none; transition: none; }
  .animate-scroll-dot { top: 6px; opacity: 1; }
}
</style>
