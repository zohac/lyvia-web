<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
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

const { reveal, isReady } = useScrollReveal()
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

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')

// Provider enriched profile data (loaded by useCoachSchemaOrg in parent page)
const { data: coachProfile } = useNuxtData<PublicProviderProfile>(`public-provider-profile:${props.tenant.slug}`)

// --- Section visibility (P-Y3) ---
function isSectionVisible(section: string): boolean {
  const config = coachProfile.value?.sectionsConfig
  if (!config) return true
  return config[section] !== false
}

// --- Content data from API (YC2.1) ---

// Pillars: API data or generic fallback
const pillars = computed(() => {
  const api = coachProfile.value?.pillarsJson
  if (api?.items?.length) return api
  return null
})

const DEFAULT_PILLAR_ICONS = ['i-lucide-apple', 'i-lucide-wind', 'i-lucide-moon-star', 'i-lucide-heart-pulse']

const pillarItems = computed(() => {
  const items = pillars.value?.items ?? []
  return items.map((p, i) => ({
    ...p,
    icon: p.icon || DEFAULT_PILLAR_ICONS[i] || 'i-lucide-circle'
  }))
})

const emotionalSupport = computed(() => pillars.value?.emotionalSupport ?? null)

// FAQ: API data or empty (no hardcoded fallback)
const faqItems = computed<AccordionItem[]>(() => {
  const api = coachProfile.value?.faqJson
  if (!api?.length) return []
  return api.map((item, i) => ({
    label: item.label,
    content: item.content,
    value: `faq-${i + 1}`
  }))
})

// FAQ SSR: all items open on server, closed after hydration (AC-5)
const allFaqValues = computed(() => faqItems.value.map(item => item.value).filter((v): v is string => !!v))
const faqDefaultValue = ref<string[]>([])

// Initialize to all values for SSR crawlability
watchEffect(() => {
  if (import.meta.server) {
    faqDefaultValue.value = allFaqValues.value
  }
})

onMounted(() => {
  // Close all FAQ items after hydration — UX preserved, content was crawlable in SSR
  faqDefaultValue.value = []
})

// Problem statement: API data or null (no hardcoded fallback)
const problemStatement = computed(() => coachProfile.value?.problemStatementJson ?? null)

// Testimonials: API data only, no hardcoded fallback mentioning a specific coach
const apiTestimonials = computed(() => coachProfile.value?.testimonialsJson ?? [])
const hasTestimonials = computed(() => apiTestimonials.value.length > 0)
const firstTestimonial = computed(() => apiTestimonials.value[0] ?? null)

// Pricing & programs
const consultationPlans = computed(() => pricingData.value?.plans ?? [])
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
  <div
    class="min-h-screen"
    :class="{ 'js-scroll-ready': isReady }"
  >
    <!-- ==================== 1. HERO (beige) ==================== -->
    <CoachHeroProfile v-bind="heroProps" />

    <!-- ==================== 2. BLOC PROBLÈME (blanc) ==================== -->
    <section
      v-if="problemStatement && isSectionVisible('problemStatement')"
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-[color:var(--color-surface-card)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--color-brand-accent)]/30 to-transparent" />
      <div class="mx-auto max-w-5xl">
        <blockquote class="relative">
          <span
            class="absolute -left-4 -top-8 font-serif text-[12rem] leading-none text-[var(--color-brand-accent)]/10 lg:-left-16"
            aria-hidden="true"
          >"</span>
          <p class="relative font-serif text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] text-[var(--color-crepuscule-950)]">
            {{ problemStatement.blockquote }}
          </p>
        </blockquote>

        <div
          v-if="problemStatement.paragraphs?.length"
          class="mt-12 space-y-6"
        >
          <p
            v-for="(paragraph, i) in problemStatement.paragraphs"
            :key="i"
            class="text-lg leading-relaxed text-[var(--color-crepuscule-700)]"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 3. MINI-TÉMOIGNAGE (beige) ==================== -->
    <section
      v-if="apiTestimonials.length > 0 && isSectionVisible('miniTestimonial')"
      v-bind="reveal()"
      class="scroll-reveal bg-[var(--color-neutral-50)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl text-center">
        <blockquote class="font-serif text-xl italic leading-relaxed text-[var(--color-crepuscule-700)] lg:text-2xl">
          « {{ firstTestimonial?.quote }} »
        </blockquote>
        <footer class="mt-6 text-sm text-[var(--color-text-muted)]">
          <span class="font-medium text-[var(--color-crepuscule-950)]">
            {{ firstTestimonial?.firstName }}
          </span>
          <template v-if="firstTestimonial?.age">
            , {{ firstTestimonial.age }} ans
          </template>
        </footer>
      </div>
    </section>

    <!-- ==================== 4. CE QUE L'ACCOMPAGNEMENT APPORTE (blanc) ==================== -->
    <div
      v-if="isSectionVisible('benefits')"
      id="accompagnement"
    >
      <CoachTransformationBenefits :benefits="coachProfile?.benefitsJson ?? null">
        <template #header>
          <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
            Ce que cela apporte
          </span>
          <h2 class="mt-6 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
            Accompagnement ménopause
            <span class="block text-[var(--color-brand-primary)]">personnalisé</span>
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
      class="scroll-reveal relative overflow-hidden bg-[var(--color-crepuscule-950)] px-6 py-32 text-white sm:px-12 lg:px-20"
    >
      <div class="relative mx-auto max-w-7xl">
        <div class="grid gap-16 lg:grid-cols-12 lg:items-center">
          <!-- Photo -->
          <div class="flex justify-center lg:col-span-5">
            <div class="relative">
              <div
                class="bio-photo-shape absolute h-[45vh] w-72 translate-x-4 translate-y-4 bg-gradient-to-br from-[var(--color-brand-accent)]/25 to-[var(--color-brand-primary)]/15"
                aria-hidden="true"
              />
              <div class="bio-photo-shape relative h-[45vh] w-72 overflow-hidden shadow-2xl shadow-black/20">
                <NuxtImg
                  v-if="coachProfile?.secondaryPhotoUrl || coachProfile?.imageUrl"
                  :src="(coachProfile?.secondaryPhotoUrl ?? coachProfile?.imageUrl)!"
                  :alt="`${coachName}, spécialiste accompagnement ménopause`"
                  class="h-full w-full object-cover object-top"
                  width="288"
                  height="400"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-500)]"
                >
                  <span class="font-serif text-6xl font-bold text-white/40">{{ coachName.charAt(0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="lg:col-span-7">
            <span class="mb-6 inline-block rounded-full border border-[var(--color-brand-accent)]/30 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-brand-accent)]">
              Qui suis-je
            </span>

            <!-- H2 with SEO keyword (P-Y5) -->
            <h2 class="font-serif text-4xl leading-tight text-white">
              Votre spécialiste ménopause — {{ coachName }}
            </h2>

            <!-- Credentials subtitle (dynamic from profile) -->
            <p
              v-if="coachProfile?.credentials?.length || coachProfile?.city"
              class="mt-4 text-lg text-[var(--color-brand-accent)]"
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
                class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-accent)]/20 bg-[var(--color-brand-accent)]/10 px-4 py-1.5 text-sm text-[var(--color-sunset-300)]"
              >
                {{ coachProfile.credentials[0]?.title }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-accent)]/20 bg-[var(--color-brand-accent)]/10 px-4 py-1.5 text-sm text-[var(--color-sunset-300)]">
                Accompagnement en périménopause et ménopause
              </span>
              <span
                v-if="coachProfile?.city"
                class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-accent)]/20 bg-[var(--color-brand-accent)]/10 px-4 py-1.5 text-sm text-[var(--color-sunset-300)]"
              >
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-4"
                />
                {{ coachProfile.city }}{{ coachProfile?.region ? ` · ${coachProfile.region}` : '' }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-accent)]/20 bg-[var(--color-brand-accent)]/10 px-4 py-1.5 text-sm text-[var(--color-sunset-300)]">
                <UIcon
                  name="i-lucide-video"
                  class="size-4"
                />
                100% en visio · Toute la France
              </span>
            </div>

            <div class="mt-10 space-y-6 text-base leading-relaxed text-[var(--color-crepuscule-300)]">
              <!-- Priority: longBio (markdown-like paragraphs) → bio (short) → generic fallback -->
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
              <template v-else>
                <p>
                  Spécialiste en accompagnement bien-être, je propose un suivi personnalisé
                  et adapté à chaque étape de votre parcours.
                </p>
              </template>
            </div>

            <!-- Phone (FR-Y16, v-if graceful degradation) -->
            <a
              v-if="coachProfile?.publicPhone"
              :href="`tel:${coachProfile.publicPhone}`"
              class="mt-6 inline-flex items-center gap-2 text-[var(--color-brand-accent)] hover:underline"
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
                class="grid size-10 place-items-center rounded-full border border-[var(--color-brand-accent)]/30 text-[var(--color-brand-accent)] transition-colors hover:bg-[var(--color-brand-accent)]/10"
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
                class="grid size-10 place-items-center rounded-full border border-[var(--color-brand-accent)]/30 text-[var(--color-brand-accent)] transition-colors hover:bg-[var(--color-brand-accent)]/10"
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
                class="grid size-10 place-items-center rounded-full border border-[var(--color-brand-accent)]/30 text-[var(--color-brand-accent)] transition-colors hover:bg-[var(--color-brand-accent)]/10"
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
                class="grid size-10 place-items-center rounded-full border border-[var(--color-brand-accent)]/30 text-[var(--color-brand-accent)] transition-colors hover:bg-[var(--color-brand-accent)]/10"
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
        :testimonials="apiTestimonials"
      >
        <template #header>
          <div class="mb-12 text-center">
            <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-accent)]">
              Témoignages
            </span>
            <h2 class="font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)]">
              Leurs mots,
              <span class="text-[var(--color-brand-primary)]">leur vérité</span>
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
      v-if="pillarItems.length > 0 && isSectionVisible('pillars')"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-7xl">
        <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
          L'accompagnement
        </span>

        <!-- H2 with SEO keyword (P-Y5) -->
        <h2 class="mt-6 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
          Les {{ pillarItems.length }} piliers de
          <span class="block text-[var(--color-brand-primary)]">l'accompagnement</span>
        </h2>

        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-crepuscule-700)]">
          Une approche globale, personnalisée et respectueuse.
        </p>

        <div class="mt-16 grid gap-8 md:grid-cols-2">
          <article
            v-for="(pillar, index) in pillarItems"
            :key="pillar.title"
            v-bind="reveal({ delay: index * 120 })"
            class="pillar-card scroll-reveal group relative overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-8 transition-all duration-300"
          >
            <!-- Glow blob top-right (appears on hover, like B2B feature-card) -->
            <div
              class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
              aria-hidden="true"
            />

            <div class="relative flex items-start gap-5">
              <!-- Icon with color change on hover (B2B pattern) -->
              <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
                <UIcon
                  :name="pillar.icon"
                  class="size-6 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
                />
              </div>

              <div>
                <span class="font-serif text-sm text-[var(--color-brand-accent)]/60">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <h3 class="mt-1 font-serif text-xl text-[var(--color-crepuscule-950)]">
                  {{ pillar.title }}
                </h3>
                <p class="mt-3 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
                  {{ pillar.description }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <!-- Emotional support callout (5th pillar — distinct treatment) -->
        <div
          v-if="emotionalSupport"
          v-bind="reveal({ delay: 500 })"
          class="pillar-card scroll-reveal group relative mt-8 overflow-hidden rounded-2xl border border-[var(--color-crepuscule-100)] bg-[color:var(--color-surface-card)] p-8 transition-all duration-300"
        >
          <div
            class="pillar-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[var(--color-sunset-400)] to-[var(--color-brand-accent)] opacity-0"
            aria-hidden="true"
          />
          <div class="relative flex items-start gap-5">
            <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-crepuscule-100)] to-[var(--color-crepuscule-50)] transition-all duration-300 group-hover:from-[var(--color-sunset-100)] group-hover:to-[var(--color-sunset-50)]">
              <UIcon
                :name="emotionalSupport.icon || 'i-lucide-hand-heart'"
                class="size-6 text-[var(--color-brand-primary)] transition-colors duration-300 group-hover:text-[var(--color-brand-accent)]"
              />
            </div>
            <div>
              <span class="font-serif text-sm text-[var(--color-brand-accent)]/60">
                {{ String(pillarItems.length + 1).padStart(2, '0') }}
              </span>
              <h3 class="mt-1 font-serif text-xl text-[var(--color-crepuscule-950)]">
                {{ emotionalSupport.title }}
              </h3>
              <p class="mt-3 max-w-3xl text-base leading-relaxed text-[var(--color-crepuscule-700)]">
                {{ emotionalSupport.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 8. COMMENT ÇA MARCHE (beige) ==================== -->
    <CoachHowItWorks
      v-if="isSectionVisible('howItWorks')"
      :discovery-duration-minutes="discoveryDuration"
      :steps="coachProfile?.howItWorksJson ?? null"
    >
      <template #header>
        <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
          Le parcours
        </span>
        <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
          Comment se déroule la séance
          <span class="block text-[var(--color-brand-primary)]">découverte ménopause</span>
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
          <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
            Tarifs
          </span>
          <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
            Tarifs des séances
            <span class="block text-[var(--color-brand-primary)]">accompagnement ménopause</span>
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
    <CoachEducationalContent
      v-if="isSectionVisible('educationalContent')"
      :content="coachProfile?.educationalContentJson ?? null"
    >
      <template #header>
        <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
          Comprendre
        </span>
        <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
          Comprendre la ménopause
          <span class="block text-[var(--color-brand-primary)]">et la pré-ménopause</span>
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
      v-if="faqItems.length > 0 && isSectionVisible('faq')"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <div class="mb-16 text-center">
          <h2 class="font-serif text-3xl leading-tight text-[var(--color-crepuscule-950)]">
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
            <div class="space-y-3 pb-3.5 text-sm text-[var(--color-crepuscule-700)]">
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
      class="scroll-reveal relative overflow-hidden bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-800)] px-6 py-32 sm:px-12 lg:px-20"
    >
      <div
        class="pointer-events-none absolute -right-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full"
        style="background: radial-gradient(circle, rgba(212,149,106,0.15), transparent 60%); filter: blur(80px);"
      />

      <div class="relative mx-auto max-w-3xl text-center">
        <!-- H2 with SEO keyword (P-Y5) -->
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Réservez votre
          <span class="block text-[var(--color-sunset-300)]">séance découverte gratuite</span>
        </h2>

        <p class="mx-auto mt-8 max-w-lg text-lg text-[var(--color-crepuscule-200)]">
          Un premier échange de {{ coachProfile?.discoveryDurationMinutes ?? 15 }} minutes, gratuit et sans engagement,
          pour voir si nous sommes faites pour cheminer ensemble.
        </p>

        <div class="mt-12">
          <UButton
            :to="ctaTo"
            size="xl"
            data-final-cta
            class="group rounded-full border-2 border-[var(--color-brand-accent)] bg-[var(--color-brand-accent)] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[var(--color-sunset-300)]"
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

        <p class="mt-8 text-sm text-[var(--color-crepuscule-400)]">
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
            class="absolute right-4 top-4 rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-crepuscule-950)]"
            aria-label="Fermer"
            @click="showExitPopup = false"
          >
            <UIcon
              name="i-lucide-x"
              class="size-5"
            />
          </button>

          <h3 class="font-serif text-2xl text-[var(--color-crepuscule-950)]">
            Avant de partir...
          </h3>
          <p class="mt-3 text-[var(--color-crepuscule-700)]">
            Téléchargez gratuitement : {{ leadMagnetTitle }}
          </p>

          <p class="mt-2 text-sm text-[var(--color-text-muted)]">
            Laissez votre email pour recevoir le guide
          </p>

          <!-- Scroll to inline form and close modal -->
          <UButton
            class="mt-6 rounded-full bg-[var(--color-brand-accent)] px-8 font-semibold text-white transition-all duration-300 hover:bg-[var(--color-sunset-600)]"
            size="lg"
            @click="closePopupAndScroll"
          >
            Recevoir mon guide →
          </UButton>

          <p class="mt-4 text-xs text-[var(--color-text-muted)]">
            Gratuit · Aucun spam · Désinscription en 1 clic
          </p>
        </div>
      </template>
    </UModal>

    <!-- ==================== SLIDE-IN NOTIFICATION (lead magnet) ==================== -->
    <CoachAnnouncementBar
      v-if="hasLeadMagnet"
      :slug="tenant.slug"
      :lead-magnet-title="leadMagnetTitle"
    />
  </div>
</template>

<style scoped>
.bio-photo-shape {
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
}

/* Scroll reveal base — visible by default for SSR, hidden only after JS loads */
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(24px);
}

.scroll-reveal {
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Pillar cards — B2B feature-card pattern */
.pillar-card:hover {
  border-color: var(--color-crepuscule-200);
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.pillar-card:hover .pillar-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .js-scroll-ready .scroll-reveal:not(.is-visible) {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .scroll-reveal {
    transition: none;
  }

  .pillar-card:hover {
    transform: none;
  }
}
</style>
