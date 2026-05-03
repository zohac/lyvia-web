import { onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Story 0-28 — persisted state for the coach-page live preview.
 *
 * `isOpen`  — whether the preview panel (desktop) or slideover (mobile)
 *             is currently shown. Default `true` on first access (UX
 *             discoverability).
 * `device`  — viewport mockup mode for the desktop preview frame:
 *             `'desktop'` (full panel width) or `'mobile'` (clamped to
 *             375px with a fine border). Default `'desktop'`.
 *
 * SSR-safe: localStorage is only touched after `onMounted`. Falls back
 * gracefully when `localStorage` is unavailable (incognito, private
 * windows, exotic embeds) — defaults are returned without throwing.
 */
export const PREVIEW_OPEN_STORAGE_KEY = 'coach-page-preview-open'
export const PREVIEW_DEVICE_STORAGE_KEY = 'coach-page-preview-device'

export type PreviewDevice = 'desktop' | 'mobile'

const DEFAULT_OPEN = true
const DEFAULT_DEVICE: PreviewDevice = 'desktop'

function safeReadStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWriteStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Quota exceeded, private mode, etc. — silent fallback.
  }
}

/**
 * Story 0-28 — exported for unit testing without the Vue runtime dance.
 * `'true'`/`'false'` are stored verbatim as strings (AC-7 spec) so a
 * malformed value (`'1'`, `'yes'`, missing key) gracefully falls back to
 * the default rather than coercing.
 */
export function parseOpen(raw: string | null): boolean {
  if (raw === 'false') return false
  if (raw === 'true') return true
  return DEFAULT_OPEN
}

/**
 * Story 0-28 — exported for unit testing. Anything other than `'mobile'`
 * (including unknown values) falls back to the desktop default.
 */
export function parseDevice(raw: string | null): PreviewDevice {
  return raw === 'mobile' ? 'mobile' : DEFAULT_DEVICE
}

export function useCoachPagePreviewState(): {
  isOpen: Ref<boolean>
  device: Ref<PreviewDevice>
  toggleOpen: () => void
  setDevice: (next: PreviewDevice) => void
} {
  // SSR / first paint: defaults. Hydrate from localStorage onMounted to
  // avoid mismatched server/client renders.
  const isOpen = ref<boolean>(DEFAULT_OPEN)
  const device = ref<PreviewDevice>(DEFAULT_DEVICE)

  onMounted(() => {
    isOpen.value = parseOpen(safeReadStorage(PREVIEW_OPEN_STORAGE_KEY))
    device.value = parseDevice(safeReadStorage(PREVIEW_DEVICE_STORAGE_KEY))
  })

  watch(isOpen, (next) => {
    safeWriteStorage(PREVIEW_OPEN_STORAGE_KEY, next ? 'true' : 'false')
  })

  watch(device, (next) => {
    safeWriteStorage(PREVIEW_DEVICE_STORAGE_KEY, next)
  })

  function toggleOpen(): void {
    isOpen.value = !isOpen.value
  }

  function setDevice(next: PreviewDevice): void {
    device.value = next
  }

  return { isOpen, device, toggleOpen, setDevice }
}
