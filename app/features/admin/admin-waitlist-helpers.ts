import type { WaitlistStatus } from './api/admin-waitlist.contract'

export interface AdminWaitlistAction {
  label: string
  nextStatus: WaitlistStatus
  icon: string
}

/**
 * Matrix of allowed transitions per status (verbatim from story AC-6).
 * The label MUST match the AC wording — convention A31 ("Wording UI = AC verbatim").
 */
export function computeActionsForStatus(status: WaitlistStatus): AdminWaitlistAction[] {
  switch (status) {
    case 'pending':
      return [
        { label: 'Marquer contacté', nextStatus: 'contacted', icon: 'i-lucide-mail-check' },
        { label: 'Marquer onboardé', nextStatus: 'onboarded', icon: 'i-lucide-user-check' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'contacted':
      return [
        { label: 'Marquer onboardé', nextStatus: 'onboarded', icon: 'i-lucide-user-check' },
        { label: 'Repasser en attente', nextStatus: 'pending', icon: 'i-lucide-rotate-ccw' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'onboarded':
      return [
        { label: 'Repasser en contacté', nextStatus: 'contacted', icon: 'i-lucide-rotate-ccw' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'declined':
      return [
        { label: 'Repasser en attente', nextStatus: 'pending', icon: 'i-lucide-rotate-ccw' }
      ]
  }
}

export function statusBadgeClasses(status: WaitlistStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800'
    case 'contacted':
      return 'bg-sky-50 text-sky-800'
    case 'onboarded':
      return 'bg-emerald-50 text-emerald-800'
    case 'declined':
      return 'bg-stone-100 text-stone-700'
  }
}

/**
 * Pure debounce scheduler factory. Returns `schedule(fn, ms)` which clears
 * previous timer and schedules a new one. Exposed so tests can inject a
 * fake timer.
 */
export function createDebouncer() {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule(fn: () => void, ms: number): void {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn()
      }, ms)
    },
    cancel(): void {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    isPending(): boolean {
      return timer !== null
    }
  }
}

/**
 * Pure reconciliation: replaces the lead matching `id` in `list` with `updated`.
 * Returns a new array (no mutation).
 */
export function reconcileLead<T extends { id: string }>(list: T[], updated: T): T[] {
  return list.map(item => (item.id === updated.id ? updated : item))
}

/**
 * Pure optimistic patch — replaces only the changing status field on the
 * matching lead (preserves the rest of the snapshot, so the UI shows the
 * eventual badge immediately while the API call is in flight). Returns a
 * new array with the patched lead, untouched references otherwise.
 *
 * Codex F4 — the panel applies this BEFORE calling the API; on success it
 * reconciles via `reconcileLead()` with the server payload; on error it
 * restores the original snapshot via `restoreSnapshot()`.
 */
export function applyOptimisticStatus<
  T extends { id: string, status: string }
>(list: T[], id: string, nextStatus: T['status']): T[] {
  return list.map(item =>
    item.id === id ? ({ ...item, status: nextStatus } as T) : item
  )
}

/**
 * Pure restore: swaps the lead at `id` back to its `original` value (used
 * when the optimistic update must be rolled back on API failure).
 */
export function restoreSnapshot<T extends { id: string }>(
  list: T[],
  original: T
): T[] {
  return list.map(item => (item.id === original.id ? original : item))
}
