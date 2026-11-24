/**
 * Géométrie unique des champs des cinq surfaces de contenus (diffusion-15).
 *
 * Pourquoi ce module existe : le thème de l'app pose **deux** langages de champ
 * dans le même formulaire — `UInput`/`USelect` sont des pilules (rayon 9999 px,
 * hauteur 44, ombre `0 4px 12px`), `UTextarea` a un rayon de 16 px, aucune
 * bordure et un filet inset. La capture du 2026-11-24 le montre côte à côte :
 * le même formulaire change de forme au champ suivant.
 *
 * Le thème global (`app.config.ts`, `config/design-system/**`) reste hors
 * périmètre (exemption du 2026-11-24, `design-system/decisions.md`) : ces
 * presets sont donc passés **par instance** via la prop `ui` de Nuxt UI, qui
 * fusionne après les variantes du thème.
 *
 * Ce qui est posé ici :
 * - un rayon de 12 px pour tous les contrôles de saisie ;
 * - aucune ombre de champ (une ombre sous un champ est une élévation sans sens) ;
 * - la hauteur de l'AC5 : 48 px côté praticienne et cliente, 40 px côté admin ;
 * - l'anneau de focus de l'AC5 : 2 px, décalé de 2 px, sur `--color-brand-primary`
 *   (l'app n'a pas de token `color.focus.ring` ; le thème remplaçait l'anneau
 *   par un halo de 4 px et retirait le contour des champs).
 *
 * Manque signalé au design system : une géométrie de champ unique n'existe pas
 * dans les contrats (`input.json`, `textarea.json`, `select.json` la décrivent
 * chacun séparément). Consigné « proposé » dans `design-system/decisions.md`.
 */

/** Anneau de focus commun : 2 px décalés de 2 px (AC5). */
export const CONTENT_FOCUS_RING = [
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'focus-visible:outline-[color:var(--color-brand-primary)]'
].join(' ')

const FIELD_BASE = [
  'rounded-[12px]',
  'shadow-none',
  'text-sm font-normal',
  'text-[color:var(--color-text-primary)]',
  CONTENT_FOCUS_RING,
  // Le thème remplace l'anneau par un halo ; on le retire des deux états.
  'focus:shadow-none',
  'focus-visible:shadow-none'
].join(' ')

/**
 * La hauteur suit l'AC5 : 48 px pour la praticienne et la cliente (cible
 * tactile), 40 px pour l'admin (desktop, 40 px minimum).
 */
export const CONTENT_INPUT_UI = { base: `${FIELD_BASE} h-12 px-4` }
export const CONTENT_INPUT_UI_COMPACT = { base: `${FIELD_BASE} h-10 px-3` }

export const CONTENT_TEXTAREA_UI = {
  base: [
    FIELD_BASE,
    'rounded-[12px]',
    'px-4 py-3',
    'border border-[color:var(--color-border-subtle)]',
    'bg-[color:var(--color-surface-card)]',
    // Le thème dessine le textarea par un filet inset : il devient une vraie bordure.
    'ring-0',
    'focus:border-[color:var(--color-brand-primary)]'
  ].join(' ')
}
export const CONTENT_TEXTAREA_UI_COMPACT = CONTENT_TEXTAREA_UI

export const CONTENT_SELECT_UI = {
  base: `${FIELD_BASE} h-12 px-4 pr-10`
}
export const CONTENT_SELECT_UI_COMPACT = {
  base: `${FIELD_BASE} h-10 px-3 pr-9`
}

/** Libellé de champ : 13 px, 600, encre AA (le thème héritait 16 px/400). */
export const CONTENT_FIELD_UI = {
  root: 'space-y-1.5',
  label: 'text-[13px] font-semibold text-[color:var(--color-text-secondary)]',
  hint: 'text-xs text-[color:var(--color-text-secondary)]',
  error: 'text-xs font-medium text-[color:var(--color-error-700,var(--color-error))]'
}

/** Texte secondaire porteur d'information : AA (5,3:1 sur le canevas). */
export const CONTENT_META_CLASS = 'text-xs text-[color:var(--color-neutral-600)]'
/** Chapeau de page / description de section : AA (8,8:1). */
export const CONTENT_CAPTION_CLASS = 'text-sm text-[color:var(--color-text-secondary)]'
