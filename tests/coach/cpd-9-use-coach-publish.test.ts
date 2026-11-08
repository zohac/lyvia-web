import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ref } from 'vue'

import { createCoachPublish } from '../../app/features/coach/useCoachPublish'

describe('cpd-9 — useCoachPublish', () => {
  function makeAccount(overrides: Record<string, unknown> = {}) {
    return {
      isTest: false,
      slug: 'sophie',
      publishChecklist: { isReady: false, items: {}, missingItems: [] },
      ...overrides
    } as any
  }

  test('openPublish does nothing when publishChecklist is missing', async () => {
    const account = ref({ isTest: false } as any)
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(publish.checklistModalOpen.value, false)
  })

  test('openPublish opens checklist when publishChecklist exists but not ready', async () => {
    const account = ref(makeAccount())
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(publish.checklistModalOpen.value, true)
  })

  test('executePublish success closes checklist and toasts', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const toasts: unknown[] = []
    const editor = { publishCoachPage: async () => ({ ok: true as const, data: account.value }) }
    const publish = createCoachPublish({ account, editor, toast: { add: (o: unknown) => toasts.push(o) } })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.equal(publish.checklistModalOpen.value, false)
    assert.equal(publish.publishError.value, null)
    assert.ok(toasts.length >= 1)
  })

  test('executePublish failure keeps checklist open with publishError', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const editor = { publishCoachPage: async () => ({ ok: false as const, errorCode: 'x' }) }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.equal(publish.checklistModalOpen.value, true)
    assert.ok(publish.publishError.value)
  })

  test('removing publishError from failure path would fail (non-vacuity sentinel)', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const editor = { publishCoachPage: async () => ({ ok: false as const }) }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.ok(publish.publishError.value, 'publishError must be set on failure')
  })

  test('unpublish is idempotent: two calls, one write, one toast', async () => {
    const account = ref(makeAccount())
    let calls = 0
    const toasts: unknown[] = []
    const editor = {
      unpublishCoachPage: async () => {
        calls += 1
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: (o: unknown) => toasts.push(o) } })
    await publish.unpublish()
    await publish.unpublish()
    assert.equal(calls, 1, 'only one write')
    const successToasts = toasts.filter(t => (t as { title?: string }).title === 'Page dépubliée')
    assert.equal(successToasts.length, 1, 'only one toast')
  })

  test('navigateTo scrolls and closes checklist', () => {
    const account = ref(makeAccount())
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })
    publish.checklistModalOpen.value = true
    publish.navigateTo('pillars')
    assert.equal(publish.checklistModalOpen.value, false)
  })
})