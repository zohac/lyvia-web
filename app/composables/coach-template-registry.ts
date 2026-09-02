/**
 * coach-template-registry — Logique PURE de résolution de templateCode.
 *
 * Séparé de `useCoachPageTemplate.ts` (qui embarque `defineAsyncComponent`
 * et les imports `.vue`) pour permettre les tests unitaires sans runtime
 * Vue ni résolution d'alias `~/`.
 *
 * Toute modification ici doit rester synchronisée avec `TEMPLATE_MAP` dans
 * `useCoachPageTemplate.ts` (garanti par `SUPPORTED_COACH_TEMPLATE_CODES`).
 */

/** Codes de template supportés par `useCoachPageTemplate`. */
export type CoachTemplateCode = 'signature' | 'essentiel' | 'visuel'

/** Code utilisé comme fallback quand le templateCode est inconnu ou absent. */
export const DEFAULT_COACH_TEMPLATE_CODE: CoachTemplateCode = 'essentiel'

/**
 * Liste explicite des codes supportés. Doit rester synchronisée avec les
 * clés de `TEMPLATE_MAP` dans `useCoachPageTemplate.ts`. Un test de parité
 * vérifie la cohérence.
 */
export const SUPPORTED_COACH_TEMPLATE_CODES: readonly CoachTemplateCode[] = [
  'signature',
  'essentiel',
  'visuel'
]

/**
 * Type guard : vérifie qu'une valeur arbitraire est un code de template
 * connu. Pur, sans effet de bord.
 */
export function isKnownTemplateCode(code: string | null | undefined): code is CoachTemplateCode {
  if (!code) return false
  return (SUPPORTED_COACH_TEMPLATE_CODES as readonly string[]).includes(code)
}

/**
 * Résout un templateCode arbitraire en code supporté (avec fallback).
 * Utilisable sans aucune dépendance Vue — testable unitairement.
 */
export function resolveCoachTemplateCode(templateCode?: string | null): CoachTemplateCode {
  return isKnownTemplateCode(templateCode) ? templateCode : DEFAULT_COACH_TEMPLATE_CODE
}
