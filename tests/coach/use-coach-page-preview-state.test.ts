import * as assert from 'node:assert/strict'
import test, { describe, beforeEach, afterEach } from 'node:test'
import { effectScope, nextTick } from 'vue'

import {
  parseOpen,
  parseDevice,
  PREVIEW_OPEN_STORAGE_KEY,
  PREVIEW_DEVICE_STORAGE_KEY,
  useCoachPagePreviewState
} from '../../app/features/coach/useCoachPagePreviewState'

/**
 * Story 0-28 — tests for the persisted preview state composable.
 *
 * Covers:
 *   - parseOpen / parseDevice pure helpers (defaults + invalid values)
 *   - toggleOpen + setDevice mutate refs synchronously
 *   - localStorage write happens after the next tick (watch flush)
 */

interface StorageStub {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

function createStorageStub(): StorageStub {
  const store = new Map<string, string>()
  return {
    getItem: key => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => store.clear()
  }
}

describe('parseOpen', () => {
  test('returns false for the literal "false" string', () => {
    assert.equal(parseOpen('false'), false)
  })

  test('returns true for the literal "true" string', () => {
    assert.equal(parseOpen('true'), true)
  })

  test('returns the default (true) for null', () => {
    assert.equal(parseOpen(null), true)
  })

  test('returns the default (true) for unknown values', () => {
    assert.equal(parseOpen('1'), true)
    assert.equal(parseOpen('yes'), true)
    assert.equal(parseOpen(''), true)
  })
})

describe('parseDevice', () => {
  test('returns mobile for the literal "mobile" string', () => {
    assert.equal(parseDevice('mobile'), 'mobile')
  })

  test('returns the default (desktop) for null + unknown values', () => {
    assert.equal(parseDevice(null), 'desktop')
    assert.equal(parseDevice('desktop'), 'desktop')
    assert.equal(parseDevice('phone'), 'desktop')
    assert.equal(parseDevice(''), 'desktop')
  })
})

describe('useCoachPagePreviewState', () => {
  const originalWindow = (globalThis as { window?: unknown }).window
  let storage: StorageStub

  beforeEach(() => {
    storage = createStorageStub()
    ;(globalThis as { window?: unknown }).window = {
      localStorage: storage
    } as unknown
  })

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      ;(globalThis as { window?: unknown }).window = originalWindow
    }
  })

  test('exposes default values at first paint (before onMounted hydration)', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const state = useCoachPagePreviewState()
        // SSR / first paint defaults — onMounted is not triggered without a
        // mounted component, so the refs stay at their declared defaults.
        assert.equal(state.isOpen.value, true)
        assert.equal(state.device.value, 'desktop')
      })
    } finally {
      scope.stop()
    }
  })

  test('toggleOpen flips the ref + writes "false" / "true" to localStorage on next tick', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const state = useCoachPagePreviewState()

        state.toggleOpen()
        assert.equal(state.isOpen.value, false)
        await nextTick()
        assert.equal(storage.getItem(PREVIEW_OPEN_STORAGE_KEY), 'false')

        state.toggleOpen()
        assert.equal(state.isOpen.value, true)
        await nextTick()
        assert.equal(storage.getItem(PREVIEW_OPEN_STORAGE_KEY), 'true')
      })
    } finally {
      scope.stop()
    }
  })

  test('setDevice writes the device key to localStorage and ignores unchanged values gracefully', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const state = useCoachPagePreviewState()

        state.setDevice('mobile')
        assert.equal(state.device.value, 'mobile')
        await nextTick()
        assert.equal(storage.getItem(PREVIEW_DEVICE_STORAGE_KEY), 'mobile')

        state.setDevice('desktop')
        assert.equal(state.device.value, 'desktop')
        await nextTick()
        assert.equal(storage.getItem(PREVIEW_DEVICE_STORAGE_KEY), 'desktop')
      })
    } finally {
      scope.stop()
    }
  })

  test('storage write is silently swallowed when localStorage throws (incognito, quota)', async () => {
    // Override the stub so setItem throws like a real browser would.
    const throwingStorage: StorageStub = {
      ...createStorageStub(),
      setItem: () => {
        throw new Error('QuotaExceededError')
      }
    }
    ;(globalThis as { window?: unknown }).window = {
      localStorage: throwingStorage
    } as unknown

    const scope = effectScope()
    try {
      await scope.run(async () => {
        const state = useCoachPagePreviewState()
        // Must not throw even when localStorage refuses writes.
        state.toggleOpen()
        await nextTick()
        // Ref is still mutated even if persistence fails — UX still works in-session.
        assert.equal(state.isOpen.value, false)
      })
    } finally {
      scope.stop()
    }
  })
})
