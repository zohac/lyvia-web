<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import type { PublicProgramListItem } from '../../features/programs/api/programs.contract'
import { listPublicPrograms } from '../../features/programs/services/public-programs.service'
import CoachHeroProfile from '../organisms/CoachHeroProfile.vue'
import ProgramCard from '../organisms/ProgramCard.vue'
import ProgramCheckoutModal from '../organisms/ProgramCheckoutModal.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()

const auth = useAuth()

const { data: publicPrograms } = await useAsyncData<PublicProgramListItem[]>('public-programs', async () => {
  try {
    return await listPublicPrograms()
  } catch {
    return []
  }
}, { default: () => [] })

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre coach')

// X3.3: Program checkout modal state
const checkoutModalOpen = ref(false)
const selectedProgram = ref<PublicProgramListItem | null>(null)

function handleProgramCheckout(program: PublicProgramListItem) {
  selectedProgram.value = program
  checkoutModalOpen.value = true
}

const pillars = [
  {
    title: 'Alimentation bienveillante',
    description: 'Des repères simples et concrets pour soutenir votre métabolisme, vos hormones et votre énergie, sans régime ni culpabilité.'
  },
  {
    title: 'Gestion du stress',
    description: 'Des outils accessibles pour soutenir votre système nerveux, retrouver un meilleur sommeil et apaiser les réactions émotionnelles.'
  },
  {
    title: 'Sommeil réparateur',
    description: 'Des clés naturelles pour retrouver des nuits paisibles, réduire les réveils nocturnes et vous réveiller avec plus d\'énergie.'
  },
  {
    title: 'Mouvement adapté',
    description: 'Des conseils concrets pour bouger en douceur, selon votre niveau d\'énergie, sans pression ni comparaison.'
  }
]

const benefits = [
  'Votre poids de forme, sans régime ni frustration',
  'Moins de bouffées de chaleur, moins de fatigue, plus de vitalité',
  'Des émotions plus stables, moins d\'irritabilité',
  'Une mémoire et une concentration qui reviennent',
  'L\'énergie et la motivation pour reprendre vos projets en main',
  'La confiance que ce second chapitre de vie peut être beau'
]

const faqItems: AccordionItem[] = [
  {
    label: 'À quel moment commencer un accompagnement pour la ménopause ?',
    content: 'Même si les premiers signes de la périménopause peuvent sembler anodins, c\'est souvent le bon moment pour commencer un accompagnement. Fatigue persistante, troubles du sommeil, sautes d\'humeur ou prise de poids peuvent indiquer un déséquilibre hormonal. Plus vous agissez tôt, plus vous pouvez traverser cette transition avec sérénité.'
  },
  {
    label: `Est-ce que l'accompagnement de ${coachName.value} est médical ?`,
    content: `Non. Il s'agit d'un accompagnement global non médical, centré sur l'équilibre de vie et le bien-être. ${coachName.value} propose des repères concrets en alimentation, gestion du stress, sommeil et mouvement, ainsi qu'un soutien émotionnel personnalisé. En cas de besoin, vous serez orienté(e) vers un professionnel de santé.`
  },
  {
    label: `Combien coûte un accompagnement avec ${coachName.value} ?`,
    content: `L'accompagnement commence par une séance bilan de 1h30 à 100\u00A0€, qui permet de faire le point sur votre situation, vos symptômes et vos objectifs.\n\nLes séances de suivi mensuelles de 45 minutes sont proposées à 80\u00A0€.\n\nUn minimum de 5 séances de suivi est recommandé afin de favoriser un mieux-être durable et des changements ancrés dans le temps. Cette approche progressive permet d'accompagner le corps et l'esprit avec douceur et cohérence.`
  },
  {
    label: `L'appel gratuit est-il vraiment sans engagement ?`,
    content: `Oui, totalement. L'appel découverte de 15 minutes est gratuit et sans engagement. Il vous permet d'échanger avec ${coachName.value}, de poser vos questions et de voir si l'accompagnement vous correspond.`
  },
  {
    label: 'Est-ce adapté si je suis déjà ménopausée depuis plusieurs années ?',
    content: 'Oui. Même plusieurs années après la ménopause, il est possible de retrouver énergie, confort et équilibre. L\'accompagnement s\'adapte à votre parcours, quel que soit votre stade.'
  },
  {
    label: 'Les accompagnements se font-ils en présentiel ou en visio ?',
    content: `Tous les accompagnements se déroulent en visio. Basée à Valognes, près de Cherbourg, dans le Nord Cotentin (Manche, 50), ${coachName.value} accompagne des femmes partout en France. Pas besoin de vous déplacer : vous gagnez du temps et bénéficiez d'un accompagnement personnalisé, de chez vous.`
  }
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <CoachHeroProfile
      :tenant="tenant"
      :cta-to="ctaTo"
    />

    <!-- Section: Manifeste - Full-width pull quote -->
    <section class="relative overflow-hidden bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20">
      <!-- Decorative line -->
      <div class="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#d4956a]/30 to-transparent" />

      <div class="mx-auto max-w-5xl">
        <blockquote class="relative">
          <!-- Large quotation mark -->
          <span
            class="absolute -left-4 -top-8 font-serif text-[12rem] leading-none text-[#d4956a]/10 lg:-left-16"
            aria-hidden="true"
          >"</span>

          <p class="relative font-serif text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] text-[#2d2438]">
            Je ne comprends pas ce qu'il m'arrive... J'ai 43 ans, j'ai pris
            6 kilos en 6 mois, je suis toujours épuisée, stressée pour un rien.
            J'ai des insomnies, des douleurs articulaires... J'ai l'impression
            d'avoir pris 20 ans en quelques mois. Et mon médecin me dit
            que tout est normal.
          </p>
        </blockquote>

        <!-- Transition text -->
        <div class="mt-12 space-y-6">
          <p class="text-lg leading-relaxed text-[#4a4255]">
            Vous vous reconnaissez dans ces mots ?
            <br class="hidden sm:block">
            Épuisement, prise de poids, troubles du sommeil, anxiété,
            bouffées de chaleur, sécheresse...
            <br class="hidden sm:block">
            Et si tout cela était lié à la ménopause ?
          </p>

          <p class="text-lg font-medium italic text-[#5b4b6e]">
            Il est temps de comprendre ce que vit votre corps
            - et de vous offrir le soutien que vous méritez.
          </p>
        </div>
      </div>
    </section>

    <!-- Section: Projection - Benefits & transformation -->
    <section class="bg-white px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
          Et si, dans quelques mois, vous retrouviez enfin votre équilibre ?
        </h2>

        <p class="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#4a4255]">
          Imaginez-vous... Vous êtes plus légère, apaisée, vous dormez mieux.
          Vous comprenez votre corps et ses besoins.
          Vous vous sentez à nouveau vous-même.
        </p>

        <!-- Benefits list -->
        <ul class="mx-auto mt-12 max-w-xl space-y-4 text-left">
          <li
            v-for="benefit in benefits"
            :key="benefit"
            class="flex items-start gap-3 text-base leading-relaxed text-[#4a4255]"
          >
            <span
              class="mt-1 text-[#4a8b6e]"
              aria-hidden="true"
            >✓</span>
            <span>{{ benefit }}</span>
          </li>
        </ul>

        <!-- Closing statement -->
        <p class="mx-auto mt-12 max-w-lg text-xl font-medium text-[#5b4b6e]">
          La ménopause n'est pas une fin. C'est un tournant.
          <br class="hidden sm:block">
          Une opportunité de vous reconnecter à vous-même, en profondeur.
        </p>

        <!-- CTA -->
        <div class="mt-12">
          <UButton
            :to="ctaTo"
            size="xl"
            class="group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-8 py-4 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c47a4a] hover:shadow-lg"
          >
            <span class="flex items-center gap-3">
              Réserver mon appel gratuit avec {{ coachName }}
              <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </UButton>
        </div>
      </div>
    </section>

    <!-- Section: Programmes d'accompagnement -->
    <section
      v-if="publicPrograms.length > 0"
      id="programmes"
      class="bg-white px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <div class="mb-16 text-center">
          <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
            Programmes
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
            Des accompagnements pensés
            <span class="block text-[#5b4b6e]">pour vous</span>
          </h2>
          <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#4a4255]">
            Choisissez le programme adapté à vos besoins et avancez à votre rythme.
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ProgramCard
            v-for="prog in publicPrograms"
            :key="prog.id"
            :program="prog"
            :booking-url="ctaTo"
            :is-authenticated="auth.isAuthenticated()"
            @checkout="handleProgramCheckout"
          />
        </div>
      </div>
    </section>

    <!-- Section: Les 4 Piliers de l'accompagnement -->
    <section
      id="accompagnement"
      class="bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <!-- Section label -->
        <div class="mb-16">
          <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
            L'accompagnement
          </span>
        </div>

        <h2 class="font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
          Sur quels piliers repose
          <span class="block text-[#5b4b6e]">l'accompagnement Auréa ?</span>
        </h2>

        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-[#4a4255]">
          Une approche globale, personnalisée et respectueuse du corps féminin.
          {{ coachName }} vous guide avec douceur à travers 4 axes essentiels.
        </p>

        <!-- 4 Pillars grid -->
        <div class="mt-16 grid gap-8 md:grid-cols-2">
          <article
            v-for="(pillar, index) in pillars"
            :key="pillar.title"
            class="rounded-2xl bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <span class="font-serif text-4xl text-[#d4956a]">{{ String(index + 1).padStart(2, '0') }}</span>
            <h3 class="mt-4 font-serif text-xl text-[#2d2438]">
              {{ pillar.title }}
            </h3>
            <p class="mt-3 text-base leading-relaxed text-[#4a4255]">
              {{ pillar.description }}
            </p>
          </article>
        </div>

        <!-- Emotional support callout -->
        <div class="mt-12 border-l-2 border-[#5b4b6e] pl-8 lg:pl-12">
          <h3 class="font-serif text-xl text-[#2d2438]">
            Un espace d'écoute en plus de tout cela
          </h3>
          <p class="mt-3 max-w-3xl text-base leading-relaxed text-[#4a4255]">
            Chaque accompagnement inclut un soutien psychologique
            non-thérapeutique, basé sur l'écoute, la bienveillance et le respect
            de votre rythme. Un espace sécurisé pour déposer ce que vous vivez,
            clarifier vos ressentis, et traverser cette étape en confiance.
          </p>
          <p class="mt-4 text-sm text-[#857d8c]">
            En cas de besoin, {{ coachName }} vous orientera vers un professionnel de santé compétent.
          </p>
        </div>
      </div>
    </section>

    <!-- Section: Qui suis-je - Coach bio -->
    <section
      id="qui-suis-je"
      class="relative overflow-hidden bg-[#2d2438] px-6 py-32 text-white sm:px-12 lg:px-20"
    >
      <div class="relative mx-auto max-w-7xl">
        <div class="grid gap-16 lg:grid-cols-12 lg:items-center">
          <!-- Left - Photo -->
          <div class="flex justify-center lg:col-span-5">
            <div class="relative">
              <!-- Ghost shape - offset gradient shadow -->
              <div
                class="bio-photo-shape absolute h-[45vh] w-72 translate-x-4 translate-y-4 bg-gradient-to-br from-[#d4956a]/25 to-[#5b4b6e]/15"
                aria-hidden="true"
              />
              <div class="bio-photo-shape relative h-[45vh] w-72 overflow-hidden shadow-2xl shadow-black/20">
                <NuxtImg
                  src="/images/sophie_jouan_2.jpeg"
                  :alt="coachName"
                  class="h-full w-full object-cover object-top"
                  loading="lazy"
                />
                <!-- Subtle warm overlay -->
                <div
                  class="pointer-events-none absolute inset-0"
                  style="background: linear-gradient(160deg, rgba(212, 149, 106, 0.1) 0%, transparent 50%, rgba(91, 75, 110, 0.08) 100%);"
                />
              </div>
              <div
                class="absolute -bottom-6 -right-6 h-24 w-24 rounded-full border border-[#d4956a]/30"
                style="animation: pulse-slow 4s ease-in-out infinite;"
              />
            </div>
          </div>

          <!-- Right - Bio text -->
          <div class="lg:col-span-7">
            <span class="mb-6 inline-block rounded-full border border-[#d4956a]/30 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#d4956a]">
              Qui suis-je
            </span>

            <h2 class="font-serif text-4xl leading-tight text-white">
              Je m'appelle {{ coachName }}
            </h2>
            <p class="mt-4 text-lg text-[#d4956a]">
              Infirmière pendant 20 ans · Spécialiste de l'accompagnement
              en périménopause et ménopause
            </p>

            <!-- Badges localisation + visio -->
            <div class="mt-6 flex flex-wrap gap-3">
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                <UIcon
                  name="lucide:map-pin"
                  size="16"
                  aria-hidden="true"
                />
                Basée à Valognes · Nord Cotentin, Manche (50)
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                <UIcon
                  name="lucide:video"
                  size="16"
                  aria-hidden="true"
                />
                Accompagnements 100% en visio · Toute la France
              </span>
            </div>

            <div class="mt-10 space-y-6 text-base leading-relaxed text-[#b9aac7]">
              <p>
                Infirmière pendant 20 ans, j'ai développé une solide expérience
                de l'accompagnement humain, fondée sur l'écoute, l'empathie
                et la compréhension des besoins de chacun.
              </p>
              <p>
                Comme beaucoup de femmes, j'ai traversé cette période sans trop
                comprendre ce qui m'arrivait. Prise de poids soudaine, insomnies,
                anxiété, chute d'énergie... Et des réponses médicales souvent vagues
                ou inadaptées. C'est en cherchant, en expérimentant, en me formant,
                que j'ai compris ce qui fonctionne vraiment.
              </p>
              <p>
                Cette expérience nourrit aujourd'hui ma façon d'accompagner les femmes
                en périménopause et ménopause, avec attention, respect et bienveillance.
                Ce que je propose, c'est un espace où l'on peut se dire les choses,
                sans jugement. Un moment pour soi, pour comprendre son corps
                et écouter ses besoins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Témoignages - Editorial vertical -->
    <section class="relative bg-white px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-4xl">
        <!-- Section header - centered -->
        <div class="mb-20 text-center">
          <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
            Témoignages
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#2d2438]">
            Leurs mots,
            <span class="text-[#5b4b6e]">leur vérité</span>
          </h2>
        </div>

        <!-- Testimonials - vertical stack with editorial styling -->
        <div class="space-y-16">
          <!-- Testimonial 1 - Featured quote -->
          <article class="relative border-l-2 border-[#d4956a] pl-8 lg:pl-12">
            <span
              class="absolute -left-0 top-0 font-serif text-6xl leading-none text-[#d4956a]"
              aria-hidden="true"
            >"</span>
            <blockquote class="font-serif text-xl leading-relaxed text-[#2d2438] lg:text-2xl">
              Je ne cherchais pas à "guérir" de la ménopause. Je cherchais quelqu'un qui comprenne
              que ce n'était pas une maladie. J'ai trouvé bien plus.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#d4956a]/40" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Marie-Claire</span>, 52 ans
              </cite>
            </footer>
          </article>

          <!-- Divider -->
          <div class="flex items-center justify-center gap-4">
            <div class="h-px w-16 bg-[#d7cfdf]" />
            <div class="size-2 rotate-45 bg-[#d4956a]/30" />
            <div class="h-px w-16 bg-[#d7cfdf]" />
          </div>

          <!-- Testimonial 2 -->
          <article class="relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12">
            <blockquote class="font-serif text-lg leading-relaxed text-[#4a4255] lg:text-xl">
              Les séances m'ont aidée à voir cette période différemment.
              Pas comme une fin, mais comme un passage.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#5b4b6e]/30" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Sophie</span>, 48 ans
              </cite>
            </footer>
          </article>

          <!-- Testimonial 3 -->
          <article class="relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12">
            <blockquote class="font-serif text-lg leading-relaxed text-[#4a4255] lg:text-xl">
              Enfin quelqu'un qui écoute vraiment, sans vouloir tout médicamentaliser.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#5b4b6e]/30" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Anne</span>, 55 ans
              </cite>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <!-- Section: FAQ - Accordion -->
    <section class="bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-3xl">
        <div class="mb-16 text-center">
          <h2 class="font-serif text-3xl leading-tight text-[#2d2438]">
            Questions fréquentes
          </h2>
        </div>

        <UAccordion
          :items="faqItems"
          aria-label="Questions fréquentes"
        >
          <template #content="{ item }">
            <div class="pb-3.5 space-y-3 text-sm text-[#4a4255]">
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

    <!-- Section: CTA Final - Warm invitation -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] px-6 py-32 sm:px-12 lg:px-20">
      <!-- Subtle warm accent -->
      <div
        class="pointer-events-none absolute -right-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full"
        style="background: radial-gradient(circle, rgba(212, 149, 106, 0.15), transparent 60%); filter: blur(80px);"
      />

      <div class="relative mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Prête à écrire
          <span class="block text-[#f0b48f]">un nouveau chapitre ?</span>
        </h2>

        <p class="mx-auto mt-8 max-w-lg text-lg text-[#d7cfdf]">
          Un premier échange de 15 minutes, gratuit et sans engagement,
          pour voir si nous sommes faites pour cheminer ensemble.
        </p>

        <div class="mt-12">
          <UButton
            :to="ctaTo"
            size="xl"
            class="group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[#f0b48f]"
          >
            <span class="flex items-center gap-3">
              Je prends rendez-vous avec {{ coachName }}
              <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </UButton>
        </div>

        <!-- Trust note -->
        <p class="mt-8 text-sm text-[#9685ab]">
          Fuseau horaire : {{ tenant.timezone }}
        </p>
      </div>
    </section>
    <!-- X3.3: Program checkout modal -->
    <ProgramCheckoutModal
      :open="checkoutModalOpen"
      :program="selectedProgram"
      @update:open="checkoutModalOpen = $event"
    />
  </div>
</template>

<style scoped>
.bio-photo-shape {
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
}

@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
}
</style>
