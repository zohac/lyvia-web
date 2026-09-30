<script setup lang="ts">
/**
 * CoachPageAlba — Racine de composition du quatrième template « Alba »
 * (YB.1.2, code `visuel-portrait`).
 *
 * AD-5 — un template est une RACINE DE COMPOSITION : ce fichier réimporte les
 * composants existants et n'en réécrit aucun. Aucune section n'est
 * réimplémentée ici, et la création d'Alba n'a modifié AUCUN fichier d'un
 * template existant — le bloc photo et le header lui sont propres parce que
 * les leurs n'ont pas de version partageable (AD-6), pas parce qu'ils
 * auraient été factorisés.
 *
 * AD-6 — les sections disponibles d'Alba sont CELLES de `visuel`
 * (`visuelSectionsAvailable`, treize entrées) : même famille, même densité de
 * contenu, même hero portrait. Le catalogue est en base ; ce fichier rend
 * simplement ce que ces sections décrivent.
 *
 * AD-7 / YB.1.1 — le bloc de texte libre est rendu à la POSITION CANONIQUE,
 * entre les bénéfices et « qui suis-je », comme sur les trois autres
 * templates. Il est né partagé : `CoachFreeText` porte le contenu, l'appelant
 * porte la surface (AD-9). D'où le `showFreeText` qui gate sur le toggle ET
 * sur le contenu — la surface ne doit pas exister pour un bloc vide, et le
 * composant porte le même garde pour son propre rendu. Aucun lien d'ancre :
 * une ancre vers une section conditionnelle est un lien mort.
 *
 * Les sections `header`, `hero`, `bio`, `faq` et `ctaFinal` restent
 * volontairement NON PARTAGÉES (AD-5) : comme Essentiel et Signature, Alba
 * les rend dans sa propre racine.
 *
 * Règle de visibilité : toggle actif (`sectionsConfig[section] !== false`) ET
 * contenu non vide. `pricing` est le seul cas particulier : la carte appel
 * découverte gratuit est toujours présente, donc son drapeau suffit.
 */
import type { AccordionItem } from '@nuxt/ui'

import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { useCoachSectionVisibility } from '~/composables/useCoachSectionVisibility'
import { hasCoachFreeTextContent } from '~/features/coach/domain/coach-page-editor'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachAlbaHeader from '~/components/templates/coach-pages/alba/CoachAlbaHeader.vue'
import CoachAlbaHero from '~/components/templates/coach-pages/alba/CoachAlbaHero.vue'
import CoachTransformationBenefits from '~/components/organisms/CoachTransformationBenefits.vue'
import CoachFreeText from '~/components/organisms/CoachFreeText.vue'
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
  previewMode?: boolean
}>()

// --- Hide the global PublicHeader — Alba owns its own header ---
// Le même état que Visuel et Essentiel : sans cela, la page afficherait le
// header global AU-DESSUS du header interne d'Alba.
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

// --- Scroll reveal (SSR-safe — visible by défaut, masqué qu'après hydratation) ---
const { reveal, isReady } = useScrollReveal({ disabled: props.previewMode })

const showProblemStatement = show.problemStatement
const showBenefits = show.benefits
// YB.1.1 — le toggle décide de l'intention, le CONTENU décide de
// l'existence : sans ce second terme, un bloc allumé mais vide laisserait une
// bande de surface vide (`px-6 py-24`) sur la page. Le composant
// `CoachFreeText` porte le même garde pour son propre rendu.
const showFreeText = computed(() =>
  show.freeText.value && hasCoachFreeTextContent(props.coachProfile?.freeTextJson)
)
const showBio = show.bio
const showPillars = show.pillars
const showHowItWorks = show.howItWorks
const showTestimonials = show.testimonials
const showFit = show.fit
const showFaq = show.faq
const showPricingToggle = computed(() => isToggleOn('pricing'))
const showPricing = computed(() => showPricingToggle.value)

// --- Données dérivées ---
const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)
const problemStatement = computed(() => props.coachProfile?.problemStatementJson ?? null)
const sectionTitles = computed(() => props.coachProfile?.sectionTitlesJson ?? {})

const credentialLine = computed(() => {
  const creds = props.coachProfile?.credentials ?? []
  const parts: string[] = []
  if (creds.length && creds[0]?.title) parts.push(creds[0].title)
  if (props.coachProfile?.city) parts.push(props.coachProfile.city)
  return parts.join(' · ')
})

const bioParagraphs = computed<string[]>(() => {
  const longBio = props.coachProfile?.longBio
  if (longBio) return longBio.split('\n\n').filter(Boolean)
  const bio = props.coachProfile?.bio
  if (bio) return [bio]
  return []
})

// --- Ancres du header interne ---
// Le bloc libre en est VOLONTAIREMENT absent : il n'a pas d'ancre, sur aucun
// template, parce qu'une ancre vers une section conditionnelle est un lien mort.
const navLinks = computed(() => {
  const links: { label: string, href: string }[] = []
  if (showBenefits.value) links.push({ label: 'Accompagnement', href: '#accompagnement' })
  if (showBio.value) links.push({ label: 'Qui suis-je', href: '#qui-suis-je' })
  if (showPillars.value) links.push({ label: 'Approche', href: '#approche' })
  if (showHowItWorks.value) links.push({ label: 'Parcours', href: '#parcours' })
  if (showTestimonials.value) links.push({ label: 'Témoignages', href: '#temoignages' })
  if (showPricing.value) links.push({ label: 'Tarifs', href: '#tarifs' })
  return links
})

// --- Contenus de repli (mêmes textes que Visuel et Essentiel) ---
const FALLBACK_TESTIMONIALS = [
  { quote: 'Un accompagnement précis qui m\'a permis de retrouver le sommeil et de comprendre mon corps.', firstName: 'Nathalie', age: 52, rating: 5 },
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

const faqItems = computed<AccordionItem[]>(() => {
  const api = props.coachProfile?.faqJson?.length ? props.coachProfile.faqJson : FALLBACK_FAQ
  return api.map((item, i) => ({
    label: item.label,
    content: item.content,
    value: `faq-${i + 1}`
  }))
})

// FAQ SSR : tous les items ouverts côté serveur, fermés après hydratation
// (référencement).
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

// --- Props du hero ---
// Le hero d'Alba n'a pas de champ `heroImageDisabled` : c'est le drapeau du
// hero immersif de Visuel (AD-6), et le hero d'Alba est plat.
const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: props.coachProfile?.heroHeadline ?? null,
  heroDescription: props.coachProfile?.heroDescription ?? null,
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl
    ? `${coachName.value}, spécialiste accompagnement ménopause`
    : null,
  discoveryDurationMinutes: props.coachProfile?.discoveryDurationMinutes ?? 15,
  urgencyText: props.coachProfile?.urgencyText ?? null,
  ctaTo: props.ctaTo,
  specialties: props.coachProfile?.specialties ?? []
}))
</script>

<template>
  <div
    class="min-h-screen bg-[color:var(--color-surface-card)] text-[color:var(--color-text-primary)]"
    :class="{ 'js-scroll-ready': isReady }"
  >
    <!-- ==================== 0. HEADER ==================== -->
    <CoachAlbaHeader
      :coach-name="coachName"
      :nav-links="navLinks"
      cta-label="Réserver"
      :cta-to="ctaTo"
      login-to="/login"
      :is-authenticated="isAuthenticated"
    />

    <!-- ==================== 1. HERO ==================== -->
    <!-- `showBio` est passé pour que l'ancre secondaire `#qui-suis-je` du hero
         n'apparaisse que si sa cible est rendue — même interrupteur que celui
         qui porte le lien du header ci-dessus. -->
    <CoachAlbaHero
      v-bind="heroProps"
      :show-bio="showBio"
    />

    <!-- ==================== 2. PROBLÈME (optionnel) ==================== -->
    <section
      v-if="showProblemStatement"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
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

        <p
          v-if="problemStatement?.blockquote"
          class="font-serif text-[clamp(1.25rem,3vw,1.75rem)] leading-[1.4] text-[color:var(--color-text-primary)]"
        >
          {{ problemStatement.blockquote }}
        </p>

        <div
          v-if="problemStatement?.paragraphs?.length"
          class="mt-10 space-y-6"
        >
          <p
            v-for="(paragraph, i) in problemStatement.paragraphs"
            :key="i"
            class="text-lg leading-relaxed text-[color:var(--color-crepuscule-700)]"
          >
            {{ paragraph }}
          </p>
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
              {{ sectionTitles.benefitsEyebrow || "Ce que l'accompagnement apporte" }}
            </span>
            <h2 class="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
              {{ sectionTitles.benefitsTitle || 'Un parcours adapté' }}
            </h2>
          </div>
        </template>
      </CoachTransformationBenefits>
    </div>

    <!-- ==================== 3 bis. BLOC DE TEXTE LIBRE (optionnel) ==================== -->
    <!-- YB.1.2 — POSITION CANONIQUE : entre bénéfices et « qui suis-je », la
      même que sur les trois autres templates. Composant né partagé (AD-5) :
      il porte le contenu, l'appelant porte la surface (AD-9) — et c'est
      pourquoi l'appelant se gate aussi sur `showFreeText` (toggle ET
      contenu) : la surface ne doit pas exister pour un bloc vide. Aucun lien
      d'ancre. -->
    <div
      v-if="showFreeText"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <CoachFreeText :free-text="coachProfile?.freeTextJson ?? null" />
    </div>

    <!-- ==================== 4. QUI SUIS-JE (optionnel) ==================== -->
    <section
      v-if="showBio"
      id="qui-suis-je"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-crepuscule-50)] px-6 py-20 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-5xl">
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

        <div class="mt-8 space-y-5 text-base leading-relaxed text-[color:var(--color-crepuscule-700)]">
          <p
            v-for="(paragraph, i) in bioParagraphs"
            :key="i"
          >
            {{ paragraph }}
          </p>
        </div>

        <p
          v-if="coachProfile?.city"
          class="mt-8 flex items-center gap-2 text-sm text-[color:var(--color-brand-secondary)]"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-4 text-[color:var(--color-brand-accent)]"
          />
          <span>
            {{ coachProfile.city }}<template v-if="coachProfile.region"> · {{ coachProfile.region }}</template>
          </span>
        </p>
      </div>
    </section>

    <!-- ==================== 5. TÉMOIGNAGES (optionnel) ==================== -->
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

    <!-- ==================== 6. PILIERS (optionnel) ==================== -->
    <div
      v-if="showPillars"
      id="approche"
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
              {{ sectionTitles.pillarsTitle || 'Les piliers de l\'accompagnement' }}
            </h2>
          </div>
        </template>
      </CoachPillars>
    </div>

    <!-- ==================== 7. PARCOURS (optionnel) ==================== -->
    <div
      v-if="showHowItWorks"
      id="parcours"
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

    <!-- ==================== 7 bis. POUR QUI / FIT (optionnel) ==================== -->
    <AtomsCoachFitSection
      v-if="showFit"
      :items="coachProfile?.fitJson?.items"
      :eyebrow="coachProfile?.fitJson?.eyebrow"
      :title="coachProfile?.fitJson?.title"
    />

    <!-- ==================== 8. TARIFS (optionnel) ==================== -->
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

    <!-- ==================== 9. FAQ (optionnel) ==================== -->
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
            <div class="space-y-3 pb-3.5 text-sm text-[color:var(--color-crepuscule-700)]">
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

    <!-- ==================== 10. CTA FINAL (toujours visible) ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-crepuscule-50)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-3xl leading-tight text-[color:var(--color-brand-primary)] lg:text-4xl">
          Réservez votre séance découverte gratuite
        </h2>

        <p class="mx-auto mt-6 max-w-xl text-base text-[color:var(--color-crepuscule-700)]">
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

    <!-- ==================== 11. DISCLAIMER MÉDICAL (toujours visible) ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- Spacer for mobile sticky CTA -->
    <div
      v-if="!previewMode"
      class="h-16 md:hidden"
    />

    <StickyCtaMobile
      v-if="!previewMode"
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />
  </div>
</template>

<style scoped>
/*
 * Scroll reveal — même contrat que les trois autres templates : visible par
 * défaut au rendu serveur, masqué seulement une fois l'observateur actif. Le
 * panneau d'aperçu a son propre conteneur de défilement, d'où l'opt-out en
 * `previewMode`.
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
