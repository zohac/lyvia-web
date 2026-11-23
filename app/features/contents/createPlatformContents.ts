import { ref } from 'vue'
import type { PlatformContentItem, ListPlatformContentsResponse, PlatformContentApprovalResponse } from './api/contents.contract'
import {
  applyApprovalToList,
  platformApprovalErrorMessage,
  platformApprovalToastMessage,
  rollbackApprovalToList,
  snapshotApproval
} from './domain/platform-approvals'

export const PLATFORM_CONTENTS_PAGE_LIMIT = 20

export interface CreatePlatformContentsDependencies {
  list: (params?: { limit?: number, cursor?: string }) => Promise<ListPlatformContentsResponse>
  approve: (id: string) => Promise<PlatformContentApprovalResponse>
  withdraw: (id: string) => Promise<PlatformContentApprovalResponse>
  notify: (notice: { title?: string, description?: string, color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' }) => void
}

export function createPlatformContents(deps: CreatePlatformContentsDependencies) {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const items = ref<PlatformContentItem[]>([])
  const nextCursor = ref<string | null>(null)

  const loadMorePending = ref(false)
  const loadMoreErrorMessage = ref<string | null>(null)

  const approvingIds = ref<Set<string>>(new Set())

  const previewItem = ref<PlatformContentItem | null>(null)

  let requestId = 0

  async function refresh(): Promise<void> {
    requestId += 1
    const id = requestId
    pending.value = true
    errorMessage.value = null
    loadMoreErrorMessage.value = null
    loadMorePending.value = false

    try {
      const response = await deps.list({ limit: PLATFORM_CONTENTS_PAGE_LIMIT })
      if (requestId !== id) return
      items.value = response.items
      nextCursor.value = response.nextCursor
    } catch {
      if (requestId !== id) return
      errorMessage.value = 'Impossible de charger les articles Keova. Veuillez réessayer.'
    } finally {
      if (requestId === id) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (loadMorePending.value || pending.value || !nextCursor.value) return
    const cursor = nextCursor.value
    const id = requestId
    loadMorePending.value = true
    loadMoreErrorMessage.value = null
    try {
      const response = await deps.list({ limit: PLATFORM_CONTENTS_PAGE_LIMIT, cursor })
      if (requestId !== id) return
      items.value = [...items.value, ...response.items]
      nextCursor.value = response.nextCursor
    } catch {
      if (requestId === id) {
        loadMoreErrorMessage.value = 'Impossible de charger plus d’articles.'
      }
    } finally {
      loadMorePending.value = false
    }
  }

  function setApproving(id: string, value: boolean) {
    const next = new Set(approvingIds.value)
    if (value) next.add(id)
    else next.delete(id)
    approvingIds.value = next
  }

  async function approveItem(id: string): Promise<void> {
    const previous = snapshotApproval(items.value, id)
    items.value = applyApprovalToList(items.value, id, true)
    setApproving(id, true)
    try {
      const response = await deps.approve(id)
      items.value = applyApprovalToList(items.value, id, response.approved)
      deps.notify({ title: platformApprovalToastMessage(true), color: 'success' })
    } catch {
      items.value = rollbackApprovalToList(items.value, id, previous)
      deps.notify({ title: platformApprovalErrorMessage(), color: 'error' })
    } finally {
      setApproving(id, false)
    }
  }

  async function withdrawItem(id: string): Promise<void> {
    const previous = snapshotApproval(items.value, id)
    items.value = applyApprovalToList(items.value, id, false)
    setApproving(id, true)
    try {
      const response = await deps.withdraw(id)
      items.value = applyApprovalToList(items.value, id, response.approved)
      deps.notify({ title: platformApprovalToastMessage(false), color: 'success' })
    } catch {
      items.value = rollbackApprovalToList(items.value, id, previous)
      deps.notify({ title: platformApprovalErrorMessage(), color: 'error' })
    } finally {
      setApproving(id, false)
    }
  }

  function openPreview(item: PlatformContentItem): void {
    previewItem.value = item
  }

  function closePreview(): void {
    previewItem.value = null
  }

  return {
    pending,
    errorMessage,
    items,
    nextCursor,
    loadMorePending,
    loadMoreErrorMessage,
    approvingIds,
    previewItem,
    refresh,
    loadMore,
    approveItem,
    withdrawItem,
    openPreview,
    closePreview
  }
}
