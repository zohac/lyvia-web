/**
 * Hotfix 26 — Espace réservé au dock flottant du header public.
 *
 * Le header public est rendu en `position: fixed` (`PublicHeader.vue`, dock
 * `top-6`) et occupe les ~24 à ~110 px du viewport. Les pages qui rendent
 * leur contenu dans le `<main>` du layout public (et non en full-bleed) doivent
 * donc réserver cet espace en haut, sous peine de voir leur titre masqué par le
 * dock (retour terrain Sophie, 2026-11-03).
 *
 * Valeur factorisée ici pour que les deux routes de page dynamique
 * (`/coach/:slug/:pageSlug` plateforme et `/:pageSlug` white-label) ne
 * puissent pas diverger. Précédent : `app/pages/articles/[...slug].vue`
 * (`pt-32 sm:pt-40`).
 *
 * Ne PAS compenser dans `app/layouts/public.vue` : articles et pages légales
 * compensent déjà localement → double espace garanti.
 */

/** Classes Tailwind réservant l'espace du dock en haut du conteneur de page. */
export const DOCK_CLEARANCE_CLASSES = 'pt-32 pb-8 sm:pt-40 sm:pb-12'

/** Alias historiques / variantes de nommage (même valeur, un seul point de vérité). */
export const DOCK_TOP_PADDING_CLASSES = DOCK_CLEARANCE_CLASSES
export const PUBLIC_DOCK_CLEARANCE = DOCK_CLEARANCE_CLASSES
export const DOCK_CLEARANCE = DOCK_CLEARANCE_CLASSES
export const dockClearanceClasses = DOCK_CLEARANCE_CLASSES
export const dockTopPaddingClasses = DOCK_CLEARANCE_CLASSES

export default DOCK_CLEARANCE_CLASSES
