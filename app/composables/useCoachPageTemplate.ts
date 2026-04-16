/**
 * useCoachPageTemplate — Résolution dynamique du template de page coach.
 *
 * Map STATIQUE (AD-Y2) : ajouter un template = ajouter une ligne ici +
 * créer le composant Vue correspondant + déclarer le code dans
 * `coach-template-registry.ts`. La map est fermée, aucune injection
 * possible depuis l'extérieur.
 *
 * Code-splitting via `defineAsyncComponent` : chaque template est chargé à
 * la demande, pas au bundle initial.
 *
 * Fallback (AC-4) : si le `templateCode` est inconnu ou absent, on retombe
 * sur `DEFAULT_COACH_TEMPLATE_CODE` (défini dans coach-template-registry).
 *
 * Logique pure (fallback, validation) extraite dans
 * `coach-template-registry.ts` pour être testable sans runtime Vue.
 */
import { defineAsyncComponent, type Component } from 'vue'
import { resolveCoachTemplateCode, type CoachTemplateCode } from './coach-template-registry'

type TemplateLoader = () => Promise<unknown>

/**
 * Map statique code → loader. Toute nouvelle valeur doit être ajoutée ici
 * ET dans `SUPPORTED_COACH_TEMPLATE_CODES` (coach-template-registry.ts).
 * TypeScript garantit l'exhaustivité à la compilation via `satisfies`.
 */
const TEMPLATE_MAP = {
  signature: () => import('~/components/templates/coach-pages/CoachPageSignature.vue'),
  essentiel: () => import('~/components/templates/coach-pages/CoachPageEssentiel.vue')
} as const satisfies Record<CoachTemplateCode, TemplateLoader>

/**
 * Résout un templateCode en composant async prêt à monter via
 * `<component :is="...">`. Fallback sur `DEFAULT_COACH_TEMPLATE_CODE` si
 * le code est inconnu ou absent.
 *
 * @param templateCode Code issu de `provider_profiles.template_code`
 *   (string arbitraire depuis la DB).
 * @returns Composant async Vue prêt à monter.
 */
export function useCoachPageTemplate(templateCode?: string | null): Component {
  const code = resolveCoachTemplateCode(templateCode)
  return defineAsyncComponent(TEMPLATE_MAP[code] as () => Promise<Component>)
}

// Note: pure helpers (DEFAULT_COACH_TEMPLATE_CODE, SUPPORTED_COACH_TEMPLATE_CODES,
// isKnownTemplateCode, resolveCoachTemplateCode, type CoachTemplateCode) are
// exported from `coach-template-registry.ts`. Consumers who only need the
// resolution logic (no Vue runtime) should import from there directly.
