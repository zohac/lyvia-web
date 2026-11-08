import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ref } from 'vue'

import { createCoachPublish } from '../../app/features/coach/useCoachPublish'
import type { ProviderAccountResponse } from '../../app/features/account/api/provider-account.contract'

type Toast = { title?: string, description?: string }

function makeAccount(overrides: Record<string, unknown> = {}): ProviderAccountResponse {
  return {
    isTest: false,
    slug: 'sophie',
    publishChecklist: { isReady: false, items: {}, missingItems: [] },
    ...overrides
  } as unknown as ProviderAccountResponse
}

function okPublisher(account: { value: ProviderAccountResponse | null }) {
  return { publishCoachPage: async () => ({ ok: true as const, data: account.value as ProviderAccountResponse }) }
}

function failingPublisher() {
  return { publishCoachPage: async () => ({ ok: false as const, errorCode: 'X' }) }
}

function successToasts(toasts: Toast[]): Toast[] {
  return toasts.filter(t => t.title === 'Page dépubliée')
}

describe('cpd-9 — useCoachPublish', () => {
  test('openPublish does nothing when publishChecklist is missing', async () => {
    const account = ref(makeAccount({ publishChecklist: undefined }))
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(publish.checklistModalOpen.value, false)
  })

  test('openPublish does nothing for a test account', async () => {
    const account = ref(makeAccount({ isTest: true }))
    let calls = 0
    const editor = {
      publishCoachPage: async () => {
        calls += 1
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(publish.checklistModalOpen.value, false)
    assert.equal(calls, 0)
  })

  test('openPublish opens the checklist when it exists but is not ready', async () => {
    const account = ref(makeAccount())
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(publish.checklistModalOpen.value, true)
  })

  test('openPublish publishes directly when the checklist is ready', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    let calls = 0
    const editor = {
      publishCoachPage: async () => {
        calls += 1
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    await publish.openPublish()
    assert.equal(calls, 1)
  })

  test('executePublish success closes the checklist and emits the verbatim success toast', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const toasts: Toast[] = []
    const publish = createCoachPublish({
      account,
      editor: okPublisher(account),
      toast: { add: (o: unknown) => toasts.push(o as Toast) }
    })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.equal(publish.checklistModalOpen.value, false)
    assert.equal(publish.publishError.value, null)
    assert.equal(toasts.length, 1)
    assert.equal(toasts[0]?.title, 'Page mise en ligne')
  })

  test('executePublish failure keeps the checklist open with publishError', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const publish = createCoachPublish({ account, editor: failingPublisher(), toast: { add: () => {} } })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.equal(publish.checklistModalOpen.value, true)
    assert.equal(publish.publishError.value, 'Impossible de publier votre page coach.')
  })

  test('executePublish keeps the checklist open and reports an unexpected throw', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    const editor = {
      publishCoachPage: async (): Promise<never> => {
        throw new Error('network down')
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    publish.checklistModalOpen.value = true
    await publish.executePublish()
    assert.equal(publish.checklistModalOpen.value, true)
    assert.equal(publish.publishError.value, 'Une erreur inattendue est survenue.')
    assert.equal(publish.publishing.value, false)
  })

  test('unpublish is idempotent: two calls, one write, one toast', async () => {
    const account = ref(makeAccount())
    let calls = 0
    const toasts: Toast[] = []
    const editor = {
      unpublishCoachPage: async () => {
        calls += 1
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: (o: unknown) => toasts.push(o as Toast) } })
    await publish.unpublish()
    await publish.unpublish()
    assert.equal(calls, 1, 'only one write')
    assert.equal(successToasts(toasts).length, 1, 'only one success toast')
  })

  test('re-publishing re-arms unpublish: the second depublication writes again', async () => {
    const account = ref(makeAccount({ publishChecklist: { isReady: true } }))
    let unpublishes = 0
    const toasts: Toast[] = []
    const editor = {
      publishCoachPage: async () => ({ ok: true as const, data: account.value }),
      unpublishCoachPage: async () => {
        unpublishes += 1
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: (o: unknown) => toasts.push(o as Toast) } })

    await publish.unpublish()
    await publish.executePublish()
    await publish.unpublish()

    assert.equal(unpublishes, 2, 'a publish must re-arm the unpublish guard')
    assert.equal(successToasts(toasts).length, 2)
  })

  test('a failed unpublish leaves the guard open so the coach can retry', async () => {
    const account = ref(makeAccount())
    let calls = 0
    const editor = {
      unpublishCoachPage: async () => {
        calls += 1
        return calls === 1
          ? { ok: false as const, errorCode: 'X' }
          : { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    await publish.unpublish()
    await publish.unpublish()
    assert.equal(calls, 2)
  })

  test('unpublish is skipped while a write is in flight', async () => {
    const account = ref(makeAccount())
    let calls = 0
    let release: (() => void) | undefined
    const editor = {
      unpublishCoachPage: async () => {
        calls += 1
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return { ok: true as const, data: account.value }
      }
    }
    const publish = createCoachPublish({ account, editor, toast: { add: () => {} } })
    const first = publish.unpublish()
    await publish.unpublish()
    release?.()
    await first
    assert.equal(calls, 1)
  })

  test('navigateTo("offers") routes to the tariff page through the injected navigation', () => {
    const account = ref(makeAccount())
    const visited: string[] = []
    const publish = createCoachPublish({
      account,
      editor: null,
      toast: { add: () => {} },
      navigateTo: (to: string) => visited.push(to)
    })
    publish.checklistModalOpen.value = true
    publish.navigateTo('offers')
    assert.deepEqual(visited, ['/provider/tarifs'])
    assert.equal(publish.checklistModalOpen.value, false)
  })

  test('navigateTo closes the checklist on the scrolling branches too', () => {
    const account = ref(makeAccount())
    const publish = createCoachPublish({ account, editor: null, toast: { add: () => {} } })

    publish.checklistModalOpen.value = true
    publish.navigateTo('pillars')
    assert.equal(publish.checklistModalOpen.value, false)

    publish.checklistModalOpen.value = true
    publish.navigateTo('template')
    assert.equal(publish.checklistModalOpen.value, false)
  })
})
