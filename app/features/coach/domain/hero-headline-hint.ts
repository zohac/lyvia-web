/**
 * Aide du champ « Accroche » de l'éditeur de page coach.
 *
 * Le même `FormControl` sert les quatre templates, mais chaque hero a son
 * propre repli : une phrase unique décrirait un repli faux pour trois d'entre
 * eux (revue YB.1.2). L'aide est donc dérivée du template sélectionné.
 *
 * Hotfix 25 : le repli Signature ne publie plus la ville. L'aide ne doit pas
 * promettre un rendu que le hero ne produit pas — elle est construite depuis
 * `SIGNATURE_HERO_FALLBACK_HEADLINE`, la valeur réellement rendue, pour que
 * les deux ne puissent plus diverger.
 *
 * CPD.7 : le calcul reste dans la page, qui seule connaît le template
 * sélectionné. La carte extraite reçoit le texte déjà calculé, jamais un
 * booléen : un booléen ne distingue pas Visuel de Signature et rendrait les
 * branches ci-dessous inatteignables.
 */
import { SIGNATURE_HERO_FALLBACK_HEADLINE } from './signature-hero'

export function buildHeroHeadlineHint(templateCode: string | null | undefined): string {
  switch (templateCode) {
    case 'visuel':
      return 'Laissez vide : le hero affiche alors « Retrouvez votre équilibre et votre vitalité avec {votre prénom} ».'
    case 'signature':
      return `Laissez vide : le hero affiche alors « ${SIGNATURE_HERO_FALLBACK_HEADLINE} ».`
    default:
      return 'Laissez vide : le hero affiche alors « Bonjour, je suis {votre prénom}. », avec la spécialité en surtitre.'
  }
}
