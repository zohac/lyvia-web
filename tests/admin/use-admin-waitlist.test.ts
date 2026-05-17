/**
 * Story 0-33 — Codex F7 + F4 behavioural coverage for the admin waitlist
 * store. Tests run against `createAdminWaitlistStore({ service })` with a
 * fake service injected — proving that:
 *
 *  - fetchInitial returns 2 leads → store.items.value reflects them,
 *  - clicking "Marquer contacté" calls service.updateStatus(id, 'contacted')
 *    AND updates the row before resolution (optimistic) THEN reconciles,
 *  - an empty list response triggers `isEmpty` true,
 *  - debounce search → service called once after 300 ms.
 *
 * Also covers F4 helpers in isolation: applyOptimisticStatus, restoreSnapshot.
 *
 * The store is the same code path the panel imports — we are testing the
 * actual implementation, not a reimplementation.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  createAdminWaitlistStore,
  type AdminWaitlistService
} from '../../app/features/admin/admin-waitlist-store'
import {
  applyOptimisticStatus,
  createDebouncer,
  restoreSnapshot
} from '../../app/features/admin/admin-waitlist-helpers'
import type {
  AdminWaitlistLead,
  ListAdminWaitlistResponse,
  WaitlistStatus
} from '../../app/features/admin/api/admin-waitlist.contract'

function lead(overrides: Partial<AdminWaitlistLead> & { id: string }): AdminWaitlistLead {
  return {
    firstName: 'Test',
    lastName: 'Lead',
    email: `${overrides.id}@example.com`,
    specialty: 'naturopathie',
    status: 'pending',
    message: null,
    createdAt: '2026-05-01T10:00:00.000Z',
    contactedAt: null,
    onboardedAt: null,
    updatedAt: '2026-05-01T10:00:00.000Z',
    ...overrides
  }
}

function buildService(): {
  service: AdminWaitlistService
  listCalls: Array<unknown>
  updateCalls: Array<{ id: string, status: WaitlistStatus }>
  setListResponse: (r: ListAdminWaitlistResponse) => void
  setUpdateBehavior: (fn: (id: string, status: WaitlistStatus) => Promise<AdminWaitlistLead>) => void
} {
  const listCalls: Array<unknown> = []
  const updateCalls: Array<{ id: string, status: WaitlistStatus }> = []
  let nextListResponse: ListAdminWaitlistResponse = {
    items: [],
    page: { limit: 50, nextCursor: null }
  }
  let updateBehavior = async (_id: string, _s: WaitlistStatus): Promise<AdminWaitlistLead> => {
    throw new Error('updateBehavior not set')
  }
  const service: AdminWaitlistService = {
    list: async (filters) => {
      listCalls.push(filters)
      return nextListResponse
    },
    updateStatus: async (id, status) => {
      updateCalls.push({ id, status })
      return updateBehavior(id, status)
    }
  }
  return {
    service,
    listCalls,
    updateCalls,
    setListResponse: (r) => { nextListResponse = r },
    setUpdateBehavior: (fn) => { updateBehavior = fn }
  }
}

describe('0-33 — createAdminWaitlistStore (Codex F7 — real behavioural tests)', () => {
  test('fetchInitial: mounts store with mock service returning 2 leads → items.value === 2 + isEmpty=false + initialized=true', async () => {
    const fake = buildService()
    fake.setListResponse({
      items: [
        lead({ id: 'a' }),
        lead({ id: 'b', status: 'contacted' })
      ],
      page: { limit: 50, nextCursor: null }
    })
    const store = createAdminWaitlistStore({ service: fake.service })

    await store.fetchInitial()

    assert.equal(store.items.value.length, 2)
    assert.equal(store.items.value[0].id, 'a')
    assert.equal(store.items.value[1].status, 'contacted')
    assert.equal(store.initialized.value, true)
    assert.equal(store.loading.value, false)
    assert.equal(store.isEmpty.value, false)
    assert.equal(store.nextCursor.value, null)
  })

  test('fetchInitial: empty response → isEmpty=true after init', async () => {
    const fake = buildService()
    fake.setListResponse({ items: [], page: { limit: 50, nextCursor: null } })
    const store = createAdminWaitlistStore({ service: fake.service })

    await store.fetchInitial()

    assert.equal(store.items.value.length, 0)
    assert.equal(store.initialized.value, true)
    assert.equal(store.isEmpty.value, true)
  })

  test('updateStatus: clicking "Marquer contacté" calls service with id + contacted, then reconciles row with server timestamps', async () => {
    const fake = buildService()
    fake.setListResponse({
      items: [lead({ id: 'a', status: 'pending' })],
      page: { limit: 50, nextCursor: null }
    })
    fake.setUpdateBehavior(async (id, status) => lead({
      id,
      status,
      contactedAt: '2026-05-17T08:00:00.000Z',
      updatedAt: '2026-05-17T08:00:00.000Z'
    }))
    const store = createAdminWaitlistStore({ service: fake.service })
    await store.fetchInitial()

    const result = await store.updateStatus('a', 'contacted')

    assert.deepEqual(fake.updateCalls, [{ id: 'a', status: 'contacted' }])
    assert.equal(result.status, 'contacted')
    // Row reconciled with server payload (timestamps copied across)
    assert.equal(store.items.value[0].status, 'contacted')
    assert.equal(store.items.value[0].contactedAt, '2026-05-17T08:00:00.000Z')
    assert.equal(store.items.value[0].updatedAt, '2026-05-17T08:00:00.000Z')
  })

  test('Codex F4: updateStatus is truly optimistic — row reflects new status BEFORE the service promise resolves', async () => {
    const fake = buildService()
    fake.setListResponse({
      items: [lead({ id: 'a', status: 'pending' })],
      page: { limit: 50, nextCursor: null }
    })

    // Hold the service promise so we can inspect the store state mid-flight.
    let releaseUpdate!: (l: AdminWaitlistLead) => void
    const updatePromise = new Promise<AdminWaitlistLead>((res) => {
      releaseUpdate = res
    })
    fake.setUpdateBehavior(async () => updatePromise)

    const store = createAdminWaitlistStore({ service: fake.service })
    await store.fetchInitial()
    assert.equal(store.items.value[0].status, 'pending')

    const pending = store.updateStatus('a', 'contacted')
    // Optimistic patch: the row already shows 'contacted' BEFORE the
    // service has resolved. This is the F4 invariant.
    assert.equal(store.items.value[0].status, 'contacted')

    releaseUpdate(lead({
      id: 'a',
      status: 'contacted',
      contactedAt: '2026-05-17T08:00:00.000Z',
      updatedAt: '2026-05-17T08:00:00.000Z'
    }))
    await pending
    // After reconciliation the timestamps are populated.
    assert.equal(store.items.value[0].contactedAt, '2026-05-17T08:00:00.000Z')
  })

  test('Codex F4: updateStatus rolls back the row when the service rejects', async () => {
    const fake = buildService()
    const originalLead = lead({ id: 'a', status: 'pending' })
    fake.setListResponse({
      items: [originalLead],
      page: { limit: 50, nextCursor: null }
    })
    fake.setUpdateBehavior(async () => {
      throw new Error('500 internal')
    })
    const store = createAdminWaitlistStore({ service: fake.service })
    await store.fetchInitial()

    await assert.rejects(() => store.updateStatus('a', 'contacted'), /500 internal/)
    // Row is restored to its pre-call snapshot.
    assert.equal(store.items.value[0].status, 'pending')
    assert.equal(store.items.value[0].contactedAt, null)
  })

  test('applyFilters({ search }) debounces and calls service once after 300 ms', async () => {
    const fake = buildService()
    fake.setListResponse({ items: [], page: { limit: 50, nextCursor: null } })
    const store = createAdminWaitlistStore({ service: fake.service, debounceMs: 80 })

    await store.fetchInitial() // listCalls = 1

    store.applyFilters({ search: 'd' })
    store.applyFilters({ search: 'du' })
    store.applyFilters({ search: 'dup' })
    store.applyFilters({ search: 'dupont' })

    // Before debounce: only the initial call has happened.
    assert.equal(fake.listCalls.length, 1)

    await new Promise(r => setTimeout(r, 130))

    // After debounce: one additional list() call coalesced from 4 keystrokes.
    assert.equal(fake.listCalls.length, 2)
    const lastFilter = fake.listCalls[1] as { search?: string }
    assert.equal(lastFilter.search, 'dupont')
  })

  test('applyFilters({ status }) bypasses debounce and fires immediately', async () => {
    const fake = buildService()
    fake.setListResponse({ items: [], page: { limit: 50, nextCursor: null } })
    const store = createAdminWaitlistStore({ service: fake.service, debounceMs: 80 })

    await store.fetchInitial()
    store.applyFilters({ status: 'pending' })
    // Allow the microtask queue to drain so fetchInitial schedules itself.
    await new Promise(r => setTimeout(r, 0))

    assert.equal(fake.listCalls.length, 2)
    const lastFilter = fake.listCalls[1] as { status?: string }
    assert.equal(lastFilter.status, 'pending')
  })
})

describe('0-33 — Codex F4 helpers (pure optimistic + restore)', () => {
  test('applyOptimisticStatus replaces only the status on the matching lead', () => {
    type L = { id: string, status: 'pending' | 'contacted', email: string }
    const list: L[] = [
      { id: 'a', status: 'pending', email: 'a@x' },
      { id: 'b', status: 'pending', email: 'b@x' }
    ]
    const next = applyOptimisticStatus(list, 'b', 'contacted')
    assert.equal(next[0].status, 'pending')
    assert.equal(next[1].status, 'contacted')
    assert.equal(next[1].email, 'b@x')
    assert.notEqual(next, list)
  })

  test('restoreSnapshot swaps the lead back to its original reference', () => {
    type L = { id: string, status: 'pending' | 'contacted', email: string }
    const original: L = { id: 'a', status: 'pending', email: 'a@x' }
    const optimistic: L[] = [{ id: 'a', status: 'contacted', email: 'a@x' }]
    const restored = restoreSnapshot(optimistic, original)
    assert.equal(restored[0].status, 'pending')
    assert.equal(restored[0], original)
  })

  test('createDebouncer still coalesces multiple schedules', async () => {
    const d = createDebouncer()
    let calls = 0
    const inc = () => {
      calls += 1
    }
    d.schedule(inc, 30)
    d.schedule(inc, 30)
    d.schedule(inc, 30)
    await new Promise(r => setTimeout(r, 60))
    assert.equal(calls, 1)
  })
})
