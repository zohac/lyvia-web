import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { createNotificationPreferences } from '../../app/features/notifications/createNotificationPreferences'

describe('createNotificationPreferences', () => {
  test('load reads the initial value', async () => {
    const prefs = createNotificationPreferences({
      get: async () => ({ platformContentPublished: false }),
      update: async p => ({ platformContentPublished: p.platformContentPublished ?? true }),
      notify: () => {}
    })
    await prefs.load()
    assert.equal(prefs.platformContentPublished.value, false)
    assert.equal(prefs.loading.value, false)
  })

  test('load failure sets errorMessage', async () => {
    const prefs = createNotificationPreferences({
      get: async () => { throw new Error('boom') },
      update: async p => ({ platformContentPublished: p.platformContentPublished ?? true }),
      notify: () => {}
    })
    await prefs.load()
    assert.match(prefs.errorMessage.value ?? '', /Impossible/)
  })

  test('toggle success persists the server value', async () => {
    const prefs = createNotificationPreferences({
      get: async () => ({ platformContentPublished: true }),
      update: async p => ({ platformContentPublished: p.platformContentPublished ?? true }),
      notify: () => {}
    })
    await prefs.load()
    await prefs.toggle(false)
    assert.equal(prefs.platformContentPublished.value, false)
    assert.equal(prefs.saving.value, false)
  })

  test('toggle failure rolls back and notifies', async () => {
    const notifications: string[] = []
    const prefs = createNotificationPreferences({
      get: async () => ({ platformContentPublished: true }),
      update: async () => { throw new Error('boom') },
      notify: (n) => { if (n.title) notifications.push(n.title) }
    })
    await prefs.load()
    await prefs.toggle(false)
    assert.equal(prefs.platformContentPublished.value, true)
    assert.ok(notifications.some(n => /Impossible/.test(n)))
  })

  test('toggle sets saving during the call', async () => {
    let resolveFn!: (v: { platformContentPublished: boolean }) => void
    const pending = new Promise<{ platformContentPublished: boolean }>((res) => {
      resolveFn = res
    })
    const prefs = createNotificationPreferences({
      get: async () => ({ platformContentPublished: true }),
      update: async () => pending,
      notify: () => {}
    })
    await prefs.load()
    const toggling = prefs.toggle(false)
    assert.equal(prefs.saving.value, true)
    resolveFn({ platformContentPublished: false })
    await toggling
    assert.equal(prefs.saving.value, false)
  })
})
