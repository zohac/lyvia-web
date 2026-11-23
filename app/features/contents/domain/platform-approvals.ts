import type { PlatformContentItem } from '../api/contents.contract'

/**
 * Pure helpers for the platform-articles approval UI (Story diffusion-8).
 *
 * Kept free of Vue/Nuxt so they can be executed directly by the unit tests.
 */

export function platformApprovalStatusLabel(approved: boolean): string {
  return approved ? 'Visible par vos clientes' : 'Non visible'
}

export function platformApprovalActionLabel(approved: boolean): string {
  return approved ? 'Ne plus rendre visible' : 'Rendre visible à mes clientes'
}

export function platformApprovalToastMessage(approved: boolean): string {
  return approved
    ? 'Article rendu visible à vos clientes.'
    : 'Article retiré de la vue de vos clientes.'
}

export function platformApprovalErrorMessage(): string {
  return 'Impossible de mettre à jour la visibilité. Veuillez réessayer.'
}

/**
 * Returns a new list with the item's `approved` flag set, leaving the rest
 * untouched (immutable). Used for the optimistic update.
 */
export function applyApprovalToList(
  items: PlatformContentItem[],
  id: string,
  approved: boolean
): PlatformContentItem[] {
  return items.map(item =>
    item.id === id ? { ...item, approved } : item
  )
}

/**
 * Captures the previous `approved` value for an item, or `null` if absent.
 * Used to build the rollback snapshot.
 */
export function snapshotApproval(
  items: PlatformContentItem[],
  id: string
): boolean | null {
  const item = items.find(entry => entry.id === id)
  return item ? item.approved : null
}

/**
 * Restores an item's `approved` flag to its previous value. If the previous
 * value is `null` (item missing), the list is returned unchanged.
 */
export function rollbackApprovalToList(
  items: PlatformContentItem[],
  id: string,
  previousApproved: boolean | null
): PlatformContentItem[] {
  if (previousApproved === null) return items
  return items.map(item =>
    item.id === id ? { ...item, approved: previousApproved } : item
  )
}

export function platformExcerpt(body: string | null, max = 160): string {
  if (!body) return ''
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}
