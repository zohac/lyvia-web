/**
 * Story 5.6 — the content-sharing state machine, executed directly.
 *
 * The section is a thin renderer over `createContentShares`; everything that
 * decides something lives in the factory so it can be run without a DOM (the
 * project ships no mount framework — see `tests/helpers/render-sfc.ts`).
 *
 * What this file proves, and the mutation that would break it:
 *
 * 1. a private content loads its shares once (`applyVisibility`), a public one
 *    issues no request, and a `public` → `private` return re-fetches instead of
 *    showing the empty list it never loaded — mutation: drop the `previous`
 *    guard, and the "one request" assertion counts 2;
 * 2. load failures surface French copy, never the API's English `message`;
 * 3. a removal is optimistic, rolls back into the **current** list (not a stale
 *    snapshot) and a second click cannot issue a second DELETE;
 * 4. sharing reports the API's created count (0 on a re-share), sends
 *    `{ all: true }` for the bulk path, and never sends an empty selection;
 * 5. the roster search debounces to one request per burst, a new query drops the
 *    previous page cursor, and a slow response cannot overwrite a newer one.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { createContentShares } from '../../app/features/contents/createContentShares'
import type { ContentSharesDeps } from '../../app/features/contents/createContentShares'
import { ApiFetchError } from '../../app/services/api/api-error'
import type { ContentShareItem } from '../../app/features/contents/api/contents.contract'
import type {
  ListProviderClientsParams,
  ListProviderClientsResponse,
  ProviderClientListItem
} from '../../app/features/clients/api/clients.contract'

function share(id: string, sharedAt = '2026-01-01T00:00:00.000Z'): ContentShareItem {
  return { clientProfileId: id, firstname: 'A', lastname: 'B', sharedAt }
}

function client(id: string): ProviderClientListItem {
  return {
    clientProfileId: id,
    firstname: 'X',
    lastname: 'Y',
    email: `${id}@e.com`,
    phone: '',
    stage: 'active',
    onboardingCallDone: true,
    currentProgramMonth: null,
    computedStatus: 'active',
    stats: { consultationsCompleted: 0, appointmentsTotal: 0, lastAppointmentAt: null, nextAppointmentAt: null },
    createdAt: '2026-01-01T00:00:00.000Z',
    hasScheduledDiscovery: false,
    hasActiveDiscovery: false
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Fails instead of hanging: a missing guard must turn red, not wedge CI. */
async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout: ${label}`)), 500)
      })
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const EMPTY_ROSTER = { items: [], page: { limit: 20, nextCursor: null } }

function makeShares(overrides: Partial<ContentSharesDeps> = {}) {
  return createContentShares({
    listShares: async () => ({ items: [] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async () => EMPTY_ROSTER,
    ...overrides
  }, 'content-1')
}

test('loadShares populates the list sorted by sharedAt desc', async () => {
  const cs = makeShares({
    listShares: async () => ({
      items: [share('a', '2026-01-01T00:00:00.000Z'), share('b', '2026-02-01T00:00:00.000Z')]
    })
  })

  await cs.loadShares()
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['b', 'a'])
  assert.equal(cs.pending.value, false)
  assert.equal(cs.error.value, null)
})

test('loadShares surfaces French copy, never the API message', async () => {
  const cs = makeShares({
    listShares: async () => {
      throw new ApiFetchError({ statusCode: 500, code: 'UNKNOWN_ERROR', message: 'Internal server error' })
    }
  })

  await cs.loadShares()
  assert.equal(cs.shared.value.length, 0)
  assert.equal(cs.error.value, 'Impossible de charger les partages.')
})

test('applyVisibility loads once for private and re-fetches after a public spell', async () => {
  let listCalls = 0
  const cs = makeShares({
    listShares: async () => {
      listCalls += 1
      return { items: [share('a')] }
    }
  })

  await cs.applyVisibility('all')
  assert.equal(listCalls, 0, 'a public content must not request its shares')

  await cs.applyVisibility('selected')
  assert.equal(listCalls, 1)

  await cs.applyVisibility('selected')
  assert.equal(listCalls, 1, 'a repeated private must not issue a second request')

  await cs.applyVisibility('all')
  assert.equal(listCalls, 1)

  await cs.applyVisibility('selected')
  assert.equal(listCalls, 2, 'coming back from public must re-fetch, not show a stale list')
})

test('remove optimistically removes then confirms', async () => {
  const unshareCalls: string[] = []
  const cs = makeShares({
    listShares: async () => ({ items: [share('a')] }),
    unshare: async (_contentId, id) => {
      unshareCalls.push(id)
    }
  })

  await cs.loadShares()
  await cs.remove('a')
  assert.deepEqual(cs.shared.value, [])
  assert.deepEqual(unshareCalls, ['a'])
})

test('remove rolls back on failure', async () => {
  const cs = makeShares({
    listShares: async () => ({ items: [share('a')] }),
    unshare: async () => {
      throw new Error('fail')
    }
  })

  await cs.loadShares()
  await assert.rejects(() => cs.remove('a'))
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['a'])
})

test('remove restores into the current list, not a stale snapshot', async () => {
  const cs = makeShares({
    listShares: async () => ({ items: [share('a'), share('b')] }),
    unshare: async (_contentId, id) => {
      if (id === 'a') throw new Error('fail')
    }
  })

  await cs.loadShares()
  const failing = cs.remove('a')
  const succeeding = cs.remove('b')
  await assert.rejects(failing)
  await succeeding

  // `b` was unshared for real: restoring the pre-removal snapshot would show it
  // again as a share that no longer exists.
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['a'])
})

test('remove ignores a second click for the same client', async () => {
  const unshareCalls: string[] = []
  let releaseUnshare!: () => void
  const cs = makeShares({
    listShares: async () => ({ items: [share('a')] }),
    unshare: async (_contentId, id) => {
      unshareCalls.push(id)
      await new Promise<void>((resolve) => {
        releaseUnshare = resolve
      })
    }
  })

  await cs.loadShares()
  const first = cs.remove('a')
  const second = cs.remove('a')
  releaseUnshare()
  await withTimeout(first, 'first remove')
  await withTimeout(second, 'second remove')

  assert.deepEqual(unshareCalls, ['a'])
})

test('shareSelected sends the deduped selection, reloads and closes the selector', async () => {
  const shareCalls: unknown[] = []
  let listCount = 0
  const cs = makeShares({
    listShares: async () => {
      listCount += 1
      return { items: listCount === 1 ? [share('a')] : [share('a'), share('b')] }
    },
    share: async (_contentId, payload) => {
      shareCalls.push(payload)
      return { count: 1 }
    },
    listClients: async () => ({ items: [client('b')], page: { limit: 20, nextCursor: null } })
  })

  await cs.loadShares()
  await cs.openSelector()
  cs.toggleSelected('b')
  const count = await cs.shareSelected()

  assert.equal(count, 1)
  assert.deepEqual(shareCalls, [{ clientProfileIds: ['b'] }])
  assert.equal(cs.selectorOpen.value, false)
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['a', 'b'])
})

test('shareSelected returns 0 without calling the API when nothing is selected', async () => {
  const shareCalls: unknown[] = []
  const cs = makeShares({
    share: async (_contentId, payload) => {
      shareCalls.push(payload)
      return { count: 0 }
    }
  })

  await cs.loadShares()
  await cs.openSelector()
  const count = await cs.shareSelected()

  assert.equal(count, 0)
  assert.equal(shareCalls.length, 0)
})

test('shareSelected is not re-entrant while a request is in flight', async () => {
  const shareCalls: unknown[] = []
  const pending = deferred<{ count: number }>()
  const cs = makeShares({
    share: (_contentId, payload) => {
      shareCalls.push(payload)
      return pending.promise
    }
  })

  await cs.openSelector()
  cs.toggleSelected('b')
  const first = cs.shareSelected()
  const second = await cs.shareSelected()
  pending.resolve({ count: 1 })
  await first

  assert.equal(second, 0)
  assert.equal(shareCalls.length, 1)
})

test('shareAll sends { all: true } and returns the created count', async () => {
  const shareCalls: unknown[] = []
  const cs = makeShares({
    share: async (_contentId, payload) => {
      shareCalls.push(payload)
      return { count: 5 }
    }
  })

  const count = await cs.shareAll()
  assert.equal(count, 5)
  assert.deepEqual(shareCalls, [{ all: true }])
})

test('openSelector loads the roster and hides clients already shared', async () => {
  const cs = makeShares({
    listShares: async () => ({ items: [share('a')] }),
    listClients: async () => ({ items: [client('a'), client('b')], page: { limit: 20, nextCursor: null } })
  })

  await cs.loadShares()
  await cs.openSelector()

  assert.equal(cs.roster.value.length, 2)
  assert.deepEqual(cs.selectableClients.value.map(c => c.clientProfileId), ['b'])
})

test('a roster failure is reported in French', async () => {
  const cs = makeShares({
    listClients: async () => {
      throw new ApiFetchError({ statusCode: 500, code: 'UNKNOWN_ERROR', message: 'Internal server error' })
    }
  })

  await cs.loadRoster('x')
  assert.equal(cs.rosterError.value, 'Impossible de charger la liste des clientes.')
})

test('scheduleRosterSearch issues one request for a burst of keystrokes', async () => {
  const queries: (string | undefined)[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async (params) => {
      queries.push(params.q)
      return EMPTY_ROSTER
    }
  }, 'content-1', { debounceMs: 5 })

  await cs.openSelector()
  cs.scheduleRosterSearch('a')
  cs.scheduleRosterSearch('al')
  cs.scheduleRosterSearch('ali')
  await sleep(20)

  assert.deepEqual(queries, [undefined, 'ali'])
})

test('dispose cancels a pending roster search', async () => {
  const queries: (string | undefined)[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async (params) => {
      queries.push(params.q)
      return EMPTY_ROSTER
    }
  }, 'content-1', { debounceMs: 5 })

  cs.scheduleRosterSearch('ali')
  cs.dispose()
  await sleep(20)

  assert.deepEqual(queries, [])
})

test('loadMoreRoster appends the next page using the returned cursor', async () => {
  const calls: ListProviderClientsParams[] = []
  const cs = makeShares({
    listClients: async (params) => {
      calls.push(params)
      if (params.cursor) return { items: [client('c3')], page: { limit: 20, nextCursor: null } }
      return { items: [client('c1'), client('c2')], page: { limit: 20, nextCursor: 'cursor-1' } }
    }
  })

  await cs.openSelector()
  assert.equal(cs.rosterNextCursor.value, 'cursor-1')

  await cs.loadMoreRoster()
  assert.deepEqual(calls[1], { limit: 20, cursor: 'cursor-1' })
  assert.deepEqual(cs.roster.value.map(c => c.clientProfileId), ['c1', 'c2', 'c3'])
  assert.equal(cs.rosterNextCursor.value, null)
})

test('a new query drops the previous page cursor', async () => {
  const calls: ListProviderClientsParams[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async (params) => {
      calls.push(params)
      return { items: [client('c1')], page: { limit: 20, nextCursor: 'cursor-1' } }
    }
  }, 'content-1', { debounceMs: 5 })

  await cs.openSelector()
  cs.scheduleRosterSearch('bob')
  assert.equal(cs.rosterNextCursor.value, null, 'the old cursor must go before the new page-1 request')

  await cs.loadMoreRoster()
  assert.equal(calls.filter(call => call.cursor !== undefined).length, 0)
})

test('a stale roster response cannot overwrite a newer one', async () => {
  const slow = deferred<ListProviderClientsResponse>()
  const fast = deferred<ListProviderClientsResponse>()
  let calls = 0
  const cs = makeShares({
    listClients: () => {
      calls += 1
      return calls === 1 ? slow.promise : fast.promise
    }
  })

  const firstLoad = cs.loadRoster('a')
  const secondLoad = cs.loadRoster('ab')
  fast.resolve({ items: [client('new')], page: { limit: 20, nextCursor: null } })
  await secondLoad
  slow.resolve({ items: [client('old')], page: { limit: 20, nextCursor: null } })
  await firstLoad

  assert.deepEqual(cs.roster.value.map(c => c.clientProfileId), ['new'])
  assert.equal(cs.rosterPending.value, false)
})
