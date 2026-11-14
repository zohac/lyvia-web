// Familles de business logs proposées par le panneau admin.
//
// Depuis em-2b, la taxonomie est servie par l'API (`GET /admin/logs/event-families`) :
// le panneau ne tient AUCUNE copie de la liste. Deux listes maintenues en
// parallèle divergeaient au premier ajout — c'était le défaut de la version
// précédente, où le web était la seule source et l'API ignorait ce que l'écran
// envoyait.
//
// Ce module ne garde donc que les TYPES et la fonction pure d'aplatissement.
// Une famille ajoutée côté serveur arrive à l'écran sans commit web.
export type BusinessLogEventFamily = {
  key: string
  label: string
  prefixes: readonly string[]
}

export type ExcludedBusinessLogEventFamily = {
  prefixes: readonly string[]
  reason: string
}

export type BusinessLogEventFamiliesResponse = {
  families: BusinessLogEventFamily[]
  excluded: ExcludedBusinessLogEventFamily[]
  prefixLimit: number
}

/**
 * Aplatit les familles sélectionnées en préfixes réellement envoyés à l'API.
 *
 * L'ordre suit celui des familles servies, pas celui des clics : deux
 * sélections identiques produisent la même requête, donc la même clé de cache
 * et le même résultat.
 */
export function prefixesForFamilies(
  families: readonly BusinessLogEventFamily[],
  selected: readonly string[]
): string[] {
  return families
    .filter(family => selected.includes(family.key))
    .flatMap(family => [...family.prefixes])
}
