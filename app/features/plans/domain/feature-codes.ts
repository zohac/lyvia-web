/**
 * Story 18.2 — Miroir frontend du référentiel de codes de features.
 *
 * Source de vérité : `repositories/lyvia-api/src/features/plans/domain/feature-codes.ts`
 * (Story 18.1). Les deux listes doivent rester identiques.
 *
 * ⚠️ Story 18.2 (CR) — cette synchronisation n'est PAS mécanisée, et ne peut
 * pas l'être : API et Web sont deux dépôts Git indépendants, sans dépendance
 * ni build partagé. `tests/plans/feature-gate-domain.test.ts` verrouille la
 * liste côté web contre un littéral, ce qui empêche une dérive ACCIDENTELLE
 * ici — mais un ajout côté backend ne fera échouer aucun test de ce repo. La
 * mise à jour est manuelle et relève de la story qui ajoute la feature.
 *
 * ⚠️ `lead_magnet` est activé pour les 3 plans beta et n'est gaté par AUCUNE
 * surface (réservé au futur plan Découverte) : sa présence dans cette liste est
 * intentionnelle, ce n'est pas du code mort.
 */

export const PLAN_FEATURE_CODES = [
  'custom_domain',
  'white_label_branding',
  'coach_page_premium_templates',
  'lead_magnet'
] as const

export type PlanFeatureCode = (typeof PLAN_FEATURE_CODES)[number]

/**
 * Plan minimum requis par feature, tel qu'affiché dans le panneau de
 * verrouillage (« Disponible avec le plan … »).
 *
 * Beta : la matrice `plan_features` (15-1a) n'active les 3 features gatées que
 * sur Premium et Fondatrice — le plan minimum ACHETABLE est donc Premium pour
 * toutes. `lead_magnet` y figure pour que le `Record` reste exhaustif (le
 * compilateur impose une entrée par code) ; aucune surface ne le gate.
 *
 * Si un futur plan intermédiaire (Découverte) débloque une feature, c'est ici —
 * et ici seulement — que le libellé change.
 */
export const FEATURE_MIN_PLAN_LABEL: Record<PlanFeatureCode, string> = {
  custom_domain: 'Premium',
  white_label_branding: 'Premium',
  coach_page_premium_templates: 'Premium',
  lead_magnet: 'Premium'
}
