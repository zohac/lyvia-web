<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ListConsultationPricePlansResponse } from '~/features/consultation/api/consultation.contract'
import { listPublicPrograms } from '~/features/programs/services/public-programs.service'
import { listConsultationPricePlans } from '~/features/consultation/services/client-consultation.service'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachHeroProfile from '~/components/organisms/CoachHeroProfile.vue'
import CoachTransformationBenefits from '~/components/organisms/CoachTransformationBenefits.vue'
import CoachHowItWorks from '~/components/organisms/CoachHowItWorks.vue'
import CoachPricing from '~/components/organisms/CoachPricing.vue'
import CoachTestimonials from '~/components/organisms/CoachTestimonials.vue'
import CoachEducationalContent from '~/components/organisms/CoachEducationalContent.vue'
import CoachInlineCta from '~/components/atoms/CoachInlineCta.vue'
import CoachLeadCapture from '~/components/organisms/CoachLeadCapture.vue'
import CoachAnnouncementBar from '~/components/atoms/CoachAnnouncementBar.vue'
import StickyCtaMobile from '~/components/molecules/StickyCtaMobile.vue'
import { useExitIntent } from '~/composables/useExitIntent'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()

const { reveal } = useScrollReveal()
const route = useRoute()
const { isAuthenticated: checkAuth } = useAuth()
const isAuthenticated = computed(() => checkAuth())
const currentPath = computed(() => route.fullPath)

const { data: publicPrograms } = await useAsyncData<PublicProgramListItem[]>(
  `public-programs:${props.tenant.slug}`,
  async () => {
    try {
      return await listPublicPrograms(props.tenant.slug)
    } catch {
      return []
    }
  },
  { default: () => [] }
)

const { data: pricingData } = await useAsyncData<ListConsultationPricePlansResponse | null>(
  `pricing-${props.tenant.providerId}`,
  async () => {
    try {
      return await listConsultationPricePlans(props.tenant.providerId)
    } catch {
      return null
    }
  },
  { default: () => null }
)

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre coach')

// Provider enriched profile data (loaded by useCoachSchemaOrg in parent page)
const { data: coachProfile } = useNuxtData<{
  specialties?: string[]
  displayName?: string
  credentials?: Array<{ title: string, institution?: string, year?: number, verified?: boolean }>
  bio?: string | null
  longBio?: string | null
  city?: string | null
  imageUrl?: string | null
  heroImageUrl?: string | null
  secondaryPhotoUrl?: string | null
  publicPhone?: string | null
  urgencyText?: string | null
  heroHeadline?: string | null
  socialLinks?: { linkedin?: string, instagram?: string, facebook?: string, website?: string }
  region?: string | null
  testimonialsJson?: Array<{ quote: string, firstName: string, age?: number, location?: string, rating?: number, result?: string }>
  discoveryDurationMinutes?: number
  leadMagnetUrl?: string | null
  leadMagnetTitle?: string | null
}>(`public-provider-profile:${props.tenant.slug}`)

// --- Content data ---

// <!-- TODO: Feature V — dynamiser -->
const pillars = [
  {
    title: 'Alimentation bienveillante',
    description: 'Des repères simples pour soutenir votre métabolisme et vos hormones. Pas de régime, pas de privation. Une alimentation anti-inflammatoire adaptée à votre quotidien, votre budget et vos goûts.',
    icon: 'i-lucide-apple'
  },
  {
    title: 'Gestion du stress',
    description: 'Des outils accessibles pour calmer votre système nerveux\u00A0: techniques de respiration, routines apaisantes, gestion des émotions. Parce que le stress amplifie tous les autres symptômes de la ménopause.',
    icon: 'i-lucide-wind'
  },
  {
    title: 'Sommeil réparateur',
    description: 'Des stratégies naturelles pour retrouver des nuits paisibles\u00A0: rituel du soir, gestion des réveils nocturnes, environnement de sommeil. Le sommeil est souvent le premier résultat visible, en quelques semaines.',
    icon: 'i-lucide-moon-star'
  },
  {
    title: 'Mouvement adapté',
    description: 'Bouger en douceur, selon votre énergie du jour\u00A0: marche, yoga, pilates, renforcement doux. Pas de performance, pas de comparaison. Des mouvements qui font du bien à votre corps sans l\'épuiser davantage.',
    icon: 'i-lucide-heart-pulse'
  }
]

// <!-- TODO: Feature V — dynamiser -->
const faqItems: AccordionItem[] = [
  {
    label: `Combien coûte un accompagnement avec ${coachName.value}\u00A0?`,
    content: `L'appel découverte de 15 minutes est gratuit et sans engagement. Les séances individuelles sont à 85\u00A0€. Le programme 6 mois est à 840\u00A0€ (ou 140\u00A0€/mois en 6 fois). C'est souvent moins que ce que les femmes dépensent en compléments alimentaires et consultations diverses sur la même période. Sauf qu'ici, les résultats durent.`,
    value: 'faq-1'
  },
  {
    label: `L'accompagnement de ${coachName.value} est-il médical\u00A0?`,
    content: `Non. C'est un accompagnement en bien-être, pas un acte médical. ${coachName.value} est infirmière de formation et accompagne sur 4 axes\u00A0: alimentation, gestion du stress, sommeil et mouvement. Son approche complète le suivi médical, elle ne le remplace pas. En cas de besoin, elle vous oriente vers un professionnel de santé.`,
    value: 'faq-2'
  },
  {
    label: 'Est-ce adapté si je suis déjà ménopausée depuis plusieurs années\u00A0?',
    content: `Oui. L'accompagnement s'adapte à chaque étape\u00A0: périménopause, ménopause récente ou installée. Les 4 piliers (alimentation, stress, sommeil, mouvement) sont pertinents quel que soit le stade. L'appel découverte gratuit permet justement de voir ensemble ce qui serait le plus utile pour vous.`,
    value: 'faq-3'
  },
  {
    label: 'Les accompagnements se font-ils en présentiel ou en visio\u00A0?',
    content: `Tout se fait en visio (appel vidéo). Vous êtes chez vous, au calme, sans déplacement. Ça fonctionne partout en France. L'appel découverte de 15 minutes vous permettra de voir si le format vous convient.`,
    value: 'faq-4'
  },
  {
    label: 'L\'appel gratuit est-il vraiment sans engagement\u00A0?',
    content: `Oui, totalement. Pas de carte bancaire, pas de vente forcée. C'est un échange de 15 minutes pour faire connaissance. Vous repartez avec de premières pistes, même si vous décidez de ne pas poursuivre.`,
    value: 'faq-5'
  },
  {
    label: 'À quel moment commencer un accompagnement pour la ménopause\u00A0?',
    content: 'Le plus tôt possible. Plus on comprend ce qui se passe dans son corps, plus on peut agir efficacement. Mais il n\'est jamais trop tard. Les femmes qui me rejoignent après plusieurs années de symptômes voient aussi des améliorations significatives.',
    value: 'faq-6'
  },
  {
    label: 'Quels sont les symptômes de la périménopause\u00A0?',
    content: 'La périménopause peut provoquer des règles irrégulières, des bouffées de chaleur, des troubles du sommeil, de la fatigue, une prise de poids, de l\'anxiété, de l\'irritabilité, des douleurs articulaires et un brouillard mental. Ces symptômes apparaissent généralement entre 45 et 50 ans, parfois plus tôt. L\'accompagnement ménopause aide à les identifier et à les gérer au quotidien.',
    value: 'faq-7'
  },
  {
    label: 'Peut-on soulager les bouffées de chaleur sans traitement hormonal\u00A0?',
    content: 'Oui. Des ajustements en alimentation, gestion du stress, qualité du sommeil et activité physique adaptée permettent de réduire significativement les bouffées de chaleur. C\'est l\'approche que je propose dans mon accompagnement ménopause, sans hormones, sans médicaments. Les résultats sont souvent visibles dès les premières semaines.',
    value: 'faq-8'
  },
  {
    label: 'Combien de temps dure la ménopause\u00A0?',
    content: 'La périménopause (la transition) dure en moyenne 4 à 8 ans. La ménopause est confirmée après 12 mois consécutifs sans règles. Les symptômes peuvent persister plusieurs années après, mais un accompagnement adapté aide à les gérer efficacement quel que soit le stade.',
    value: 'faq-9'
  }
]

// FAQ SSR: all items open on server, closed after hydration (AC-5)
const allFaqValues = faqItems.map(item => item.value).filter((v): v is string => !!v)
const faqDefaultValue = ref<string[]>(allFaqValues)

onMounted(() => {
  // Close all FAQ items after hydration — UX preserved, content was crawlable in SSR
  faqDefaultValue.value = []
})

// <!-- TODO: Feature V — dynamiser depuis testimonialsJson -->
const fallbackTestimonials = [
  {
    quote: 'Après 6 mois avec Sophie, je dors enfin 7 heures par nuit. J\'ai retrouvé mon énergie, perdu les 4 kilos qui m\'obsédaient, et surtout, j\'ai compris mon corps. Ce qui a fait la différence\u00A0? L\'approche globale\u00A0: alimentation, sommeil, stress, tout en même temps. Et le fait de pouvoir lui écrire entre les séances quand j\'avais un doute.',
    firstName: 'Anne M.',
    age: 55,
    location: 'Nantes',
    rating: 5,
    result: '6 mois d\'accompagnement'
  },
  {
    quote: 'Je ne cherchais pas à « guérir » de la ménopause. Je cherchais quelqu\'un qui comprenne que ce n\'était pas une maladie. J\'ai trouvé bien plus. Pour la première fois, quelqu\'un m\'a dit\u00A0: « Ce que vous vivez est réel. » Ça a tout changé.',
    firstName: 'Françoise L.',
    age: 52,
    location: 'Bordeaux',
    rating: 5,
    result: '4 mois d\'accompagnement'
  },
  {
    quote: 'J\'avais déjà vu une naturopathe et dépensé des centaines d\'euros en compléments. Rien ne tenait dans la durée. Avec Sophie, j\'ai eu un plan concret, un suivi régulier, et des résultats dès le premier mois. Le sommeil d\'abord, puis l\'énergie. Je recommande sans hésiter.',
    firstName: 'Valérie D.',
    age: 49,
    location: 'Lyon',
    rating: 5,
    result: '3 mois d\'accompagnement'
  }
]

// Pricing & testimonials visibility (pattern AD-Y2: v-if at parent level)
const consultationPlans = computed(() => pricingData.value?.plans ?? [])
const apiTestimonials = computed(() => coachProfile.value?.testimonialsJson ?? [])
const displayTestimonials = computed(() => apiTestimonials.value.length > 0 ? apiTestimonials.value : fallbackTestimonials)
const hasTestimonials = computed(() => displayTestimonials.value.length > 0)
const hasPricing = computed(() => consultationPlans.value.length > 0 || publicPrograms.value.length > 0)
const discoveryDuration = computed(() => coachProfile.value?.discoveryDurationMinutes ?? 15)

// Lead magnet (Y2.6)
const leadMagnetUrl = computed(() => coachProfile.value?.leadMagnetUrl ?? null)
const leadMagnetTitle = computed(() => coachProfile.value?.leadMagnetTitle ?? 'Guide gratuit')
const hasLeadMagnet = computed(() => !!leadMagnetUrl.value)

// Exit intent popup (Y2.6 AC-6) — desktop only
const showExitPopup = ref(false)
useExitIntent({
  onTrigger: () => {
    if (!hasLeadMagnet.value) return
    // Don't show if already downloaded
    if (import.meta.client && sessionStorage.getItem(`lead_magnet_downloaded_${props.tenant.slug}`)) return
    showExitPopup.value = true
  },
  storageKey: `lead_magnet_popup_shown_${props.tenant.slug}`
})

function closePopupAndScroll() {
  showExitPopup.value = false
  nextTick(() => {
    document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })
  })
}

// Hero props (typed, pattern P-Y2)
const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: coachProfile.value?.heroHeadline ?? null,
  credentials: coachProfile.value?.credentials ?? [],
  city: coachProfile.value?.city ?? null,
  profilePhotoUrl: coachProfile.value?.imageUrl ?? null,
  heroPhotoUrl: coachProfile.value?.heroImageUrl ?? null,
  profilePhotoAlt: coachProfile.value?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  discoveryDurationMinutes: coachProfile.value?.discoveryDurationMinutes ?? 15,
  urgencyText: coachProfile.value?.urgencyText ?? null,
  ctaTo: props.ctaTo
}))
</script>

<template>
  <div class="min-h-screen">
    <!-- ==================== 0. ANNOUNCEMENT BAR (lead magnet) ==================== -->
    <CoachAnnouncementBar
      v-if="hasLeadMagnet"
      :slug="tenant.slug"
      :lead-magnet-title="leadMagnetTitle"
    />

    <!-- ==================== 1. HERO (beige) ==================== -->
    <CoachHeroProfile v-bind="heroProps" />

    <!-- ==================== 2. BLOC PROBLÈME (blanc) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-white px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#d4956a]/30 to-transparent" />
      <div class="mx-auto max-w-5xl">
        <blockquote class="relative">
          <span
            class="absolute -left-4 -top-8 font-serif text-[12rem] leading-none text-[#d4956a]/10 lg:-left-16"
            aria-hidden="true"
          >"</span>
          <!-- TODO: Feature V — dynamiser -->
          <p class="relative font-serif text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] text-[#2d2438]">
            Je ne comprends pas ce qu'il m'arrive... J'ai 48 ans, j'ai pris
            6 kilos en 6 mois, je suis toujours épuisée, stressée pour un rien.
            J'ai des insomnies, des douleurs articulaires... J'ai l'impression
            d'avoir pris 20 ans en quelques mois. Et mon médecin me dit
            que tout est normal.
          </p>
        </blockquote>

        <div class="mt-12 space-y-6">
          <p class="text-lg leading-relaxed text-[#4a4255]">
            Vous vous reconnaissez dans ces mots ?
          </p>
          <p class="text-lg leading-relaxed text-[#4a4255]">
            Épuisement. Prise de poids. Troubles du sommeil. Anxiété.
            Bouffées de chaleur. Irritabilité. Douleurs articulaires.
          </p>
          <p class="text-lg font-semibold text-[#2d2438]">
            Ces symptômes ne sont pas « dans votre tête ».
          </p>
          <p class="text-lg leading-relaxed text-[#4a4255]">
            Ils sont réels, ils ont une cause. Et il existe des solutions concrètes.
          </p>
          <p class="text-lg font-medium italic text-[#5b4b6e]">
            Il est temps de comprendre ce que traverse votre corps.
            Et de vous offrir l'accompagnement que vous méritez.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 3. MINI-TÉMOIGNAGE (beige) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-[#f5f0eb] px-6 py-20 sm:px-12 lg:px-20"
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

    <!-- ==================== 4. CE QUE L'ACCOMPAGNEMENT APPORTE (blanc) ==================== -->
    <div id="accompagnement">
      <CoachTransformationBenefits>
        <template #header>
          <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
            Ce que cela apporte
          </span>
          <h2 class="mt-6 font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
            Accompagnement ménopause
            <span class="block text-[#5b4b6e]">personnalisé</span>
          </h2>
        </template>
      </CoachTransformationBenefits>
    </div>

    <!-- Mini-CTA after Benefits -->
    <CoachInlineCta
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 5. À PROPOS (dark) ==================== -->
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
                  v-if="coachProfile?.secondaryPhotoUrl || coachProfile?.imageUrl"
                  :src="(coachProfile?.secondaryPhotoUrl ?? coachProfile?.imageUrl)!"
                  :alt="`${coachName}, spécialiste accompagnement ménopause`"
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

            <!-- H2 with SEO keyword (P-Y5) -->
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

            <!-- Badges V3: credentials + specialite + localisation + visio -->
            <div class="mt-6 flex flex-wrap gap-3">
              <span
                v-if="coachProfile?.credentials?.length"
                class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]"
              >
                {{ coachProfile.credentials[0]?.title }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                Accompagnement en périménopause et ménopause
              </span>
              <span
                v-if="coachProfile?.city"
                class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]"
              >
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-4"
                />
                {{ coachProfile.city }}{{ coachProfile?.region ? ` · ${coachProfile.region}` : '' }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/10 px-4 py-1.5 text-sm text-[#f0b48f]">
                <UIcon
                  name="i-lucide-video"
                  class="size-4"
                />
                100% en visio · Toute la France
              </span>
            </div>

            <div class="mt-10 space-y-6 text-base leading-relaxed text-[#b9aac7]">
              <!-- Priority: longBio (markdown-like paragraphs) → bio (short) → fallback -->
              <template v-if="coachProfile?.longBio">
                <p
                  v-for="(paragraph, i) in coachProfile.longBio.split('\n\n').filter(Boolean)"
                  :key="i"
                >
                  {{ paragraph }}
                </p>
              </template>
              <template v-else-if="coachProfile?.bio">
                <p>{{ coachProfile.bio }}</p>
              </template>
              <!-- TODO: Feature V — dynamiser -->
              <template v-else>
                <p>
                  Pendant 20 ans, j'ai accompagné des patients en milieu hospitalier.
                  L'écoute, l'empathie, la rigueur clinique — c'est mon métier, pas un diplôme de week-end.
                </p>
                <p>Et puis la périménopause m'est tombée dessus.</p>
                <p>
                  Prise de poids soudaine. Insomnies. Anxiété. Chute d'énergie.
                  Et des réponses médicales souvent vagues : « C'est le stress », « C'est l'âge ».
                </p>
                <p>Je ne me reconnaissais plus.</p>
                <p>
                  Alors j'ai cherché. J'ai testé. Je me suis formée.
                  J'ai compris ce qui fonctionne vraiment. Pas les modes, pas les compléments miracles.
                  Des ajustements concrets en alimentation, en gestion du stress, en sommeil, en mouvement.
                </p>
                <p>
                  Aujourd'hui, c'est ce que je propose aux femmes qui traversent la même chose :
                  un accompagnement global, humain, sans jugement.
                </p>
                <p>
                  Ce que je fais, c'est simple : je vous écoute, je vous explique,
                  et je vous donne les outils pour reprendre le contrôle de votre corps.
                  Et entre les séances, je reste disponible par email — vous n'êtes jamais seule.
                </p>
              </template>
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

            <!-- Social links (AC-8) -->
            <div
              v-if="coachProfile?.socialLinks && (coachProfile.socialLinks.linkedin || coachProfile.socialLinks.instagram || coachProfile.socialLinks.facebook || coachProfile.socialLinks.website)"
              class="mt-6 flex gap-4"
            >
              <a
                v-if="coachProfile.socialLinks.linkedin"
                :href="coachProfile.socialLinks.linkedin"
                target="_blank"
                rel="noopener"
                class="grid size-10 place-items-center rounded-full border border-[#d4956a]/30 text-[#d4956a] transition-colors hover:bg-[#d4956a]/10"
                aria-label="LinkedIn"
              >
                <UIcon
                  name="i-simple-icons-linkedin"
                  class="size-5"
                />
              </a>
              <a
                v-if="coachProfile.socialLinks.instagram"
                :href="coachProfile.socialLinks.instagram"
                target="_blank"
                rel="noopener"
                class="grid size-10 place-items-center rounded-full border border-[#d4956a]/30 text-[#d4956a] transition-colors hover:bg-[#d4956a]/10"
                aria-label="Instagram"
              >
                <UIcon
                  name="i-simple-icons-instagram"
                  class="size-5"
                />
              </a>
              <a
                v-if="coachProfile.socialLinks.facebook"
                :href="coachProfile.socialLinks.facebook"
                target="_blank"
                rel="noopener"
                class="grid size-10 place-items-center rounded-full border border-[#d4956a]/30 text-[#d4956a] transition-colors hover:bg-[#d4956a]/10"
                aria-label="Facebook"
              >
                <UIcon
                  name="i-simple-icons-facebook"
                  class="size-5"
                />
              </a>
              <a
                v-if="coachProfile.socialLinks.website"
                :href="coachProfile.socialLinks.website"
                target="_blank"
                rel="noopener"
                class="grid size-10 place-items-center rounded-full border border-[#d4956a]/30 text-[#d4956a] transition-colors hover:bg-[#d4956a]/10"
                aria-label="Site web"
              >
                <UIcon
                  name="i-lucide-globe"
                  class="size-5"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 6. TÉMOIGNAGES (beige) ==================== -->
    <!-- Anchor wrapper always present so #temoignages nav link resolves (CR-2 fix) -->
    <div id="temoignages">
      <CoachTestimonials
        v-if="hasTestimonials"
        :testimonials="displayTestimonials"
      >
        <template #header>
          <div class="mb-12 text-center">
            <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
              Témoignages
            </span>
            <h2 class="font-serif text-4xl leading-tight text-[#2d2438]">
              Leurs mots,
              <span class="text-[#5b4b6e]">leur vérité</span>
            </h2>
          </div>
        </template>
      </CoachTestimonials>
    </div>

    <!-- Mini-CTA after Témoignages -->
    <CoachInlineCta
      v-if="hasTestimonials"
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 7. PILIERS (blanc) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-white px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
          L'accompagnement
        </span>

        <!-- H2 with SEO keyword (P-Y5) -->
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
            class="pillar-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8 transition-all duration-300"
          >
            <!-- Glow blob top-right (appears on hover, like B2B feature-card) -->
            <div
              class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
              aria-hidden="true"
            />

            <div class="relative flex items-start gap-5">
              <!-- Icon with color change on hover (B2B pattern) -->
              <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                <UIcon
                  :name="pillar.icon"
                  class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                />
              </div>

              <div>
                <span class="font-serif text-sm text-[#d4956a]/60">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <h3 class="mt-1 font-serif text-xl text-[#2d2438]">
                  {{ pillar.title }}
                </h3>
                <p class="mt-3 text-base leading-relaxed text-[#4a4255]">
                  {{ pillar.description }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <!-- Emotional support callout (5th pillar — distinct treatment) -->
        <div
          v-bind="reveal({ delay: 500 })"
          class="pillar-card scroll-reveal group relative mt-8 overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8 transition-all duration-300"
        >
          <div
            class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
            aria-hidden="true"
          />
          <div class="relative flex items-start gap-5">
            <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
              <UIcon
                name="i-lucide-hand-heart"
                class="size-6 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
              />
            </div>
            <div>
              <span class="font-serif text-sm text-[#d4956a]/60">
                05
              </span>
              <h3 class="mt-1 font-serif text-xl text-[#2d2438]">
                Un espace d'écoute en plus de tout cela
              </h3>
              <!-- TODO: Feature V — dynamiser -->
              <p class="mt-3 max-w-3xl text-base leading-relaxed text-[#4a4255]">
                Chaque accompagnement inclut un espace d'écoute bienveillant, à votre rythme.
                Ce n'est pas un suivi psychologique. C'est un moment pour déposer ce que vous vivez,
                sans jugement. En cas de besoin, je vous oriente vers un professionnel de santé.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 8. COMMENT ÇA MARCHE (beige) ==================== -->
    <CoachHowItWorks
      :discovery-duration-minutes="discoveryDuration"
      :provider-first-name="coachProfile?.displayName?.split(' ')[0] ?? coachName"
    >
      <template #header>
        <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
          Le parcours
        </span>
        <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
          Comment se déroule la séance
          <span class="block text-[#5b4b6e]">découverte ménopause</span>
        </h2>
      </template>
    </CoachHowItWorks>

    <!-- ==================== 9. TARIFS & PROGRAMMES (blanc) ==================== -->
    <!-- Anchor wrapper always present so #tarifs nav link resolves (CR-2 fix) -->
    <div id="tarifs">
      <CoachPricing
        v-if="hasPricing"
        :plans="consultationPlans"
        :programs="publicPrograms"
        :discovery-duration-minutes="discoveryDuration"
        :cta-to="ctaTo"
        :is-authenticated="isAuthenticated"
        :current-path="currentPath"
      >
        <template #header>
          <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
            Tarifs
          </span>
          <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
            Tarifs des séances
            <span class="block text-[#5b4b6e]">accompagnement ménopause</span>
          </h2>
        </template>
      </CoachPricing>
    </div>

    <!-- Mini-CTA after Tarifs -->
    <CoachInlineCta
      v-if="hasPricing"
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 10. CONTENU ÉDUCATIF (beige) ==================== -->
    <CoachEducationalContent>
      <template #header>
        <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
          Comprendre
        </span>
        <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
          Comprendre la ménopause
          <span class="block text-[#5b4b6e]">et la périménopause</span>
        </h2>
      </template>
    </CoachEducationalContent>

    <!-- ==================== 10b. LEAD CAPTURE (beige gradient) ==================== -->
    <CoachLeadCapture
      v-if="hasLeadMagnet"
      :slug="tenant.slug"
      :lead-magnet-url="leadMagnetUrl!"
      :lead-magnet-title="leadMagnetTitle"
    />

    <!-- ==================== 11. FAQ (blanc) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-white px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <div class="mb-16 text-center">
          <h2 class="font-serif text-3xl leading-tight text-[#2d2438]">
            Questions fréquentes sur l'accompagnement ménopause
          </h2>
        </div>

        <!-- UAccordion: default-value includes all items for SSR crawlability -->
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

    <!-- ==================== 12. CTA FINAL (gradient) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div
        class="pointer-events-none absolute -right-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full"
        style="background: radial-gradient(circle, rgba(212,149,106,0.15), transparent 60%); filter: blur(80px);"
      />

      <div class="relative mx-auto max-w-3xl text-center">
        <!-- H2 with SEO keyword (P-Y5) -->
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
            data-final-cta
            class="group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[#f0b48f]"
          >
            <!-- CTA final wording intentionnellement différent du hero (M8):
                 Hero = action directe ("Réserver mon appel gratuit")
                 Final = personnalisé après lecture complète ("Je prends RDV avec {name}") -->
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

    <!-- ==================== 13. DISCLAIMER MÉDICAL ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- Spacer for mobile sticky CTA -->
    <div class="h-16 md:hidden" />

    <!-- Sticky CTA mobile (AC-4: visible when hero CTA scrolls out) -->
    <StickyCtaMobile
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />

    <!-- ==================== EXIT INTENT MODAL (Y2.6 AC-6) ==================== -->
    <UModal
      v-if="hasLeadMagnet"
      v-model:open="showExitPopup"
    >
      <template #content>
        <div class="relative p-8 text-center">
          <button
            class="absolute right-4 top-4 rounded p-1 text-[#857d8c] transition-colors hover:text-[#2d2438]"
            aria-label="Fermer"
            @click="showExitPopup = false"
          >
            <UIcon
              name="i-lucide-x"
              class="size-5"
            />
          </button>

          <h3 class="font-serif text-2xl text-[#2d2438]">
            Avant de partir...
          </h3>
          <p class="mt-3 text-[#4a4255]">
            Téléchargez gratuitement : {{ leadMagnetTitle }}
          </p>

          <p class="mt-2 text-sm text-[#857d8c]">
            Laissez votre email pour recevoir le guide
          </p>

          <!-- Scroll to inline form and close modal -->
          <UButton
            class="mt-6 rounded-full bg-[#d4956a] px-8 font-semibold text-white transition-all duration-300 hover:bg-[#c4855a]"
            size="lg"
            @click="closePopupAndScroll"
          >
            Recevoir mon guide →
          </UButton>

          <p class="mt-4 text-xs text-[#857d8c]">
            Gratuit · Aucun spam · Désinscription en 1 clic
          </p>
        </div>
      </template>
    </UModal>
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

/* Pillar cards — B2B feature-card pattern */
.pillar-card:hover {
  border-color: #d7cfdf;
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.pillar-card:hover .pillar-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .pillar-card:hover {
    transform: none;
  }
}
</style>
