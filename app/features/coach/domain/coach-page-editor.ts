export const COACH_PAGE_ALWAYS_ON_SECTIONS = ['hero', 'disclaimer'] as const

export const COACH_PAGE_INLINE_EDITOR_SECTIONS = [
  'pillars',
  'faq',
  'benefits',
  'howItWorks',
  'educationalContent',
  'problemStatement',
  'bio',
  'testimonials',
  'branding'
] as const

export const COACH_PAGE_NESTED_EDITOR_SECTIONS = ['emotionalSupport'] as const

// Story 0-26: bio + testimonials migrated inline. Only pricing remains external (separate page for plans tarifaires).
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

export function getCoachPageTemplateSaveErrorToast(errorCode?: string) {
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
