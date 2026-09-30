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
export type CoachTemplateCode = 'signature' | 'essentiel' | 'visuel' | 'visuel-portrait'

/** Code utilisé comme fallback quand le templateCode est inconnu ou absent. */
export const DEFAULT_COACH_TEMPLATE_CODE: CoachTemplateCode = 'essentiel'

/**
 * Liste explicite des codes supportés. Doit rester synchronisée avec les
 * clés de `TEMPLATE_MAP` dans `useCoachPageTemplate.ts`. Un test de parité
 * vérifie la cohérence.
 *
 * YB.1.2 — `visuel-portrait` est le code d'Alba, le quatrième template. Le
 * TIRET est imposé par le contrat : le DTO d'administration valide le code
 * avec `@Matches(/^[a-z0-9-]+$/)`, donc un underscore serait rejeté en 400.
 *
 * Un code présent dans l'union ET dans `TEMPLATE_MAP` mais ABSENT de cette
 * liste est ramené au repli EN SILENCE par `resolveCoachTemplateCode` — une
 * coach dont le template est enregistré en base voit la page d'un autre, sans
 * erreur. C'est le mode de défaillance réel, d'où la parité testée dans les
 * deux sens.
 */
export const SUPPORTED_COACH_TEMPLATE_CODES: readonly CoachTemplateCode[] = [
  'signature',
  'essentiel',
  'visuel',
  'visuel-portrait'
]

/**
 * YB.1.2 — templates qui rendent LEUR PROPRE header sur la page publique.
 *
 * `signature` laisse la `PublicHeader` globale la rendre (variante dock) ;
 * `essentiel`, `visuel` et Alba montent un header interne et masquent la
 * globale via l'état `hide-layout-header`.
 *
 * Cette liste existe parce que l'aperçu de l'éditeur doit reproduire
 * exactement cette répartition : sans clause Alba, l'aperçu afficherait le
 * header global **en plus** du header interne d'Alba — deux headers à
 * l'écran. C'est invisible au lint, au typecheck et à tout test de rendu.
 */
export const SELF_HEADED_COACH_TEMPLATE_CODES: readonly CoachTemplateCode[] = [
  'essentiel',
  'visuel',
  'visuel-portrait'
]

/**
 * `true` si le template rend son propre header, et qu'il ne faut donc PAS
 * monter la `PublicHeader` globale à côté de lui.
 *
 * Passe par `resolveCoachTemplateCode` : un code inconnu est d'abord résolu,
 * jamais comparé à un littéral.
 */
export function templateRendersOwnHeader(templateCode?: string | null): boolean {
  return SELF_HEADED_COACH_TEMPLATE_CODES.includes(
    resolveCoachTemplateCode(templateCode)
  )
}

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
