/**
 * Story 18.3b — Verrouillage par carte du sélecteur de template coach.
 *
 * Module PUR (aucun import Nuxt, aucun import runtime Vue) : couvert par
 * `tsconfig.tests.json` via le glob `app/features/plans/domain/**` déjà présent,
 * et testé unitairement par `tests/plans/template-lock.test.ts`.
 *
 * ⚠️ Pourquoi un verrouillage CARTE PAR CARTE et non un `<FeatureGate>` de
 * section, contrairement à « Identité de marque » ? Le sélecteur mélange le
 * template Standard — toujours accessible, exigence PRD — et d'éventuels
 * templates premium. Envelopper la section entière bloquerait aussi le Standard.
 */

import type { FeatureGateStatus } from '../createFeatureGate'
import {
  FEATURE_COACH_PAGE_PREMIUM_TEMPLATES,
  FEATURE_MIN_PLAN_LABEL
} from './feature-codes'

/**
 * Code du seul template ouvert à tous les plans.
 *
 * Miroir de `ESSENTIEL_TEMPLATE_CODE`
 * (`lyvia-api/src/features/providers/infrastructure/coach-page-seed.ts`), lu
 * par le gating backend 18.3a.
 *
 * ⚠️ Deux homonymes à ne pas confondre — il s'agit ici d'un CODE DE TEMPLATE
 * (`coach_page_templates.code`), et non du SLUG DE PLAN `essentiel`
 * (`subscription_plans.slug`, cf. `plan-slugs.ts`).
 *
 * ⚠️ Volontairement PAS `DEFAULT_COACH_TEMPLATE_CODE`
 * (`~/composables/coach-template-registry`) : cette constante-là désigne le
 * template de REPLI AU RENDU. Les deux valent `'essentiel'` aujourd'hui par
 * coïncidence ; les réunir ferait qu'un changement de template par défaut
 * ouvrirait le gating en silence.
 */
export const ESSENTIEL_TEMPLATE_CODE = 'essentiel'

/**
 * Libellé de la pastille de verrouillage — « Premium » (Convention A31).
 *
 * Dérivé de la copy 18.2 : si un futur plan intermédiaire débloque les
 * templates premium, seul `FEATURE_MIN_PLAN_LABEL` change.
 */
export const PREMIUM_TEMPLATE_BADGE_LABEL
  = FEATURE_MIN_PLAN_LABEL[FEATURE_COACH_PAGE_PREMIUM_TEMPLATES]

/**
 * `true` si la carte doit être présentée verrouillée (désactivée + pastille).
 *
 * Règle miroir du backend 18.3a : « tout code différent d'`essentiel` », et non
 * une liste blanche — l'admin peut créer d'autres codes
 * (`POST /admin/coach-page-templates`) qu'une liste en dur ouvrirait.
 */
export function isTemplateLocked(
  tmpl: { code: string },
  hasPremiumTemplates: boolean
): boolean {
  return tmpl.code !== ESSENTIEL_TEMPLATE_CODE && !hasPremiumTemplates
}

/**
 * Politique d'accès aux templates premium selon l'état du gate.
 *
 * `unknown` → présumé OUVERT. C'est une divergence ASSUMÉE avec le deny par
 * défaut de `<FeatureGate>`, exigée par l'AC #2 : verrouiller pendant la
 * résolution produirait un flash lock→unlock à chaque chargement de l'éditeur.
 * La fenêtre est de quelques dizaines de ms (nulle après le premier chargement,
 * grâce au cache de session 18.2), et le vrai garde reste le backend 18.3a — un
 * clic pendant la fenêtre reçoit un 403 + le toast global.
 *
 * `error` → refusé, comme `<FeatureGate>` : une panne de résolution ne doit pas
 * ouvrir une surface premium.
 */
export function resolvePremiumTemplatesAccess(
  status: FeatureGateStatus,
  hasPremiumTemplatesFeature: boolean
): boolean {
  if (status === 'unknown') return true
  return hasPremiumTemplatesFeature
}
