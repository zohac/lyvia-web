/**
 * Libellés des sections éditables de la page coach.
 *
 * SOURCE UNIQUE (TF.1). Cette table vivait dans `coach-page.vue` ; extraire la
 * carte externe sans la partager aurait créé deux copies à faire dériver
 * ensemble à chaque révision de libellé — exactement ce que la revue TF.1 a
 * trouvé (deux tables byte-identiques, dont la copie du composant n'était
 * atteignable que pour `pricing`).
 *
 * LAB-R15 (rétro epic-lab, F15) — le libellé nomme ce que le toggle couvre
 * RÉELLEMENT. Décision PO du 2026-10-30 : `show.certifications` gate la
 * **section liste** (« Parcours & qualifications »), pas la plaque de mise en
 * avant du hero (`CoachFeaturedCredential`), qui a son propre opt-in — la
 * certification marquée « mise en avant » dans l'éditeur. Un libellé
 * « Diplômes & certifications » promettait les deux.
 */
export const COACH_PAGE_SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (en-tête)',
  bio: 'Qui suis-je',
  certifications: 'Section Parcours & qualifications',
  benefits: 'Bénéfices',
  freeText: 'Bloc de texte libre',
  pillars: 'Piliers',
  howItWorks: 'Comment ça marche',
  fit: 'Pour qui / Adéquation',
  educationalContent: 'Contenu éducatif',
  problemStatement: 'Énoncé du problème',
  faq: 'Questions fréquentes',
  testimonials: 'Témoignages',
  pricing: 'Tarifs',
  disclaimer: 'Disclaimer médical',
  branding: 'Identité affichée dans vos emails'
}

/** Libellé d'une section, avec repli sur le code brut (sections futures). */
export function sectionLabel(section: string): string {
  return COACH_PAGE_SECTION_LABELS[section] ?? section
}
