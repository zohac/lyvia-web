<script setup lang="ts">
/**
 * CoachPageEssentiel — Template "Essentiel" pour pages coach (YC2.3).
 *
 * Philosophie : fiche professionnelle sobre, lumineuse, crédible. Conçu
 * pour les nouveaux coaches qui n'ont pas (encore) la matière éditoriale
 * d'un template scrolltelling type Signature. Le rendu reste propre même
 * avec peu de contenu — seules les sections remplies sont rendues.
 *
 * Différenciation vs CoachPageSignature :
 *   - 100 % lumineux (zéro section dark/hero photo contraste fort)
 *   - Grid-first : bio en 2-col asymétrique sur surface-card
 *   - Typo restreinte (text-3xl max sur H2 inline) vs text-4xl/5xl
 *   - Pas de scroll-reveal sur chaque bloc — rythme plus posé
 *   - CTA final sobre (card borderée accent, pas de gradient lourd)
 *   - Exclusions Signature : problemStatement, educationalContent,
 *     miniTestimonial, leadCapture, exitIntent, announcementBar
 *
 * Sections supportées (seed `sections_available` de la migration) :
 *   hero, bio, benefits, pillars, howItWorks, testimonials, pricing,
 *   faq, disclaimer
 *
 * Règle de visibilité (P-Y3 — partagée via useCoachSectionVisibility) :
 *   - toggle actif (sectionsConfig[section] !== false)
 *   - ET contenu backing JSONB non vide
 *
 * Sections toujours visibles : Hero, CTA final, Disclaimer médical (FR-Y9).
 */
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachEssentielHeader from '~/components/templates/coach-pages/essentiel/CoachEssentielHeader.vue'
import CoachEssentielHero from '~/components/templates/coach-pages/essentiel/CoachEssentielHero.vue'
import CoachTransformationBenefits from '~/components/organisms/CoachTransformationBenefits.vue'
import CoachPillars from '~/components/organisms/CoachPillars.vue'
import CoachHowItWorks from '~/components/organisms/CoachHowItWorks.vue'
import CoachTestimonials from '~/components/organisms/CoachTestimonials.vue'
import CoachPricing from '~/components/organisms/CoachPricing.vue'
import StickyCtaMobile from '~/components/molecules/StickyCtaMobile.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  coachProfile: PublicProviderProfile | null
  publicPrograms: PublicProgramListItem[]
  consultationPlans: ConsultationPricePlan[]
  isAuthenticated: boolean
  currentPath: string
  /**
   * Story 0-28 — when true, the template is mounted inside the live preview
   * panel on `/provider/coach-page`. Disables side-effects (sticky CTA,
   * scroll-reveal observer, layout-header hide) so the hosting page keeps
   * its own header intact and the editor never triggers booking flows.
   */
  previewMode?: boolean
}>()

// --- Hide the global PublicHeader — Essentiel owns its own header ---
// Uses the parallel pattern of `hide-layout-footer` already present in public.vue.
// Story 0-28 — skipped in preview mode so the hosting `/provider/coach-page`
// keeps its provider header visible.
const hideLayoutHeader = useState('hide-layout-header', () => false)
if (!props.previewMode) {
  hideLayoutHeader.value = true
  onBeforeUnmount(() => {
    hideLayoutHeader.value = false
  })
}

// --- Section visibility (P-Y3 via composable partagé YC2.3) ---
// Story 0-28 — propage `previewMode` pour bypasser le hasContent check
// dans la preview live (Sophie voit l'effet du toggle instant, même
// sans contenu rempli).
const { show, isToggleOn } = useCoachSectionVisibility(() => props.coachProfile, {
  previewMode: () => props.previewMode
})

// --- Scroll reveal (SSR-safe — visible by default, hidden only after JS) ---
// Story 0-28 — opt-out in preview mode (panel has its own scroll container).
const { reveal, isReady } = useScrollReveal({ disabled: props.previewMode })

const showBio = show.bio
const showBenefits = show.benefits
const showProblemStatement = show.problemStatement
const showPillars = show.pillars
const showHowItWorks = show.howItWorks
const showTestimonials = show.testimonials
const showFit = show.fit
const showFaq = show.faq

// --- Derived data ---

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)
const problemStatement = computed(() => props.coachProfile?.problemStatementJson ?? null)
const sectionTitles = computed(() => props.coachProfile?.sectionTitlesJson ?? {})

// Pricing — la carte appel découverte gratuit est toujours présente, donc showPricing = toggle
const showPricing = computed(() => isToggleOn('pricing'))

// --- Header navigation links (anchor scroll) ---
const navLinks = computed(() => {
  const links: { label: string, href: string }[] = []
  if (showBenefits.value) links.push({ label: 'Accompagnement', href: '#accompagnement' })
  if (showBio.value) links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  if (showPricing.value) links.push({ label: 'Tarifs', href: '#tarifs' })
  if (showTestimonials.value) links.push({ label: 'Témoignages', href: '#temoignages' })
  return links
})

const credentialLine = computed(() => {
  const creds = props.coachProfile?.credentials ?? []
  const city = props.coachProfile?.city
  const parts: string[] = []
  if (creds.length && creds[0]?.title) parts.push(creds[0].title)
  if (city) parts.push(city)
  return parts.join(' · ')
})

const bioParagraphs = computed<string[]>(() => {
  const longBio = props.coachProfile?.longBio
  if (longBio) return longBio.split('\n\n').filter(Boolean)
  const bio = props.coachProfile?.bio
  if (bio) return [bio]
  return []
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

// FAQ items (same mapping as Signature)
const faqItems = computed<AccordionItem[]>(() => {
  const api = props.coachProfile?.faqJson?.length ? props.coachProfile.faqJson : FALLBACK_FAQ
  return api.map((item, i) => ({
    label: item.label,
    content: item.content,
    value: `faq-${i + 1}`
  }))
})

// FAQ SSR: all items open on server, closed after hydration (crawlability)
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

// Hero props — Essentiel passes specialties so the eyebrow pill is data-driven
// (no hardcoded "Praticienne bien-être" label).
const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: props.coachProfile?.heroHeadline ?? null,
  heroDescription: props.coachProfile?.heroDescription ?? null,
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  heroPhotoUrl: props.coachProfile?.heroImageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  // Story 0-27 — propagation cross-template (rendu actuel : signature uniquement).
  logoUrl: props.coachProfile?.logoUrl ?? null,
  discoveryDurationMinutes: props.coachProfile?.discoveryDurationMinutes ?? 15,
  urgencyText: props.coachProfile?.urgencyText ?? null,
  ctaTo: props.ctaTo,
  specialties: props.coachProfile?.specialties ?? []
}))
</script>

<template>
  <div
    class="min-h-screen bg-[color:var(--color-surface-card)]"
    :class="{ 'js-scroll-ready': isReady }"
  >
    <!-- ==================== 0. HEADER (sticky pleine largeur) ==================== -->
    <CoachEssentielHeader
      brand-label="Keova"
      :coach-name="coachName"
      :nav-links="navLinks"
      cta-label="Réserver"
      :cta-to="ctaTo"
      login-to="/login"
      :is-authenticated="isAuthenticated"
    />

    <!-- ==================== 1. HERO ==================== -->
    <CoachEssentielHero v-bind="heroProps" />

    <!-- ==================== 1.5 PROBLÈME (optionnel) ==================== -->
    <section
      v-if="showProblemStatement"
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-[color:var(--color-surface-card)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-5xl">
        <div
          v-if="sectionTitles.problemStatementEyebrow || sectionTitles.problemStatementTitle"
          class="mb-12 text-center"
        >
          <span
            v-if="sectionTitles.problemStatementEyebrow"
            class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]"
          >
            {{ sectionTitles.problemStatementEyebrow }}
          </span>
          <h2
            v-if="sectionTitles.problemStatementTitle"
            class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl"
          >
            {{ sectionTitles.problemStatementTitle }}
          </h2>
        </div>

        <blockquote class="relative">
          <span
            class="absolute -left-4 -top-8 font-serif text-[12rem] leading-none text-[var(--color-brand-accent)]/10 lg:-left-16"
            aria-hidden="true"
          >"</span>
          <p class="relative font-serif text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] text-[color:var(--color-text-primary)]">
            {{ problemStatement?.blockquote || "« On me dit que c'est dans la tête, mais je ne reconnais plus mon corps. »" }}
          </p>
        </blockquote>

        <div
          v-if="problemStatement?.paragraphs?.length"
          class="mt-12 space-y-6"
        >
          <p
            v-for="(paragraph, i) in problemStatement.paragraphs"
            :key="i"
            class="text-lg leading-relaxed text-[color:var(--color-brand-secondary)]"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 2. BÉNÉFICES — Ce que cela apporte (optionnel) ==================== -->
    <div
      v-if="showBenefits"
      id="accompagnement"
      v-bind="reveal()"
      class="scroll-reveal"
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

    <!-- ==================== 3. À PROPOS — Qui suis-je (crepuscule-50 bg — rupture visuelle "preuve") ==================== -->
    <section
      v-if="showBio"
      id="qui-suis-je"
      v-bind="reveal()"
      class="scroll-reveal relative bg-[color:var(--color-crepuscule-50)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-6xl">
        <div class="grid gap-12 lg:grid-cols-12 lg:items-start">
          <!-- Photo — left column (compact, clean) -->
          <div class="lg:col-span-5">
            <div class="relative mx-auto max-w-sm">
              <div class="aspect-[4/5] overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] shadow-sm">
                <NuxtImg
                  v-if="coachProfile?.secondaryPhotoUrl || coachProfile?.imageUrl"
                  :src="(coachProfile?.secondaryPhotoUrl ?? coachProfile?.imageUrl)!"
                  :alt="`${coachName}, spécialiste accompagnement ménopause`"
                  class="h-full w-full object-cover object-top"
                  sizes="(max-width: 768px) 90vw, 400px"
                  width="400"
                  height="500"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--color-surface-highlight)] to-[color:var(--color-surface-page)]"
                >
                  <span class="font-serif text-7xl text-[color:var(--color-brand-primary)]/30">
                    {{ coachName.charAt(0) }}
                  </span>
                </div>
              </div>

              <!-- Location & session badge under the photo -->
              <div
                v-if="coachProfile?.city || coachProfile?.publicPhone"
                class="mt-6 space-y-3 text-sm text-[color:var(--color-brand-secondary)]"
              >
                <div
                  v-if="coachProfile?.city"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-4 text-[color:var(--color-brand-accent)]"
                  />
                  <span>
                    {{ coachProfile.city }}<template v-if="coachProfile?.region"> · {{ coachProfile.region }}</template>
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-video"
                    class="size-4 text-[color:var(--color-brand-accent)]"
                  />
                  <span>100 % en visio · Toute la France</span>
                </div>
                <a
                  v-if="coachProfile?.publicPhone"
                  :href="`tel:${coachProfile.publicPhone}`"
                  class="flex items-center gap-2 text-[color:var(--color-brand-primary)] hover:underline"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="size-4"
                  />
                  {{ coachProfile.publicPhone }}
                </a>
              </div>

              <!-- Social links (compact row) -->
              <div
                v-if="coachProfile?.socialLinks && (coachProfile.socialLinks.linkedin || coachProfile.socialLinks.instagram || coachProfile.socialLinks.facebook || coachProfile.socialLinks.website)"
                class="mt-5 flex gap-3"
              >
                <a
                  v-if="coachProfile.socialLinks.linkedin"
                  :href="coachProfile.socialLinks.linkedin"
                  target="_blank"
                  rel="noopener"
                  aria-label="LinkedIn"
                  class="grid size-9 place-items-center rounded-full border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-primary)] transition-colors hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                >
                  <UIcon
                    name="i-simple-icons-linkedin"
                    class="size-4"
                  />
                </a>
                <a
                  v-if="coachProfile.socialLinks.instagram"
                  :href="coachProfile.socialLinks.instagram"
                  target="_blank"
                  rel="noopener"
                  aria-label="Instagram"
                  class="grid size-9 place-items-center rounded-full border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-primary)] transition-colors hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                >
                  <UIcon
                    name="i-simple-icons-instagram"
                    class="size-4"
                  />
                </a>
                <a
                  v-if="coachProfile.socialLinks.facebook"
                  :href="coachProfile.socialLinks.facebook"
                  target="_blank"
                  rel="noopener"
                  aria-label="Facebook"
                  class="grid size-9 place-items-center rounded-full border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-primary)] transition-colors hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                >
                  <UIcon
                    name="i-simple-icons-facebook"
                    class="size-4"
                  />
                </a>
                <a
                  v-if="coachProfile.socialLinks.website"
                  :href="coachProfile.socialLinks.website"
                  target="_blank"
                  rel="noopener"
                  aria-label="Site web"
                  class="grid size-9 place-items-center rounded-full border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-primary)] transition-colors hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                >
                  <UIcon
                    name="i-lucide-globe"
                    class="size-4"
                  />
                </a>
              </div>
            </div>
          </div>

          <!-- Bio — right column (generous line-height) -->
          <div class="lg:col-span-7">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.bioEyebrow || 'Qui suis-je' }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.bioTitle || `Votre spécialiste ménopause — ${coachName}` }}
            </h2>

            <p
              v-if="credentialLine"
              class="mt-4 text-base text-[color:var(--color-brand-accent)]"
            >
              {{ credentialLine }}
            </p>

            <!-- Credentials chips (all of them, not just first) -->
            <div
              v-if="coachProfile?.credentials?.length"
              class="mt-6 flex flex-wrap gap-2"
            >
              <span
                v-for="cred in coachProfile.credentials"
                :key="cred.title"
                class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
              >
                <UIcon
                  v-if="cred.verified"
                  name="i-lucide-badge-check"
                  class="size-3.5 text-[color:var(--color-brand-accent)]"
                />
                {{ cred.title }}
              </span>
            </div>

            <div class="mt-8 space-y-5 text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
              <p
                v-for="(paragraph, i) in bioParagraphs"
                :key="i"
              >
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 4. TÉMOIGNAGES (optionnel) ==================== -->
    <div
      id="temoignages"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachTestimonials
        v-if="showTestimonials"
        :testimonials="apiTestimonials"
      >
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

    <!-- ==================== 5. PILIERS — L'accompagnement (optionnel) ==================== -->
    <div
      v-if="showPillars"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachPillars :pillars="coachProfile?.pillarsJson ?? null">
        <template #header>
          <div class="text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.pillarsEyebrow || "L'approche" }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.pillarsTitle || "Les piliers de l'accompagnement" }}
            </h2>
          </div>
        </template>
      </CoachPillars>
    </div>

    <!-- ==================== 6. COMMENT ÇA MARCHE — Le parcours (optionnel) ==================== -->
    <div
      v-if="showHowItWorks"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachHowItWorks :steps="coachProfile?.howItWorksJson ?? null">
        <template #header>
          <div class="mb-12 text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              {{ sectionTitles.howItWorksEyebrow || 'Le parcours' }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.howItWorksTitle || "Comment se déroule l'accompagnement" }}
            </h2>
          </div>
        </template>
      </CoachHowItWorks>
    </div>

    <!-- ==================== 6b. POUR QUI / FIT (optionnel) ==================== -->
    <AtomsCoachFitSection
      v-if="showFit"
    />

    <!-- ==================== 7. TARIFS ==================== -->
    <div
      v-if="showPricing"
      id="tarifs"
      v-bind="reveal()"
      class="scroll-reveal"
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

    <!-- ==================== 8. FAQ (optionnel) ==================== -->
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

    <!-- ==================== 9. CTA FINAL (warm close — secondary CTA, crepuscule bg) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-crepuscule-50)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-3xl leading-tight text-[color:var(--color-brand-primary)] lg:text-4xl">
          Réservez votre séance découverte gratuite
        </h2>

        <p class="mx-auto mt-6 max-w-xl text-base text-[color:var(--color-brand-secondary)]">
          Un premier échange de {{ discoveryDuration }} minutes, gratuit et sans engagement,
          pour définir ensemble vos besoins.
        </p>

        <div class="mt-10 flex flex-col items-center gap-4">
          <UButton
            :to="ctaTo"
            color="secondary"
            variant="solid"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            data-final-cta
          >
            Prendre rendez-vous
          </UButton>

          <!-- Reassurance repeat — same checkmarks as hero for consistency -->
          <div class="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Gratuit
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              Sans engagement
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 text-[color:var(--color-brand-primary)]"
              />
              {{ discoveryDuration }} min
            </span>
          </div>
        </div>

        <p class="mt-8 text-xs text-[color:var(--color-text-muted)]">
          Fuseau horaire : {{ tenant.timezone }}
        </p>
      </div>
    </section>

    <!-- ==================== 10. DISCLAIMER MÉDICAL (toujours visible) ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- Spacer for mobile sticky CTA -->
    <div
      v-if="!previewMode"
      class="h-16 md:hidden"
    />

    <!-- Sticky CTA mobile — hidden in preview mode (Story 0-28). -->
    <StickyCtaMobile
      v-if="!previewMode"
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />
  </div>
</template>

<style scoped>
/*
 * Scroll reveal — visible by default for SSR (no JS = no flash).
 * The .js-scroll-ready class is added by useScrollReveal AFTER it has
 * marked any in-viewport elements as visible, so the hide-by-default
 * CSS only applies once the observer is active.
 *
 * Same pattern as CoachPageSignature for visual consistency between templates.
 */
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
