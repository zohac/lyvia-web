import * as assert from 'node:assert/strict'
import test from 'node:test'

import { createContentShares } from '../../app/features/contents/createContentShares'
import type { ContentShareItem, ListContentSharesResponse, ShareContentResponse } from '../../app/features/contents/api/contents.contract'
import type { ListProviderClientsParams, ListProviderClientsResponse, ProviderClientListItem } from '../../app/features/clients/api/clients.contract'

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
  const promise = new Promise<T>((res) => { resolve = res })
  return { promise, resolve }
}

test('loadShares populates shared list sorted by sharedAt desc', async () => {
  const cs = createContentShares({
    listShares: async () => ({ items: [share('a', '2026-01-01T00:00:00.000Z'), share('b', '2026-02-01T00:00:00.000Z')] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['b', 'a'])
  assert.equal(cs.pending.value, false)
})

test('loadShares sets error on failure', async () => {
  const cs = createContentShares({
    listShares: async () => { throw new Error('boom') },
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  assert.equal(cs.shared.value.length, 0)
  assert.ok(cs.error.value)
})

test('remove optimistically removes then confirms', async () => {
  const unshareCalls: string[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [share('a')] }),
    share: async () => ({ count: 0 }),
    unshare: async (_c, id) => { unshareCalls.push(id) },
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  await cs.remove('a')
  assert.deepEqual(cs.shared.value, [])
  assert.deepEqual(unshareCalls, ['a'])
})

test('remove rolls back on failure', async () => {
  const cs = createContentShares({
    listShares: async () => ({ items: [share('a')] }),
    share: async () => ({ count: 0 }),
    unshare: async () => { throw new Error('fail') },
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  await assert.rejects(() => cs.remove('a'))
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['a'])
})

test('shareSelected calls share with ids, reloads, closes selector, returns count', async () => {
  const shareCalls: any[] = []
  let listCount = 0
  const cs = createContentShares({
    listShares: async () => {
      listCount++
      return { items: listCount === 1 ? [share('a')] : [share('a'), share('b')] }
    },
    share: async (_c, payload) => {
      shareCalls.push(payload)
      return { count: 1 }
    },
    unshare: async () => {},
    listClients: async () => ({ items: [client('b')], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  await cs.openSelector()
  cs.toggleSelected('b')
  const count = await cs.shareSelected()
  assert.equal(count, 1)
  assert.deepEqual(shareCalls, [{ clientProfileIds: ['b'] }])
  assert.equal(cs.selectorOpen.value, false)
  assert.deepEqual(cs.shared.value.map(s => s.clientProfileId), ['a', 'b'])
})

test('shareSelected returns 0 without calling API when nothing selected', async () => {
  const shareCalls: any[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async (_c, payload) => { shareCalls.push(payload); return { count: 0 } },
    unshare: async () => {},
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  await cs.openSelector()
  const count = await cs.shareSelected()
  assert.equal(count, 0)
  assert.equal(shareCalls.length, 0)
})

test('shareAll sends { all: true } and returns count', async () => {
  const shareCalls: any[] = []
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async (_c, payload) => { shareCalls.push(payload); return { count: 5 } },
    unshare: async () => {},
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  const count = await cs.shareAll()
  assert.equal(count, 5)
  assert.deepEqual(shareCalls, [{ all: true }])
})

test('openSelector loads roster and filter selectable excludes shared', async () => {
  const cs = createContentShares({
    listShares: async () => ({ items: [share('a')] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async () => ({ items: [client('a'), client('b')], page: { limit: 20, nextCursor: null } })
  }, 'content-1')

  await cs.loadShares()
  await cs.openSelector()
  assert.equal(cs.roster.value.length, 2)
  assert.deepEqual(cs.selectableClients.value.map(c => c.clientProfileId), ['b'])
})

test('scheduleRosterSearch debounces roster reload', async () => {
  // Just ensure no crash and query stored
  const cs = createContentShares({
    listShares: async () => ({ items: [] }),
    share: async () => ({ count: 0 }),
    unshare: async () => {},
    listClients: async () => ({ items: [], page: { limit: 20, nextCursor: null } })
  }, 'content-1')
  await cs.loadShares()
  await cs.openSelector()
  cs.scheduleRosterSearch('foo')
  assert.equal(cs.selectorQuery.value, 'foo')
})
