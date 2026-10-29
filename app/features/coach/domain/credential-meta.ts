/**
 * Helper pur de formatage de la ligne secondaire d'une certification.
 *
 * Rend `organisme · année` lorsque au moins l'un des deux champs est renseigné,
 * et `null` sinon (aucune ligne secondaire, pas de séparateur orphelin).
 *
 * Raison d'être : la chaîne `institution · year` est calculée ici une seule fois
 * et réutilisée par les cinq templates (Signature, Hub, Visuel, Essentiel, Alba),
 * pour éviter cinq copies qui dériveraient. Le helper est pur et testable sans
 * monter de composant Vue.
 *
 * Convention : `year === 0` est une année valide et doit être rendue (ne pas
 * confondre avec « absent »).
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'

export function formatCredentialMeta(cred: CredentialItem): string | null {
  const institution = cred.institution?.trim() ?? ''
  const year = cred.year

  const parts: string[] = []
  if (institution.length > 0) parts.push(institution)
  if (year !== undefined && year !== null) parts.push(String(year))

  if (parts.length === 0) return null
  return parts.join(' · ')
}
