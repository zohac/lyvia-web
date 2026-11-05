/**
 * Hotfix 26 — espace réservé au dock flottant du header public.
 *
 * Le header public est rendu en `position: fixed` (`PublicHeader.vue`, dock
 * `top-6` = 24 px) et sa barre fait `py-4` (32 px) plus le logo — `h-10`/`sm:h-12`
 * (40/48 px) sur la route plateforme, `h-16` (64 px) sur le white-label — plus
 * les 2 px de bordure. Mesuré en navigateur (A35 du 2026-11-04, 4 combinaisons
 * route × viewport), son bord bas tombe à 98 px (plateforme, 390 px), 106 px
 * (plateforme, 1440 px), 122 px (white-label, 390 px) et 134 px au pire cas
 * (white-label, 1440 px, où la nav passe sur deux lignes).
 *
 * Les deux routes de page dynamique rendent en `fullBleed: false`, donc dans le
 * `<main>` du layout public qui ajoute déjà `py-10` (40 px). Avec ce `pt-32
 * sm:pt-40`, le titre part de 40 + 128 = 168 px (mobile) et 40 + 160 = 200 px
 * (≥ sm) : mesuré, la marge sous le dock va de 46 px (white-label mobile) à
 * 94 px (plateforme desktop), donc aucun recouvrement. Ces valeurs sont reprises
 * des pages articles, qui sont `fullBleed: true` et n'ont donc pas ce `py-10` —
 * l'espace effectif y est plus court de 40 px. L'écart est assumé (marge de
 * sécurité), pas une erreur de recopie.
 *
 * Valeur factorisée ici pour que les deux routes — `/coach/:slug/:pageSlug`
 * (plateforme) et `/:pageSlug` (white-label) — ne puissent pas diverger : les
 * deux templates lient cette constante à leur `class` (pas de copie en dur), et
 * `tests/pages/hotfix-26-dock-clearance.test.ts` rend les deux pages pour
 * l'épingler.
 *
 * Ne PAS compenser dans `app/layouts/public.vue` : la spec hotfix-26 a gelé le
 * correctif au niveau des pages de contenu (« Never »). À noter pour un futur
 * lecteur : les articles sont `fullBleed: true` et les pages légales utilisent
 * `layout: 'legal'`, donc ni les unes ni les autres ne passent par le `<main>`
 * `py-10` — un espace ajouté à cette branche ne créerait pas de double espace,
 * il élargirait une surface partagée, ce que la spec interdit explicitement.
 */

/** Classes Tailwind réservant l'espace du dock en haut du conteneur de page. */
export const DOCK_CLEARANCE_CLASSES = 'pt-32 pb-8 sm:pt-40 sm:pb-12'
