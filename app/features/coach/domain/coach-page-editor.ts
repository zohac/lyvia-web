export const COACH_PAGE_ALWAYS_ON_SECTIONS = ['hero', 'disclaimer'] as const

// YB.1.1 — `freeText` est inscrit APRÈS `benefits` : c'est la position
// canonique du bloc sur la page (entre bénéfices et « qui suis-je », AD-7).
// Cette liste est l'inscription n° 2 des cinq exigées par AD-7 — c'est elle qui
// décide si l'éditeur rend un formulaire pour la section.
export const COACH_PAGE_INLINE_EDITOR_SECTIONS = [
  'pillars',
  'faq',
  'benefits',
  'freeText',
  'howItWorks',
  'fit',
  'educationalContent',
  'problemStatement',
  'bio',
  'testimonials'
] as const

export const COACH_PAGE_NESTED_EDITOR_SECTIONS = ['emotionalSupport'] as const

// Story 0-26: bio + testimonials migrated inline. Branding is a global config card,
// not a template-driven page section. Only pricing remains external (separate page for plans tarifaires).
export const COACH_PAGE_EXTERNAL_EDITOR_SECTIONS = {
  pricing: { label: 'Modifiable dans Mes tarifs', to: '/provider/scheduling' }
} as const

export function isCoachPageAlwaysOnSection(section: string): boolean {
  return (COACH_PAGE_ALWAYS_ON_SECTIONS as readonly string[]).includes(section)
}

export function isCoachPageInlineEditorSection(section: string): boolean {
  return (COACH_PAGE_INLINE_EDITOR_SECTIONS as readonly string[]).includes(section)
}

export function isCoachPageNestedEditorSection(section: string): boolean {
  return (COACH_PAGE_NESTED_EDITOR_SECTIONS as readonly string[]).includes(section)
}

export function getCoachPageExternalEditorSection(section: string) {
  return COACH_PAGE_EXTERNAL_EDITOR_SECTIONS[section as keyof typeof COACH_PAGE_EXTERNAL_EDITOR_SECTIONS] ?? null
}

export function getCoachPageConfigurableSections(availableSections: readonly string[]): string[] {
  return availableSections.filter(section => !isCoachPageNestedEditorSection(section))
}

export function getCoachPageEditableSections(availableSections: readonly string[]): string[] {
  return getCoachPageConfigurableSections(availableSections)
    .filter(section => !isCoachPageAlwaysOnSection(section))
}

export function supportsEmotionalSupportSection(availableSections: readonly string[]): boolean {
  return availableSections.includes('emotionalSupport')
}

/**
 * YB.1.1 — Présence RÉELLE de contenu dans le bloc de texte libre.
 *
 * Source UNIQUE de la règle, partagée par `CoachFreeText.vue` (qui s'y rend
 * lui-même) et par les trois templates, dont le `<div>` enveloppant en dépend :
 * un bloc allumé mais vide laisserait sinon une bande de surface vide
 * (`bg-surface-card px-6 py-24`) sur la page publique.
 *
 * `useCoachSectionVisibility` reste le SEUL propriétaire de la règle de
 * visibilité (toggle seul, AD-7) : ceci est un prédicat de CONTENU, pas une
 * seconde règle de visibilité.
 *
 * Même convention que le rendu : un titre ou un paragraphe composé de blancs
 * ne compte pas.
 */
export function hasCoachFreeTextContent(
  freeText: { title?: string, paragraphs?: readonly string[] } | null | undefined
): boolean {
  if (!freeText) return false
  if (freeText.title?.trim()) return true
  return (freeText.paragraphs ?? []).some(paragraph => !!paragraph?.trim())
}

/**
 * Toast à afficher après un échec de changement de template.
 *
 * `null` = NE RIEN AFFICHER : un toast global a déjà été émis en amont.
 *
 * 🚨 CR 18.3b — `FEATURE_NOT_AVAILABLE` est le code que renvoie RÉELLEMENT le
 * gating 18.3a sur un template premium (et non `TEMPLATE_NOT_AVAILABLE`).
 * `apiFetch` déclenche déjà pour lui le toast global 18.2 « Cette fonctionnalité
 * nécessite un plan supérieur » + CTA, puis relance l'erreur : sans ce cas, on
 * empilait un second toast générique « Erreur lors du changement de template ».
 * Pire, la garde anti-spam 3 s de 18.2 pouvait absorber le toast INFORMATIF au
 * 2ᵉ clic et ne laisser que le générique.
 */
export function getCoachPageTemplateSaveErrorToast(
  errorCode?: string
): { title: string, description?: string } | null {
  if (errorCode === 'FEATURE_NOT_AVAILABLE') return null

  if (errorCode === 'TEMPLATE_NOT_AVAILABLE') {
    return {
      title: 'Ce template n\'est pas disponible pour votre compte',
      description: 'Contactez l\'équipe Keova pour y accéder.'
    }
  }

  return {
    title: 'Erreur lors du changement de template'
  }
}
