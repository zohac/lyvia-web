<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import { listPublicPrograms } from '~/features/programs/services/public-programs.service'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachHeroProfile from '~/components/organisms/CoachHeroProfile.vue'
import ProgramCard from '~/components/organisms/ProgramCard.vue'
import ProgramCheckoutModal from '~/components/organisms/ProgramCheckoutModal.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()

const auth = useAuth()
const { reveal } = useScrollReveal()

const { data: publicPrograms } = await useAsyncData<PublicProgramListItem[]>('public-programs', async () => {
  try {
    return await listPublicPrograms()
  } catch {
    return []
  }
}, { default: () => [] })

const route = useRoute()
const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre coach')
const currentPath = computed(() => route.fullPath)

// Provider enriched profile data (loaded by useCoachSchemaOrg in parent page)
const { data: coachProfile } = useNuxtData<{
  specialties?: string[]
  displayName?: string
  credentials?: Array<{ title: string, institution?: string, year?: number, verified?: boolean }>
  city?: string | null
  imageUrl?: string | null
  publicPhone?: string | null
  urgencyText?: string | null
  testimonialsJson?: Array<{ quote: string, firstName: string, age?: number, location?: string, rating?: number, result?: string }>
  discoveryDurationMinutes?: number
}>(`public-provider-profile:${props.tenant.slug}`)

// X3.3: Program checkout modal state
const checkoutModalOpen = ref(false)
const selectedProgram = ref<PublicProgramListItem | null>(null)

function handleProgramCheckout(program: PublicProgramListItem) {
  selectedProgram.value = program
  checkoutModalOpen.value = true
}

// --- Content data ---

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

const faqItems: AccordionItem[] = [
  {
    label: 'À quel moment commencer un accompagnement pour la ménopause ?',
    content: 'Même si les premiers signes de la périménopause peuvent sembler anodins, c\'est souvent le bon moment pour commencer un accompagnement. Fatigue persistante, troubles du sommeil, sautes d\'humeur ou prise de poids peuvent indiquer un déséquilibre hormonal. Plus vous agissez tôt, plus vous pouvez traverser cette transition avec sérénité.',
    value: 'faq-1'
  },
  {
    label: `Est-ce que l'accompagnement de ${coachName.value} est médical ?`,
    content: `Non. Il s'agit d'un accompagnement global non médical, centré sur l'équilibre de vie et le bien-être. ${coachName.value} propose des repères concrets en alimentation, gestion du stress, sommeil et mouvement, ainsi qu'un soutien émotionnel personnalisé. En cas de besoin, vous serez orienté(e) vers un professionnel de santé.`,
    value: 'faq-2'
  },
  {
    label: `Combien coûte un accompagnement avec ${coachName.value} ?`,
    content: `L'accompagnement commence par une séance bilan de 1h30 à 100\u00A0€, qui permet de faire le point sur votre situation, vos symptômes et vos objectifs.\n\nLes séances de suivi mensuelles de 45 minutes sont proposées à 80\u00A0€.\n\nUn minimum de 5 séances de suivi est recommandé afin de favoriser un mieux-être durable et des changements ancrés dans le temps.`,
    value: 'faq-3'
  },
  {
    label: 'L\'appel gratuit est-il vraiment sans engagement ?',
    content: `Oui, totalement. L'appel découverte de 15 minutes est gratuit et sans engagement. Il vous permet d'échanger avec ${coachName.value}, de poser vos questions et de voir si l'accompagnement vous correspond.`,
    value: 'faq-4'
  },
  {
    label: 'Est-ce adapté si je suis déjà ménopausée depuis plusieurs années ?',
    content: 'Oui. Même plusieurs années après la ménopause, il est possible de retrouver énergie, confort et équilibre. L\'accompagnement s\'adapte à votre parcours, quel que soit votre stade.',
    value: 'faq-5'
  },
  {
    label: 'Les accompagnements se font-ils en présentiel ou en visio ?',
    content: `Tous les accompagnements se déroulent en visio. Basée à Valognes, près de Cherbourg, dans le Nord Cotentin (Manche, 50), ${coachName.value} accompagne des femmes partout en France. Pas besoin de vous déplacer.`,
    value: 'faq-6'
  }
]

// FAQ SSR: all items open on server, closed after hydration (AC-5)
const allFaqValues = faqItems.map(item => item.value).filter((v): v is string => !!v)
const faqDefaultValue = ref<string[]>(allFaqValues)

onMounted(() => {
  // Close all FAQ items after hydration — UX preserved, content was crawlable in SSR
  faqDefaultValue.value = []
})

// Hero props (typed, pattern P-Y2)
const heroProps = computed(() => ({
  displayName: coachName.value,
  seoTitle: null as string | null, // Populated by usePublicSeo in parent page
  credentials: coachProfile.value?.credentials ?? [],
  city: coachProfile.value?.city ?? null,
  profilePhotoUrl: coachProfile.value?.imageUrl ?? null,
  profilePhotoAlt: coachProfile.value?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  discoveryDurationMinutes: coachProfile.value?.discoveryDurationMinutes ?? 15,
  urgencyText: coachProfile.value?.urgencyText ?? null,
  ctaTo: props.ctaTo
}))
</script>

<template>
  <div class="min-h-screen">
    <!-- ==================== 1. HERO (AC-2) ==================== -->
    <CoachHeroProfile v-bind="heroProps" />

    <!-- ==================== 2. BLOC PROBLÈME (inchangé) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#d4956a]/30 to-transparent" />
      <div class="mx-auto max-w-5xl">
        <blockquote class="relative">
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
            — et de vous offrir le soutien que vous méritez.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 3. MINI-TÉMOIGNAGE (preuve sociale précoce) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-white px-6 py-16 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl text-center">
        <blockquote class="font-serif text-xl italic leading-relaxed text-[#4a4255] lg:text-2xl">
          « Je ne cherchais pas à "guérir" de la ménopause. Je cherchais quelqu'un qui comprenne
          que ce n'était pas une maladie. J'ai trouvé bien plus. »
        </blockquote>
        <!-- TODO: Feature V — dynamiser depuis testimonialsJson -->
        <footer class="mt-6 text-sm text-[#857d8c]">
          <span class="font-medium text-[#2d2438]">Marie-Claire</span>, 52 ans
        </footer>
      </div>
    </section>

    <!-- ==================== 4. [placeholder Y.3] CE QUE L'ACCOMPAGNEMENT APPORTE ==================== -->
    <!-- Y.3: CoachTransformationBenefits — section "Ce que cet accompagnement peut vous apporter" -->

    <!-- ==================== 5. [placeholder Y.3] COMMENT ÇA MARCHE ==================== -->
    <!-- Y.3: CoachHowItWorks — section en 3-4 étapes visuelles -->

    <!-- ==================== 6. PILIERS — H2 SEO (AC-4) ==================== -->
    <section
      id="accompagnement"
      v-bind="reveal()"
      class="scroll-reveal bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
          L'accompagnement
        </span>

        <!-- H2 with SEO keyword (AC-4, P-Y5) -->
        <h2 class="mt-6 font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
          Les 4 piliers de
          <span class="block text-[#5b4b6e]">l'accompagnement ménopause</span>
        </h2>

        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-[#4a4255]">
          Une approche globale, personnalisée et respectueuse du corps féminin.
          {{ coachName }} vous guide avec douceur à travers 4 axes essentiels.
        </p>

        <div class="mt-16 grid gap-8 md:grid-cols-2">
          <article
            v-for="(pillar, index) in pillars"
            :key="pillar.title"
            v-bind="reveal({ delay: index * 120 })"
            class="scroll-reveal rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
        <div
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal mt-12 border-l-2 border-[#5b4b6e] pl-8 lg:pl-12"
        >
          <h3 class="font-serif text-xl text-[#2d2438]">
            Un espace d'écoute en plus de tout cela
          </h3>
          <p class="mt-3 max-w-3xl text-base leading-relaxed text-[#4a4255]">
            Chaque accompagnement inclut un soutien basé sur l'écoute, la bienveillance et le respect
            de votre rythme. Un espace sécurisé pour déposer ce que vous vivez.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 7. [placeholder Y.3] TARIFS & PROGRAMMES ==================== -->
    <!-- Y.3: CoachPricing — section tarifs transparents -->

    <!-- Programmes existants (Feature X2) -->
    <section
      v-if="publicPrograms.length > 0"
      id="programmes"
      v-bind="reveal()"
      class="scroll-reveal bg-white px-6 py-32 sm:px-12 lg:px-20"
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
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ProgramCard
            v-for="prog in publicPrograms"
            :key="prog.id"
            :program="prog"
            :booking-url="ctaTo"
            :is-authenticated="auth.isAuthenticated()"
            :current-path="currentPath"
            @checkout="handleProgramCheckout"
          />
        </div>
      </div>
    </section>

    <!-- ==================== 8. À PROPOS — H2 SEO (AC-4) ==================== -->
    <section
      id="qui-suis-je"
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-[#2d2438] px-6 py-32 text-white sm:px-12 lg:px-20"
    >
      <div class="relative mx-auto max-w-7xl">
        <div class="grid gap-16 lg:grid-cols-12 lg:items-center">
          <!-- Photo -->
          <div class="flex justify-center lg:col-span-5">
            <div class="relative">
              <div
                class="bio-photo-shape absolute h-[45vh] w-72 translate-x-4 translate-y-4 bg-gradient-to-br from-[#d4956a]/25 to-[#5b4b6e]/15"
                aria-hidden="true"
              />
              <div class="bio-photo-shape relative h-[45vh] w-72 overflow-hidden shadow-2xl shadow-black/20">
                <NuxtImg
                  v-if="coachProfile?.imageUrl"
                  :src="coachProfile.imageUrl"
                  :alt="coachName"
                  class="h-full w-full object-cover object-top"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e]"
                >
                  <span class="font-serif text-6xl font-bold text-white/40">{{ coachName.charAt(0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="lg:col-span-7">
            <span class="mb-6 inline-block rounded-full border border-[#d4956a]/30 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#d4956a]">
              Qui suis-je
            </span>

            <!-- H2 with SEO keyword (AC-4, P-Y5) -->
            <h2 class="font-serif text-4xl leading-tight text-white">
              Votre spécialiste ménopause — {{ coachName }}
            </h2>

            <!-- Credentials subtitle (dynamic from profile) -->
            <p
              v-if="coachProfile?.credentials?.length || coachProfile?.city"
              class="mt-4 text-lg text-[#d4956a]"
            >
              <template v-if="coachProfile?.credentials?.length">
                {{ coachProfile.credentials[0]?.title }}
              </template>
              <template v-if="coachProfile?.credentials?.length && coachProfile?.city">
                ·
              </template>
              <template v-if="coachProfile?.city">
                {{ coachProfile.city }}
              </template>
            </p>

            <!-- Badges localisation + visio -->
            <div
              v-if="coachProfile?.city"
              class="mt-6 flex flex-wrap gap-3"
            >
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-4"
                />
                {{ coachProfile.city }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                <UIcon
                  name="i-lucide-video"
                  class="size-4"
                />
                Accompagnements 100% en visio
              </span>
            </div>

            <div class="mt-10 space-y-6 text-base leading-relaxed text-[#b9aac7]">
              <!-- TODO: Feature V — dynamiser depuis long_bio -->
              <!-- TODO: Feature V — dynamiser depuis long_bio -->
              <p>Un accompagnement humain et bienveillant pour traverser la ménopause avec sérénité.</p>
            </div>

            <!-- Phone (FR-Y16, v-if graceful degradation) -->
            <a
              v-if="coachProfile?.publicPhone"
              :href="`tel:${coachProfile.publicPhone}`"
              class="mt-6 inline-flex items-center gap-2 text-[#d4956a] hover:underline"
            >
              <UIcon
                name="i-lucide-phone"
                class="size-4"
              />
              {{ coachProfile.publicPhone }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 9. [placeholder Y.3] TÉMOIGNAGES COMPLETS ==================== -->
    <!-- Y.3: CoachTestimonials — temoignages enrichis depuis testimonialsJson -->

    <!-- Témoignages existants (hardcodés V1) -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative bg-white px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-4xl">
        <div class="mb-20 text-center">
          <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
            Témoignages
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#2d2438]">
            Témoignages de femmes
            <span class="text-[#5b4b6e]">accompagnées</span>
          </h2>
        </div>

        <!-- TODO: Feature V — dynamiser depuis testimonialsJson -->
        <div class="space-y-16">
          <article
            v-bind="reveal({ delay: 100 })"
            class="scroll-reveal relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12"
          >
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

          <article
            v-bind="reveal({ delay: 200 })"
            class="scroll-reveal relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12"
          >
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

    <!-- ==================== 10. FAQ — VISIBLE SSR (AC-5, AC-4 H2 SEO) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <div class="mb-16 text-center">
          <h2 class="font-serif text-3xl leading-tight text-[#2d2438]">
            Questions fréquentes sur l'accompagnement ménopause
          </h2>
        </div>

        <!-- UAccordion: default-value includes all items for SSR crawlability (AC-5) -->
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

    <!-- ==================== 11. CTA FINAL — H2 SEO (AC-4) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div
        class="pointer-events-none absolute -right-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full"
        style="background: radial-gradient(circle, rgba(212,149,106,0.15), transparent 60%); filter: blur(80px);"
      />

      <div class="relative mx-auto max-w-3xl text-center">
        <!-- H2 with SEO keyword (AC-4, P-Y5) -->
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Réservez votre
          <span class="block text-[#f0b48f]">séance découverte gratuite</span>
        </h2>

        <p class="mx-auto mt-8 max-w-lg text-lg text-[#d7cfdf]">
          Un premier échange de {{ coachProfile?.discoveryDurationMinutes ?? 15 }} minutes, gratuit et sans engagement,
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

        <p class="mt-8 text-sm text-[#9685ab]">
          Fuseau horaire : {{ tenant.timezone }}
        </p>
      </div>
    </section>

    <!-- ==================== 12. DISCLAIMER MÉDICAL ==================== -->
    <AtomsMedicalDisclaimer />

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

/* Scroll reveal base */
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

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
