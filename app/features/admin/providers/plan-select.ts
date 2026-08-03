/**
 * Story 15-5 — Source unique des items du sélecteur de plan admin.
 *
 * Consommé par `AdminProviderCreateDrawer.vue` (drawer de création), par
 * `app/pages/admin/providers/[id].vue` (section « Plan d'abonnement ») et par
 * les tests. Ne jamais redéclarer ces libellés ni ces slugs ailleurs.
 *
 * Les slugs sont alignés sur `plans/domain/plan-slugs.ts` côté API
 * (`essentiel` | `premium` | `fondatrice`).
 */

export type PlanSlug = 'essentiel' | 'premium' | 'fondatrice'

/**
 * ⚠️ Aucune valeur vide : un `USelect` Reka UI avec `value: ''` crash
 * (bug historique admin/clients, commit 77ac4d7).
 *
 * Type volontairement mutable : `USelect :items` de Nuxt UI v4 n'accepte pas
 * un `readonly T[]` (`ArrayOrNested<SelectItem>` est mutable).
 */
export const PLAN_SELECT_ITEMS: Array<{ label: string, value: PlanSlug }> = [
  { label: 'Essentiel', value: 'essentiel' },
  { label: 'Premium', value: 'premium' },
  { label: 'Fondatrice', value: 'fondatrice' }
]

/** Plan par défaut à la création, et valeur d'amorçage avant hydratation. */
export const DEFAULT_PLAN_SLUG: PlanSlug = 'essentiel'

export type PlanBadgeVariant = 'success' | 'error' | 'warning' | 'neutral'

/**
 * Variante de badge du plan courant, à passer à `getStatusBadgeClasses()`.
 * Tout slug inconnu retombe sur `neutral` (jamais d'exception côté rendu).
 */
export function getPlanBadgeVariant(slug: string | null | undefined): PlanBadgeVariant {
  switch (slug) {
    case 'fondatrice': return 'warning'
    case 'premium': return 'success'
    default: return 'neutral'
  }
}
