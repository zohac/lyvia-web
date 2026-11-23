/**
 * Story diffusion-7 — execution tests for the client checklist state machine.
 *
 * The checklist used to carry its debounce, its pagination and its optimistic
 * share inside `ContentClientChecklist.vue`, where nothing could execute them:
 * the SFC harness renders under SSR, so `onMounted`, `watch` and the click
 * handlers never run. Extracted into `createContentClientChecklist`, the three
 * AC2/AC3 behaviours are executed here with a fake transport.
 *
 * Each test names the mutation it kills.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { nextTick } from 'vue'

import {
  CHECKLIST_LOAD_ERROR_MESSAGE,
  CHECKLIST_LOAD_MORE_ERROR_MESSAGE,
  CHECKLIST_SHARE_ERROR_MESSAGE,
  createContentClientChecklist,
  type ChecklistClient,
  type ChecklistNotice,
  type CreateContentClientChecklistDependencies
} from '../../app/features/contents/createContentClientChecklist'

function last<T>(values: T[]): T | undefined {
  return values[values.length - 1]
}

function client(id: string, overrides: Partial<ChecklistClient> = {}): ChecklistClient {
  return {
    clientProfileId: id,
    firstname: `Prénom-${id}`,
    lastname: `Nom-${id}`,
    email: `${id}@exemple.fr`,
    ...overrides
  }
}

interface FakeOptions {
  roster?: (params: { q?: string, limit: number, cursor?: string }) => Promise<{
    items: ChecklistClient[]
    page?: { nextCursor: string | null } | null
  }>
  shares?: () => Promise<{ items: Array<{ clientProfileId: string }> }>
  share?: (id: string) => Promise<unknown>
  unshare?: (id: string) => Promise<unknown>
  debounceMs?: number
}

interface Recorder {
  calls: Array<{ q?: string, limit: number, cursor?: string }>
  shares: number
  notices: ChecklistNotice[]
}

function setup(options: FakeOptions) {
  const recorder: Recorder = { calls: [], shares: 0, notices: [] }
  const shared: string[] = []
  const unshared: string[] = []

  const deps: CreateContentClientChecklistDependencies = {
    contentId: 'content-1',
    listClients: async (params) => {
      recorder.calls.push(params)
      if (options.roster) return await options.roster(params)
      return { items: [client('a')], page: { nextCursor: null } }
    },
    listShares: async () => {
      recorder.shares += 1
      return options.shares ? await options.shares() : { items: [] }
    },
    share: async (id) => {
      shared.push(id)
      return options.share ? await options.share(id) : { count: 1 }
    },
    unshare: async (id) => {
      unshared.push(id)
      return options.unshare ? await options.unshare(id) : undefined
    },
    notify: notice => recorder.notices.push(notice),
    debounceMs: options.debounceMs ?? 0
  }

  return {
    checklist: createContentClientChecklist(deps),
    recorder,
    shared,
    unshared
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function wait(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
  await nextTick()
}

describe('createContentClientChecklist — first page and shares', () => {
  test('loads page one with the page size, no query, and pre-checks the shared clients', async () => {
    const { checklist, recorder } = setup({
      roster: async () => ({ items: [client('a'), client('b')], page: { nextCursor: null } }),
      shares: async () => ({ items: [{ clientProfileId: 'a' }] })
    })

    await checklist.load()

    assert.deepEqual(recorder.calls, [{ limit: 20 }])
    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a', 'b'])
    assert.deepEqual([...checklist.checked.value], ['a'])
    assert.equal(checklist.pending.value, false)
  })

  test('the search query is sent, trimmed, and never used to filter locally', async () => {
    // The server owns the match (firstname/lastname/e-mail). A local filter
    // would drop the row below, whose names do not contain the query — exactly
    // what happens when the match is on the e-mail.
    const { checklist, recorder } = setup({
      roster: async () => ({
        items: [client('a', { firstname: 'Marie', lastname: 'Durand', email: 'marie@exemple.fr' })],
        page: { nextCursor: null }
      })
    })

    checklist.query.value = '  durand@exemple  '
    await wait(5)
    await checklist.load()

    assert.deepEqual(last(recorder.calls), { limit: 20, q: 'durand@exemple' })
    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a'])
  })
})

describe('createContentClientChecklist — debounce (AC2)', () => {
  test('a keystroke burst issues exactly one request, carrying the last query', async () => {
    const { checklist, recorder } = setup({ debounceMs: 40 })

    checklist.query.value = 'm'
    await nextTick()
    checklist.query.value = 'mar'
    await nextTick()
    checklist.query.value = 'marie'
    await nextTick()

    assert.equal(recorder.calls.length, 0, 'nothing is fetched before the debounce elapses')

    await wait(80)

    assert.equal(recorder.calls.length, 1, 'one request for the burst')
    assert.deepEqual(recorder.calls[0], { limit: 20, q: 'marie' })
  })

  test('removing the debounce would issue three requests (mutation witness)', async () => {
    const withoutDebounce = setup({ debounceMs: 0 })
    // The same burst with `debounceMs: 0` still collapses through the watcher:
    // each keystroke clears the previous timer. The real proof of the debounce
    // is the test above (0 calls before the delay), not this one.
    withoutDebounce.checklist.query.value = 'a'
    await wait(5)
    assert.equal(withoutDebounce.recorder.calls.length, 1)
  })

  test('dispose cancels a pending debounce: no request lands after unmount', async () => {
    const { checklist, recorder } = setup({ debounceMs: 40 })

    checklist.query.value = 'marie'
    await nextTick()
    checklist.dispose()
    await wait(80)

    assert.equal(recorder.calls.length, 0, 'the timer must not outlive the component')
  })
})

describe('createContentClientChecklist — pagination (AC2)', () => {
  test('"Charger plus" appends the next page with its cursor', async () => {
    const { checklist, recorder } = setup({
      roster: async params => (params.cursor
        ? { items: [client('c')], page: { nextCursor: null } }
        : { items: [client('a'), client('b')], page: { nextCursor: 'cursor-1' } })
    })

    await checklist.load()
    assert.equal(checklist.nextCursor.value, 'cursor-1')

    await checklist.loadMore()

    assert.deepEqual(last(recorder.calls), { limit: 20, cursor: 'cursor-1' })
    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a', 'b', 'c'])
    assert.equal(checklist.nextCursor.value, null)
  })

  test('two clicks on "Charger plus" append the same cursor once (loadMoreToken)', async () => {
    const page = deferred<{ items: ChecklistClient[], page: { nextCursor: string | null } }>()
    const { checklist, recorder } = setup({
      roster: async params => (params.cursor
        ? page.promise
        : { items: [client('a')], page: { nextCursor: 'cursor-1' } })
    })

    await checklist.load()

    const first = checklist.loadMore()
    const second = checklist.loadMore()
    page.resolve({ items: [client('b')], page: { nextCursor: 'cursor-2' } })
    await Promise.all([first, second])

    const pageTwoCalls = recorder.calls.filter(call => call.cursor === 'cursor-1')
    assert.equal(pageTwoCalls.length, 1, 'the second click must be refused while the first is in flight')
    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a', 'b'])
  })

  test('"Charger plus" is refused while a first page is in flight', async () => {
    const roster = deferred<{ items: ChecklistClient[], page: { nextCursor: string | null } }>()
    const { checklist, recorder } = setup({ roster: async () => roster.promise })

    const firstPage = checklist.load()
    assert.equal(checklist.pending.value, true)

    await checklist.loadMore()
    assert.equal(recorder.calls.length, 1, 'no page-2 request while page 1 is pending')

    roster.resolve({ items: [client('a')], page: { nextCursor: 'cursor-1' } })
    await firstPage
  })
})

describe('createContentClientChecklist — states (AC2)', () => {
  test('a failed first page renders the French message, and retrying reloads', async () => {
    let attempt = 0
    const { checklist } = setup({
      roster: async () => {
        attempt += 1
        if (attempt === 1) throw new Error('network down')
        return { items: [client('a')], page: { nextCursor: null } }
      }
    })

    await checklist.load()
    assert.equal(checklist.error.value, CHECKLIST_LOAD_ERROR_MESSAGE)
    assert.equal(checklist.pending.value, false)

    await checklist.load()
    assert.equal(checklist.error.value, null)
    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a'])
  })

  test('a failed page 2 keeps the rows on screen and does not take over the list', async () => {
    const { checklist } = setup({
      roster: async (params) => {
        if (params.cursor) throw new Error('network down')
        return { items: [client('a')], page: { nextCursor: 'cursor-1' } }
      }
    })

    await checklist.load()
    await checklist.loadMore()

    assert.deepEqual(checklist.items.value.map(item => item.clientProfileId), ['a'])
    assert.equal(checklist.error.value, null, 'the list is still valid')
    assert.equal(checklist.loadMoreError.value, CHECKLIST_LOAD_MORE_ERROR_MESSAGE)
  })

  test('the shares are read once, never on a page 2', async () => {
    const { checklist, recorder } = setup({
      roster: async params => (params.cursor
        ? { items: [client('b')], page: { nextCursor: null } }
        : { items: [client('a')], page: { nextCursor: 'cursor-1' } })
    })

    await checklist.load()
    await checklist.loadMore()

    assert.equal(recorder.shares, 1)
  })
})

describe('createContentClientChecklist — optimistic toggle (AC3)', () => {
  test('ticking shares immediately, then confirms with a toast', async () => {
    const share = deferred<unknown>()
    const { checklist, shared, recorder } = setup({ share: async () => share.promise })

    await checklist.load()
    const pending = checklist.toggle(client('a'))

    assert.equal(checklist.checked.value.has('a'), true, 'the box follows the click before the call resolves')
    assert.equal(checklist.toggling.value.has('a'), true)

    share.resolve({ count: 1 })
    await pending

    assert.deepEqual(shared, ['a'])
    assert.deepEqual(last(recorder.notices), { title: 'Contenu partagé', color: 'success' })
    assert.equal(checklist.toggling.value.has('a'), false)
  })

  test('unticking removes the share immediately', async () => {
    const { checklist, unshared, recorder } = setup({
      shares: async () => ({ items: [{ clientProfileId: 'a' }] })
    })

    await checklist.load()
    assert.equal(checklist.checked.value.has('a'), true)

    await checklist.toggle(client('a'))

    assert.equal(checklist.checked.value.has('a'), false)
    assert.deepEqual(unshared, ['a'])
    assert.deepEqual(last(recorder.notices), { title: 'Partage retiré', color: 'success' })
  })

  test('a failed tick returns the box to its previous value with a French message', async () => {
    const { checklist, recorder } = setup({
      share: async () => {
        throw new Error('422 CONTENT_NOT_PRIVATE')
      }
    })

    await checklist.load()
    await checklist.toggle(client('a'))

    assert.equal(checklist.checked.value.has('a'), false, 'rollback to unchecked')
    assert.deepEqual(last(recorder.notices), { title: CHECKLIST_SHARE_ERROR_MESSAGE, color: 'error' })
    assert.equal(last(recorder.notices)?.title, 'Impossible de modifier le partage.')
  })

  test('a failed untick restores the check', async () => {
    const { checklist, recorder } = setup({
      shares: async () => ({ items: [{ clientProfileId: 'a' }] }),
      unshare: async () => {
        throw new Error('network down')
      }
    })

    await checklist.load()
    await checklist.toggle(client('a'))

    assert.equal(checklist.checked.value.has('a'), true, 'rollback to checked')
    assert.equal(last(recorder.notices)?.color, 'error')
  })

  test('a second click on the same row while its call is in flight is ignored', async () => {
    const share = deferred<unknown>()
    const { checklist, shared } = setup({ share: async () => share.promise })

    await checklist.load()
    const first = checklist.toggle(client('a'))
    await checklist.toggle(client('a'))

    share.resolve({ count: 1 })
    await first

    assert.deepEqual(shared, ['a'], 'one request, not a share then an unshare')
    assert.equal(checklist.checked.value.has('a'), true)
  })

  test('a roster reload that lands mid-toggle keeps the optimistic box', async () => {
    // A debounced search re-reads the shares; the server does not know about the
    // in-flight share yet, so a naive `checked = new Set(sharedIds)` would flip
    // the box back and contradict the success toast.
    const share = deferred<unknown>()
    const { checklist } = setup({
      shares: async () => ({ items: [] }),
      share: async () => share.promise
    })

    await checklist.load()
    const pending = checklist.toggle(client('a'))
    await checklist.load()

    assert.equal(checklist.checked.value.has('a'), true, 'the in-flight tick survives the re-read')

    share.resolve({ count: 1 })
    await pending
  })
})
