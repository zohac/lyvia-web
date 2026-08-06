/**
 * Story 18.2 — Slugs de plans, source unique côté web.
 *
 * Déplacé depuis `app/features/admin/providers/plan-select.ts` (Story 15-5),
 * qui le re-exporte pour ne casser aucun call-site : la doctrine « never
 * redeclare » de ce fichier est respectée par le déplacement, pas contournée.
 *
 * Aligné sur `plans/domain/plan-slugs.ts` côté API
 * (`essentiel` | `premium` | `fondatrice`).
 */

export type PlanSlug = 'essentiel' | 'premium' | 'fondatrice'
