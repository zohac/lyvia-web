import * as assert from 'node:assert/strict'
import test from 'node:test'
import { copyToClipboard } from '../../app/utils/clipboard'

test('copyToClipboard: returns false when window is undefined', async () => {
  const originalWindow = (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).window

  const result = await copyToClipboard('https://example.com/token')
  assert.equal(result, false)

  if (originalWindow !== undefined) {
    ;(globalThis as Record<string, unknown>).window = originalWindow
  }
})

test('copyToClipboard: uses navigator.clipboard.writeText when available', async () => {
  let written = ''
  ;(globalThis as Record<string, unknown>).window = {}
  const mockNavigator = {
    clipboard: {
      writeText: async (text: string) => {
        written = text
      }
    }
  }
  const originalDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true
  })

  try {
    const result = await copyToClipboard('https://example.com/test-url')
    assert.equal(result, true)
    assert.equal(written, 'https://example.com/test-url')
  } finally {
    delete (globalThis as Record<string, unknown>).window
    if (originalDesc) {
      Object.defineProperty(globalThis, 'navigator', originalDesc)
    } else {
      delete (globalThis as Record<string, unknown>).navigator
    }
  }
})

test('copyToClipboard: falls back to execCommand when navigator.clipboard throws', async () => {
  ;(globalThis as Record<string, unknown>).window = {}
  const mockNavigator = {
    clipboard: {
      writeText: async () => {
        throw new Error('NotAllowedError')
      }
    }
  }
  const originalDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true
  })

  let execCommandCalled = false
  let appendedValue = ''
  ;(globalThis as Record<string, unknown>).document = {
    createElement: () => ({
      style: {},
      value: '',
      focus: () => {},
      select: () => {}
    }),
    body: {
      appendChild: (el: { value: string }) => {
        appendedValue = el.value
      },
      removeChild: () => {}
    },
    execCommand: (command: string) => {
      if (command === 'copy') {
        execCommandCalled = true
        return true
      }
      return false
    }
  }

  try {
    const result = await copyToClipboard('https://example.com/fallback-url')
    assert.equal(result, true)
    assert.equal(execCommandCalled, true)
    assert.equal(appendedValue, 'https://example.com/fallback-url')
  } finally {
    delete (globalThis as Record<string, unknown>).window
    delete (globalThis as Record<string, unknown>).document
    if (originalDesc) {
      Object.defineProperty(globalThis, 'navigator', originalDesc)
    } else {
      delete (globalThis as Record<string, unknown>).navigator
    }
  }
})

test('copyToClipboard: returns false when both fail', async () => {
  ;(globalThis as Record<string, unknown>).window = {}
  const mockNavigator = {
    clipboard: {
      writeText: async () => {
        throw new Error('Denied')
      }
    }
  }
  const originalDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true
  })

  ;(globalThis as Record<string, unknown>).document = {
    createElement: () => {
      throw new Error('DOM error')
    }
  }

  try {
    const result = await copyToClipboard('https://example.com/failed')
    assert.equal(result, false)
  } finally {
    delete (globalThis as Record<string, unknown>).window
    delete (globalThis as Record<string, unknown>).document
    if (originalDesc) {
      Object.defineProperty(globalThis, 'navigator', originalDesc)
    } else {
      delete (globalThis as Record<string, unknown>).navigator
    }
  }
})
