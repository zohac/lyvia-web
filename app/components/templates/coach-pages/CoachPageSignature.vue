<script setup lang="ts">
/**
 * CoachPageSignature — Template "Signature" pour pages coach (YC2.1).
 *
 * Template de rendu complet de la page coach publique. Reçoit TOUTES les
 * données en props explicites (pas de lecture de useNuxtData en interne) :
 * c'est le data loader parent qui fetch et pousse les props.
 *
 * Règle de visibilité (P-Y3) :
 *   Une section configurable est rendue UNIQUEMENT si :
 *   - son toggle sectionsConfig[section] n'est pas explicitement false
 *   - ET son contenu correspondant (JSONB) est non vide
 *
 * Les sections Hero, CTA final et disclaimer sont toujours visibles.
 */
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import CoachHeroProfile from '~/components/organisms/CoachHeroProfile.vue'
import CoachTransformationBenefits from '~/components/organisms/CoachTransformationBenefits.vue'
import CoachHowItWorks from '~/components/organisms/CoachHowItWorks.vue'
import CoachPillars from '~/components/organisms/CoachPillars.vue'
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
  coachProfile: PublicProviderProfile | null
  publicPrograms: PublicProgramListItem[]
  consultationPlans: ConsultationPricePlan[]
  isAuthenticated: boolean
  currentPath: string
}>()

const { reveal, isReady } = useScrollReveal()

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')

// --- Section visibility (P-Y3 : toggle actif ET contenu non vide) ---
// Logique factorisée dans useCoachSectionVisibility (DRY, YC2.3).
const { show, isToggleOn } = useCoachSectionVisibility(() => props.coachProfile)

const showBio = show.bio
const showProblemStatement = show.problemStatement
const showBenefits = show.benefits
const showPillars = show.pillars
const showHowItWorks = show.howItWorks
const showEducationalContent = show.educationalContent
const showFaq = show.faq
const showMiniTestimonial = show.miniTestimonial
const showTestimonials = show.testimonials

// --- Derived content ---

const problemStatement = computed(() => props.coachProfile?.problemStatementJson ?? null)

// Testimonials — API only, no hardcoded fallback
// `hasTestimonials` was previously used as v-if guard before story 0-26 round terrain ;
// remplacé par `showTestimonials` (toggle + contenu, via useCoachSectionVisibility).
const apiTestimonials = computed(() => props.coachProfile?.testimonialsJson ?? [])
const firstTestimonial = computed(() => apiTestimonials.value[0] ?? null)

// FAQ items
const faqItems = computed<AccordionItem[]>(() => {
  const api = props.coachProfile?.faqJson
  if (!api?.length) return []
  return api.map((item, i) => ({
    label: item.label,
    content: item.content,
    value: `faq-${i + 1}`
  }))
})

// FAQ SSR: all items open on server, closed after hydration
const allFaqValues = computed(() => faqItems.value.map(item => item.value).filter((v): v is string => !!v))
const faqDefaultValue = ref<string[]>([])

watchEffect(() => {
  if (import.meta.server) {
    faqDefaultValue.value = allFaqValues.value
  }
})

onMounted(() => {
  faqDefaultValue.value = []
})

// Pricing & programs (Story 0-26 round terrain — gate par toggle ET contenu)
const hasPricing = computed(() => props.consultationPlans.length > 0 || props.publicPrograms.length > 0)
const showPricing = computed(() => isToggleOn('pricing') && hasPricing.value)
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)

// Lead magnet
const leadMagnetUrl = computed(() => props.coachProfile?.leadMagnetUrl ?? null)
const leadMagnetTitle = computed(() => props.coachProfile?.leadMagnetTitle ?? 'Guide gratuit')
const hasLeadMagnet = computed(() => !!leadMagnetUrl.value)

// Exit intent popup — desktop only
const showExitPopup = ref(false)
useExitIntent({
  onTrigger: () => {
    if (!hasLeadMagnet.value) return
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

// Hero props
const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: props.coachProfile?.heroHeadline ?? null,
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  heroPhotoUrl: props.coachProfile?.heroImageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  discoveryDurationMinutes: props.coachProfile?.discoveryDurationMinutes ?? 15,
  urgencyText: props.coachProfile?.urgencyText ?? null,
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
      v-if="showProblemStatement && problemStatement"
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
      v-if="showMiniTestimonial && firstTestimonial"
      v-bind="reveal()"
      class="scroll-reveal bg-[var(--color-neutral-50)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl text-center">
        <blockquote class="font-serif text-xl italic leading-relaxed text-[var(--color-crepuscule-700)] lg:text-2xl">
          « {{ firstTestimonial.quote }} »
        </blockquote>
        <footer class="mt-6 text-sm text-[var(--color-text-muted)]">
          <span class="font-medium text-[var(--color-crepuscule-950)]">
            {{ firstTestimonial.firstName }}
          </span>
          <template v-if="firstTestimonial.age">
            , {{ firstTestimonial.age }} ans
          </template>
        </footer>
      </div>
    </section>

    <!-- ==================== 4. CE QUE L'ACCOMPAGNEMENT APPORTE (blanc) ==================== -->
    <div
      v-if="showBenefits"
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
      v-if="showBenefits"
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 5. À PROPOS (dark) ==================== -->
    <section
      v-if="showBio"
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
                  sizes="(max-width: 768px) 80vw, 288px"
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

            <!-- Social links -->
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
    <!-- Story 0-26 round terrain — gate par toggle (sectionsConfig.testimonials !== false) -->
    <div
      v-if="showTestimonials"
      id="temoignages"
    >
      <CoachTestimonials
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
      v-if="showTestimonials"
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 7. PILIERS (blanc) ==================== -->
    <CoachPillars
      v-if="showPillars"
      :pillars="coachProfile?.pillarsJson ?? null"
    />

    <!-- ==================== 8. COMMENT ÇA MARCHE (beige) ==================== -->
    <CoachHowItWorks
      v-if="showHowItWorks"
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
    <!-- Story 0-26 round terrain — gate par toggle (sectionsConfig.pricing !== false) ET contenu -->
    <div
      v-if="showPricing"
      id="tarifs"
    >
      <CoachPricing
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
      v-if="showPricing"
      :cta-to="ctaTo"
      :duration-minutes="discoveryDuration"
    />

    <!-- ==================== 10. CONTENU ÉDUCATIF (beige) ==================== -->
    <CoachEducationalContent
      v-if="showEducationalContent"
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
      v-if="showFaq"
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
          Un premier échange de {{ discoveryDuration }} minutes, gratuit et sans engagement,
          pour voir si nous sommes faites pour cheminer ensemble.
        </p>

        <div class="mt-12">
          <UButton
            :to="ctaTo"
            size="xl"
            data-final-cta
            class="group rounded-full border-2 border-[var(--color-brand-accent)] bg-[var(--color-brand-accent)] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[var(--color-sunset-300)]"
          >
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

    <!-- Sticky CTA mobile -->
    <StickyCtaMobile
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />

    <!-- ==================== EXIT INTENT MODAL ==================== -->
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

@media (prefers-reduced-motion: reduce) {
  .js-scroll-ready .scroll-reveal:not(.is-visible) {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .scroll-reveal {
    transition: none;
  }
}
</style>
