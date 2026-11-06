/**
 * CPD.3 — contrat partagé des éditeurs de listes à icônes (bénéfices, piliers,
 * déroulé).
 *
 * Les trois cartes émettent la même forme de modification et la page l'applique
 * avec la même règle. Avant extraction, cette règle existait trois fois dans
 * `coach-page.vue` sous forme de `else if` non exhaustifs : une faute de frappe
 * sur `field` compilait (les deux côtés sont des `string`) et était avalée en
 * silence. Le `switch` ci-dessous rend ce cas impossible à écrire.
 *
 * `icon` est le seul champ où `undefined` est une valeur métier : vider
 * l'icône doit produire `undefined`, jamais `''` (`PublicProviderProfile`
 * sérialise l'absence, cf. Dev Notes de la story).
 */

export type ListItemField = 'title' | 'description' | 'icon'

export interface ListItemPatch {
  index: number
  field: ListItemField
  value: string | undefined
}

export interface ListItemLike {
  title?: string
  description?: string
  icon?: string
}

/**
 * Applique un patch à une entrée de liste. Ne fait rien si `field` sort du
 * contrat (impossible à compiler) — le `never` le prouve à la compilation.
 */
export function applyListItemPatch(item: ListItemLike, patch: ListItemPatch): void {
  switch (patch.field) {
    case 'title':
      item.title = patch.value as string
      return
    case 'description':
      item.description = patch.value as string
      return
    case 'icon':
      item.icon = patch.value
      return
    default: {
      const exhaustive: never = patch.field
      void exhaustive
    }
  }
}
