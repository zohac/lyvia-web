/**
 * LAB.3 — sélection de la certification affichée en tête de page.
 *
 * Deux règles distinctes, volontairement séparées pour ne pas les confondre :
 *
 * - `findFeaturedCredential` : la certification explicitement mise en avant, ou
 *   `null`. Sert aux surfaces qui ne doivent apparaître QUE si une mise en avant
 *   existe (le logo de certification).
 * - `selectHeroCredential` : la mise en avant si elle existe, sinon la première
 *   déclarée (repli spécifié par AC3). Sert aux lignes de texte, qui existent
 *   déjà sans mise en avant.
 *
 * Raison d'être : la règle « première `featured`, sinon `credentials[0]` » était
 * recopiée dans cinq fichiers, et deux d'entre eux (les chips de hero d'Alba et
 * d'Essentiel) avaient divergé en gardant `credentials[0]` : la page affichait
 * alors deux certifications différentes, l'une dans le hero et l'autre juste en
 * dessous. Le helper est pur et testable sans monter de composant Vue.
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'

export function findFeaturedCredential(
  credentials: readonly CredentialItem[] | null | undefined
): CredentialItem | null {
  if (!credentials?.length) return null
  return credentials.find(cred => cred.featured) ?? null
}

export function selectHeroCredential(
  credentials: readonly CredentialItem[] | null | undefined
): CredentialItem | null {
  return findFeaturedCredential(credentials) ?? credentials?.[0] ?? null
}

/**
 * Ordre d'affichage de la liste de réassurance : la mise en avant d'abord, puis
 * l'ordre déclaré. La mise en avant est ainsi la première carte du rail, jamais
 * masquée par le défilement initial (`DESIGN.md`, règle du 2026-10-24).
 */
export function orderCredentialsForDisplay(
  credentials: readonly CredentialItem[]
): CredentialItem[] {
  return [
    ...credentials.filter(cred => cred.featured),
    ...credentials.filter(cred => !cred.featured)
  ]
}
