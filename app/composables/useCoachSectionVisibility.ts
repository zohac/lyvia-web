/**
 * useCoachSectionVisibility — Règle P-Y3 partagée (YC2.3).
 *
 * Centralise la logique de visibilité des sections configurables des
 * templates coach (Signature, Essentiel, futurs templates). Une section
 * est visible UNIQUEMENT si :
 *   1. son toggle `sectionsConfig[section]` n'est pas explicitement `false`
 *   2. ET son contenu backing JSONB est non vide.
 *
 * Les sections `hero`, `CTA final` et `disclaimer` ne sont jamais gérées
 * ici — elles sont toujours visibles, au choix du template.
 *
 * Factorisation F1 des retros YC2.1 (DRY A25 + F2 du CR).
 *
 * Utilisation :
 *   const { show, isToggleOn, has } = useCoachSectionVisibility(coachProfile)
 *   // show.benefits, show.pillars, show.howItWorks, show.educationalContent,
 *   // show.problemStatement, show.faq, show.miniTestimonial
 */
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'

export type CoachConfigurableSection
  = | 'benefits'
    | 'pillars'
    | 'howItWorks'
    | 'educationalContent'
    | 'problemStatement'
    | 'faq'
    | 'miniTestimonial'
    | 'testimonials'
    | 'bio'
    | 'pricing' // Story 0-26 round terrain — toggle pricing doit gater l'affichage public

export interface CoachSectionVisibility {
  /** Chaque drapeau `show*` combine toggle actif ET contenu non vide (P-Y3). */
  show: {
    bio: ComputedRef<boolean>
    benefits: ComputedRef<boolean>
    pillars: ComputedRef<boolean>
    howItWorks: ComputedRef<boolean>
    educationalContent: ComputedRef<boolean>
    problemStatement: ComputedRef<boolean>
    faq: ComputedRef<boolean>
    miniTestimonial: ComputedRef<boolean>
    testimonials: ComputedRef<boolean>
  }
  /** Lecture isolée du toggle `sectionsConfig[section]`. Toggle absent → `true`. */
  isToggleOn: (section: CoachConfigurableSection) => boolean
  /** Présence réelle du contenu JSONB, ignore le toggle. */
  has: {
    bio: ComputedRef<boolean>
    benefits: ComputedRef<boolean>
    pillars: ComputedRef<boolean>
    howItWorks: ComputedRef<boolean>
    educationalContent: ComputedRef<boolean>
    problemStatement: ComputedRef<boolean>
    faq: ComputedRef<boolean>
    testimonials: ComputedRef<boolean>
  }
}

type ProfileSource = MaybeRefOrGetter<PublicProviderProfile | null | undefined>

export function useCoachSectionVisibility(source: ProfileSource): CoachSectionVisibility {
  const profile = computed<PublicProviderProfile | null>(() => toValue(source) ?? null)

  function isToggleOn(section: CoachConfigurableSection): boolean {
    const config = profile.value?.sectionsConfig
    if (!config) return true
    return config[section] !== false
  }

  // --- Content presence (ignore le toggle) ---

  const hasBio = computed(() => {
    const longBio = profile.value?.longBio
    if (longBio && longBio.trim().length > 0) return true
    const bio = profile.value?.bio
    return !!(bio && bio.trim().length > 0)
  })

  const hasBenefits = computed(() => {
    const b = profile.value?.benefitsJson
    return !!(b && Array.isArray(b.items) && b.items.length > 0)
  })

  const hasPillars = computed(() => {
    const p = profile.value?.pillarsJson
    return !!(p && Array.isArray(p.items) && p.items.length > 0)
  })

  const hasHowItWorks = computed(() => {
    const steps = profile.value?.howItWorksJson
    return !!(steps && Array.isArray(steps) && steps.length > 0)
  })

  const hasEducationalContent = computed(() => {
    const c = profile.value?.educationalContentJson
    return !!(c && Array.isArray(c.paragraphs) && c.paragraphs.length > 0)
  })

  const hasProblemStatement = computed(() => {
    const p = profile.value?.problemStatementJson
    return !!(p && typeof p.blockquote === 'string' && p.blockquote.trim().length > 0)
  })

  const hasFaq = computed(() => {
    const faq = profile.value?.faqJson
    return !!(faq && Array.isArray(faq) && faq.length > 0)
  })

  const hasTestimonials = computed(() => {
    const t = profile.value?.testimonialsJson
    return !!(t && Array.isArray(t) && t.length > 0)
  })

  // --- Visibility = toggle AND content non-empty (P-Y3) ---

  const showBio = computed(() => isToggleOn('bio') && hasBio.value)
  const showBenefits = computed(() => isToggleOn('benefits') && hasBenefits.value)
  const showPillars = computed(() => isToggleOn('pillars') && hasPillars.value)
  const showHowItWorks = computed(() => isToggleOn('howItWorks') && hasHowItWorks.value)
  const showEducationalContent = computed(() => isToggleOn('educationalContent') && hasEducationalContent.value)
  const showProblemStatement = computed(() => isToggleOn('problemStatement') && hasProblemStatement.value)
  const showFaq = computed(() => isToggleOn('faq') && hasFaq.value)
  const showMiniTestimonial = computed(() => isToggleOn('miniTestimonial') && hasTestimonials.value)
  const showTestimonials = computed(() => isToggleOn('testimonials') && hasTestimonials.value)

  return {
    show: {
      bio: showBio,
      benefits: showBenefits,
      pillars: showPillars,
      howItWorks: showHowItWorks,
      educationalContent: showEducationalContent,
      problemStatement: showProblemStatement,
      faq: showFaq,
      miniTestimonial: showMiniTestimonial,
      testimonials: showTestimonials
    },
    isToggleOn,
    has: {
      bio: hasBio,
      benefits: hasBenefits,
      pillars: hasPillars,
      howItWorks: hasHowItWorks,
      educationalContent: hasEducationalContent,
      problemStatement: hasProblemStatement,
      faq: hasFaq,
      testimonials: hasTestimonials
    }
  }
}
