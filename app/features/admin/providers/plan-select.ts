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

import type { StatusBadgeVariant } from '~/composables/useAdminBadges'
import type { PlanSlug } from '~/features/plans/domain/plan-slugs'

/**
 * Story 18.2 — `PlanSlug` a migré vers `features/plans/domain/plan-slugs.ts`
 * (partagé avec le feature gating provider). Re-exporté ici pour ne casser
 * aucun call-site admin : la doctrine « never redeclare » ci-dessus reste
 * intacte — le type n'existe toujours qu'à UN endroit.
 */
export type { PlanSlug }

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

/**
 * Réexport du type réel attendu par `getStatusBadgeClasses()`.
 *
 * CR 15-5 — c'était auparavant une union redéclarée à l'identique. Un alias
 * local se désynchronise silencieusement : retirer ou renommer une variante
 * dans `STATUS_BADGE_VARIANTS` continuait de typechecker ici, et le lookup
 * `STATUS_BADGE_VARIANTS[variant].badge` explosait au rendu. En important le
 * type source, la même modification devient une erreur de compilation.
 */
export type PlanBadgeVariant = StatusBadgeVariant

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
