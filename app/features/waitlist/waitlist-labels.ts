/**
 * Libellés des champs de la demande d'accès.
 *
 * Source unique : le formulaire public (`WaitlistForm.vue`) et le panneau admin
 * (`AdminWaitlistPanel.vue`) doivent afficher exactement les mêmes libellés —
 * les dupliquer avait déjà produit deux variantes du domaine yoga.
 */
export const SPECIALTY_LABELS: Record<string, string> = {
  'naturopathie': 'Naturopathie',
  'sophrologie': 'Sophrologie',
  'coaching-bien-etre': 'Coaching bien-être',
  'hypnose': 'Hypnose',
  'yoga-meditation': 'Yoga & Méditation',
  'nutrition': 'Nutrition',
  'autre': 'Autre'
}

export const ACTIVITY_STAGE_LABELS: Record<string, string> = {
  'preparation-lancement': 'Je prépare mon lancement',
  'lancement-recent': 'Je viens de me lancer',
  'structuration': 'Mon activité existe déjà et je la structure',
  'bien-installee': 'Mon activité est déjà bien installée'
}

export const MAIN_BLOCKER_LABELS: Record<string, string> = {
  'creer-site': 'Créer ou terminer mon site',
  'organiser-reservations': 'Organiser mes réservations',
  'gerer-paiements': 'Gérer les paiements',
  'suivre-clients': 'Suivre mes clientes',
  'trop-outils': 'Trop d\'outils différents',
  'partie-technique': 'La partie technique en général',
  'autre': 'Autre'
}

export const DISCOVERY_SOURCE_LABELS: Record<string, string> = {
  'recommandation': 'Une formatrice / une recommandation',
  'autre-praticienne': 'Une autre praticienne',
  'google': 'Google',
  'reseaux-sociaux': 'Réseaux sociaux',
  'autre': 'Autre'
}

/**
 * Libellé d'une valeur de qualification, `fallback` si la valeur est absente
 * (ces trois champs sont nullables côté API depuis LB.1).
 */
export function qualificationLabel(
  labels: Record<string, string>,
  value: string | null | undefined,
  fallback = '—'
): string {
  if (!value) return fallback
  return labels[value] ?? value
}

/** Options `{ value, label }` pour un `USelect` à partir des valeurs backend. */
export function toWaitlistOptions(
  values: readonly string[],
  labels: Record<string, string>
): Array<{ value: string, label: string }> {
  return values.map(value => ({ value, label: labels[value] ?? value }))
}
