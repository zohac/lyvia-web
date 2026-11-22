import type { ContentShareItem } from '../api/contents.contract'
import type { ProviderClientListItem } from '../../clients/api/clients.contract'

/**
 * Pure helpers for the content-sharing UI (Story 5.6).
 *
 * Kept free of Vue/Nuxt so they can be executed directly by the unit tests.
 */

export function sharedClientIds(shared: ContentShareItem[]): Set<string> {
  return new Set(shared.map(item => item.clientProfileId))
}

/**
 * Removes a shared client from the list (immutable).
 */
export function removeSharedClient(
  shared: ContentShareItem[],
  clientProfileId: string
): ContentShareItem[] {
  return shared.filter(item => item.clientProfileId !== clientProfileId)
}

/**
 * Restores a previously removed client into the list, preserving a stable
 * ordering by `sharedAt` desc (matches the API sort). Used for rollback.
 */
export function restoreSharedClient(
  shared: ContentShareItem[],
  item: ContentShareItem
): ContentShareItem[] {
  if (shared.some(existing => existing.clientProfileId === item.clientProfileId)) {
    return shared
  }
  return [...shared, item].sort((a, b) =>
    b.sharedAt.localeCompare(a.sharedAt)
  )
}

/**
 * Filters the provider roster for the multi-select selector:
 * - drops clients already sharing the content
 * - keeps clients whose name **or email** matches the query.
 *
 * The email is part of the haystack because `GET /provider/clients?q=`
 * searches `firstname/lastname/email` server-side: a name-only local filter
 * would hide the very rows the server matched for an email search.
 */
export function filterSelectableClients(
  roster: ProviderClientListItem[],
  shared: ContentShareItem[],
  query: string
): ProviderClientListItem[] {
  const alreadyShared = sharedClientIds(shared)
  const needle = query.trim().toLowerCase()

  return roster.filter((client) => {
    if (alreadyShared.has(client.clientProfileId)) return false
    if (needle.length === 0) return true
    const haystack = `${client.firstname} ${client.lastname} ${client.email}`.toLowerCase()
    return haystack.includes(needle)
  })
}

/**
 * Builds the request payload for sharing with a subset of clients.
 * Returns `null` when nothing is selected (caller should not send).
 */
export function buildShareSelectedPayload(
  clientProfileIds: string[]
): { clientProfileIds: string[] } | null {
  const ids = [...new Set(clientProfileIds.filter(Boolean))]
  if (ids.length === 0) return null
  return { clientProfileIds: ids }
}

/**
 * Human-readable toast message for a share result, honoring the "0 created"
 * rule enforced by the API (a re-share, or a share-all where every client
 * already had access, creates nothing): never claim additions that did not
 * happen.
 */
export function shareResultMessage(count: number): string {
  if (count === 0) return 'Aucun nouveau partage créé.'
  if (count === 1) return '1 client ajouté.'
  return `${count} clients ajoutés.`
}
