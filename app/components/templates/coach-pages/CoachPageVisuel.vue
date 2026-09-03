<script setup lang="ts">
/**
 * CoachPageVisuel — Template "Visuel" pour pages coach (Offre Essentiel, Story 0-38).
 *
 * Philosophie :
 *   - Atmosphère visuelle immersive avec photographies d'ambiance en haute définition
 *   - Hero plein écran avec double dégradé protecteur (teinte marque)
 *   - Sections dark contrastées (Problem) et claires (Bio, Piliers, Steps)
 *   - Bandeau photo intermédiaire (MidCTA)
 *   - Disponible sur le plan Essentiel sans surcoût
 *
 * Règle de visibilité :
 *   - toggle actif (sectionsConfig[section] !== false)
 *   - ET contenu backing JSONB non vide (bypassé en previewMode)
 *
 * Sections toujours visibles : Hero, MidCTA, Disclaimer médical.
 */
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachVisuelHeader from '~/components/templates/coach-pages/visuel/CoachVisuelHeader.vue'
import CoachVisuelHero from '~/components/templates/coach-pages/visuel/CoachVisuelHero.vue'
import CoachVisuelProblem from '~/components/templates/coach-pages/visuel/CoachVisuelProblem.vue'
import CoachVisuelBio from '~/components/templates/coach-pages/visuel/CoachVisuelBio.vue'
import CoachVisuelPillars from '~/components/templates/coach-pages/visuel/CoachVisuelPillars.vue'
import CoachTransformationBenefits from '~/components/organisms/CoachTransformationBenefits.vue'
import CoachVisuelSteps from '~/components/templates/coach-pages/visuel/CoachVisuelSteps.vue'
import CoachTestimonials from '~/components/organisms/CoachTestimonials.vue'
import CoachPricing from '~/components/organisms/CoachPricing.vue'
import CoachVisuelMidCta from '~/components/templates/coach-pages/visuel/CoachVisuelMidCta.vue'
import StickyCtaMobile from '~/components/molecules/StickyCtaMobile.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  coachProfile: PublicProviderProfile | null
  publicPrograms: PublicProgramListItem[]
  consultationPlans: ConsultationPricePlan[]
  isAuthenticated: boolean
  currentPath: string
  previewMode?: boolean
}>()

// --- Hide the global PublicHeader — Visuel owns its own header ---
const hideLayoutHeader = useState('hide-layout-header', () => false)
if (!props.previewMode) {
  hideLayoutHeader.value = true
  onBeforeUnmount(() => {
    hideLayoutHeader.value = false
  })
}

// --- Section visibility ---
const { show, isToggleOn } = useCoachSectionVisibility(() => props.coachProfile, {
  previewMode: () => props.previewMode
})

// --- Scroll reveal ---
const { reveal, isReady } = useScrollReveal({ disabled: props.previewMode })

const showProblemStatement = show.problemStatement
const showBio = show.bio
const showPillars = show.pillars
const showBenefits = show.benefits
const showHowItWorks = show.howItWorks
const showTestimonials = show.testimonials
const showFit = show.fit
const showPricingToggle = computed(() => isToggleOn('pricing'))
const showFaq = show.faq

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)
const problemStatement = computed(() => props.coachProfile?.problemStatementJson ?? null)
const sectionTitles = computed(() => props.coachProfile?.sectionTitlesJson ?? {})

const showPricing = computed(() => showPricingToggle.value)

// --- Header navigation links ---
const navLinks = computed(() => {
  const links: { label: string, href: string }[] = []
  if (showPillars.value) links.push({ label: 'Approche', href: '#approche' })
  if (showHowItWorks.value) links.push({ label: 'Parcours', href: '#parcours' })
  if (showBio.value) links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  if (showPricing.value) links.push({ label: 'Tarifs', href: '#tarifs' })
  return links
})

const FALLBACK_TESTIMONIALS = [
  { quote: 'Un accompagnement précieux qui m\'a permis de retrouver le sommeil et de comprendre mon corps.', firstName: 'Nathalie', age: 52, rating: 5 },
  { quote: 'Enfin une écoute bienveillante sans jugement. Je me sens beaucoup plus sereine au quotidien.', firstName: 'Corinne', age: 49, rating: 5 }
]

const apiTestimonials = computed(() => {
  const t = props.coachProfile?.testimonialsJson
  return t?.length ? t : FALLBACK_TESTIMONIALS
})

const FALLBACK_FAQ = [
  { label: 'Comment se déroule le premier appel découverte ?', content: 'C\'est un échange téléphonique ou visio de 15 minutes, entièrement gratuit et sans engagement. Nous faisons le point sur votre situation et vos attentes pour voir si mon approche vous correspond.' },
  { label: 'Les séances ont-elles lieu en présentiel ou à distance ?', content: 'Les séances sont proposées en visioconférence sécurisée ou au cabinet selon vos préférences et disponibilités.' },
  { label: 'Combien de séances sont généralement nécessaires ?', content: 'Le nombre de séances varie selon chaque femme et la nature de ses besoins. Nous définissons ensemble un rythme adapté lors du premier bilan.' }
]

// FAQ items
const faqItems = computed<AccordionItem[]>(() => {
  const api = props.coachProfile?.faqJson?.length ? props.coachProfile.faqJson : FALLBACK_FAQ
  return api.map((item, i) => ({
    label: item.label,
    content: item.content,
    value: `faq-${i + 1}`
  }))
})

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

// Hero props
const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: props.coachProfile?.heroHeadline ?? null,
  heroDescription: props.coachProfile?.heroDescription ?? null,
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  heroPhotoUrl: props.coachProfile?.heroImageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  logoUrl: props.coachProfile?.logoUrl ?? null,
  discoveryDurationMinutes: props.coachProfile?.discoveryDurationMinutes ?? 15,
  urgencyText: props.coachProfile?.urgencyText ?? null,
  ctaTo: props.ctaTo,
  specialties: props.coachProfile?.specialties ?? []
}))
</script>

<template>
  <div
    class="min-h-screen bg-[color:var(--color-surface-page)] text-[color:var(--color-text-primary)]"
    :class="{ 'js-scroll-ready': isReady }"
  >
    <!-- ==================== 0. HEADER ==================== -->
    <CoachVisuelHeader
      :coach-name="coachName"
      :nav-links="navLinks"
      cta-label="Réserver"
      :cta-to="ctaTo"
      login-to="/login"
      :is-authenticated="isAuthenticated"
    />

    <!-- ==================== 1. HERO ==================== -->
    <CoachVisuelHero v-bind="heroProps" />

    <!-- ==================== 2. PROBLÈME (optionnel) ==================== -->
    <CoachVisuelProblem
      v-if="showProblemStatement"
      :problem-statement="problemStatement"
      :eyebrow="sectionTitles.problemStatementEyebrow"
      :title="sectionTitles.problemStatementTitle"
    />

    <!-- ==================== 3. QUI SUIS-JE (optionnel) ==================== -->
    <CoachVisuelBio
      v-if="showBio"
      :coach-profile="coachProfile"
      :coach-name="coachName"
      :eyebrow="sectionTitles.bioEyebrow"
      :title="sectionTitles.bioTitle"
    />

    <!-- ==================== 4. PILIERS (optionnel) ==================== -->
    <CoachVisuelPillars
      v-if="showPillars"
      :pillars="coachProfile?.pillarsJson ?? null"
      :eyebrow="sectionTitles.pillarsEyebrow"
      :title="sectionTitles.pillarsTitle"
    />

    <!-- ==================== 5. BÉNÉFICES (optionnel) ==================== -->
    <div
      v-if="showBenefits"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-card)]"
    >
      <CoachTransformationBenefits :benefits="coachProfile?.benefitsJson ?? null">
        <template #header>
          <div class="text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.benefitsEyebrow || "Ce que l'accompagnement apporte" }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.benefitsTitle || 'Un parcours adapté' }}
            </h2>
          </div>
        </template>
      </CoachTransformationBenefits>
    </div>

    <!-- ==================== 6. PARCOURS (optionnel) ==================== -->
    <CoachVisuelSteps
      v-if="showHowItWorks"
      :steps="coachProfile?.howItWorksJson ?? null"
      :eyebrow="sectionTitles.howItWorksEyebrow"
      :title="sectionTitles.howItWorksTitle"
    />

    <!-- ==================== 6b. POUR QUI / FIT (optionnel) ==================== -->
    <AtomsCoachFitSection
      v-if="showFit"
    />

    <!-- ==================== 7. TÉMOIGNAGES (optionnel) ==================== -->
    <div
      v-if="showTestimonials"
      id="temoignages"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachTestimonials :testimonials="apiTestimonials">
        <template #header>
          <div class="mb-12 text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.testimonialsEyebrow || 'Témoignages' }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.testimonialsTitle || "Ce qu'elles en disent" }}
            </h2>
          </div>
        </template>
      </CoachTestimonials>
    </div>

    <!-- ==================== 8. TARIFS (optionnel) ==================== -->
    <div
      v-if="showPricing"
      id="tarifs"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-card)]"
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
          <div class="text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.pricingEyebrow || 'Tarifs' }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.pricingTitle || 'Tarifs des séances' }}
            </h2>
          </div>
        </template>
      </CoachPricing>
    </div>

    <!-- ==================== 9. BANDEAU CTA INTERMÉDIAIRE ==================== -->
    <CoachVisuelMidCta
      :cta-to="ctaTo"
      :discovery-duration-minutes="discoveryDuration"
      :band-photo-url="coachProfile?.secondaryPhotoUrl"
    />

    <!-- ==================== 10. FAQ (optionnel) ==================== -->
    <section
      v-if="showFaq"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <div class="mb-12 text-center">
          <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
            {{ sectionTitles.faqEyebrow || 'Questions fréquentes' }}
          </span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)]">
            {{ sectionTitles.faqTitle || "Questions fréquentes sur l'accompagnement" }}
          </h2>
        </div>

        <UAccordion
          :items="faqItems"
          :default-value="faqDefaultValue"
          multiple
          aria-label="Questions fréquentes"
        >
          <template #content="{ item }">
            <div class="space-y-3 pb-3.5 text-sm text-[color:var(--color-brand-secondary)]">
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

    <!-- ==================== 11. DISCLAIMER MÉDICAL (toujours visible) ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- Spacer for mobile sticky CTA -->
    <div
      v-if="!previewMode"
      class="h-16 md:hidden"
    />

    <!-- Sticky CTA mobile — hidden in preview mode -->
    <StickyCtaMobile
      v-if="!previewMode"
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />
  </div>
</template>

<style scoped>
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(24px);
}

.scroll-reveal {
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
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
