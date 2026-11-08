/**
 * CPD.4 — plafonds des deux listes sociales (témoignages, FAQ).
 *
 * Source unique : la page et les cartes importent ces constantes. Avant, la
 * page déclarait `TESTIMONIALS_MAX = 10` et la carte en portait une copie — les
 * deux gardes pouvaient dériver sans qu'un test tombe (revue CPD.4 : passer la
 * constante de la carte à 5 laissait 7/7 verts).
 *
 * Les deux plafonds ne se ressemblent pas et c'est historique (0-26) : les
 * témoignages gardent leur garde dans le handler, la FAQ sur le bouton. Ne pas
 * uniformiser sans décision produit (Dev Notes CPD.4).
 */
export const TESTIMONIALS_MAX = 10

export const FAQ_MAX = 20
