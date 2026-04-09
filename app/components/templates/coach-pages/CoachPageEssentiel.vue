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
}>()

// --- Hide the global PublicHeader — Essentiel owns its own header ---
// Uses the parallel pattern of `hide-layout-footer` already present in public.vue.
const hideLayoutHeader = useState('hide-layout-header', () => false)
hideLayoutHeader.value = true
onBeforeUnmount(() => {
  hideLayoutHeader.value = false
})

// --- Section visibility (P-Y3 via composable partagé YC2.3) ---
const { show } = useCoachSectionVisibility(() => props.coachProfile)

// --- Scroll reveal (SSR-safe — visible by default, hidden only after JS) ---
const { reveal, isReady } = useScrollReveal()

const showBenefits = show.benefits
const showPillars = show.pillars
const showHowItWorks = show.howItWorks
const showTestimonials = show.testimonials
const showFaq = show.faq

// --- Derived data ---

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)

// --- Header navigation links (anchor scroll) ---
const navLinks = computed(() => {
  const links: { label: string, href: string }[] = []
  if (showBenefits.value) links.push({ label: 'Accompagnement', href: '#accompagnement' })
  links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  if (hasPricing.value) links.push({ label: 'Tarifs', href: '#tarifs' })
  if (showTestimonials.value) links.push({ label: 'Témoignages', href: '#temoignages' })
  return links
})

const hasPricing = computed(() => props.consultationPlans.length > 0 || props.publicPrograms.length > 0)

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

const apiTestimonials = computed(() => props.coachProfile?.testimonialsJson ?? [])

// FAQ items (same mapping as Signature)
const faqItems = computed<AccordionItem[]>(() => {
  const api = props.coachProfile?.faqJson
  if (!api?.length) return []
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
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  heroPhotoUrl: props.coachProfile?.heroImageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
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

    <!-- ==================== 2. À PROPOS (crepuscule-50 bg — rupture visuelle "preuve") ==================== -->
    <section
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
              Qui suis-je
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Votre spécialiste ménopause — {{ coachName }}
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
              <template v-if="bioParagraphs.length">
                <p
                  v-for="(paragraph, i) in bioParagraphs"
                  :key="i"
                >
                  {{ paragraph }}
                </p>
              </template>
              <template v-else>
                <p>
                  Spécialiste en accompagnement bien-être, je propose un suivi personnalisé
                  et adapté à chaque étape de votre parcours.
                </p>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 3. BÉNÉFICES (optionnel) ==================== -->
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
              Ce que l'accompagnement apporte
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Un parcours adapté
            </h2>
          </div>
        </template>
      </CoachTransformationBenefits>
    </div>

    <!-- ==================== 4. PILIERS (optionnel) ==================== -->
    <div
      v-if="showPillars"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachPillars :pillars="coachProfile?.pillarsJson ?? null">
        <template #header>
          <div class="text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              L'approche
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Les piliers de l'accompagnement
            </h2>
          </div>
        </template>
      </CoachPillars>
    </div>

    <!-- ==================== 5. COMMENT ÇA MARCHE (optionnel) ==================== -->
    <div
      v-if="showHowItWorks"
      v-bind="reveal()"
      class="scroll-reveal"
    >
      <CoachHowItWorks :steps="coachProfile?.howItWorksJson ?? null">
        <template #header>
          <div class="mb-12 text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              Le parcours
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Comment se déroule l'accompagnement
            </h2>
          </div>
        </template>
      </CoachHowItWorks>
    </div>

    <!-- ==================== 6. TÉMOIGNAGES (optionnel) ==================== -->
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
              Témoignages
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Ce qu'elles en disent
            </h2>
          </div>
        </template>
      </CoachTestimonials>
    </div>

    <!-- ==================== 7. TARIFS ==================== -->
    <div
      id="tarifs"
      v-bind="reveal()"
      class="scroll-reveal"
    >
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
          <div class="text-center">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--color-brand-primary)]">
              Tarifs
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              Tarifs des séances
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
            Questions fréquentes
          </span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)]">
            Questions fréquentes sur l'accompagnement
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
    <div class="h-16 md:hidden" />

    <StickyCtaMobile
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
