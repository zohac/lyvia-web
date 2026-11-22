import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { nextTick } from 'vue'

import { createClientContents, CLIENT_CONTENTS_SEARCH_MAX_LENGTH } from '../../app/features/contents/createClientContents'
import type { ClientContentListItem, ListClientContentsParams, ListClientContentsResponse } from '../../app/features/contents/api/contents.contract'

function makeItem(id: string): ClientContentListItem {
  return {
    id,
    title: `Contenu ${id}`,
    type: 'article',
    slug: id,
    coverImageUrl: null,
    publishedAt: null,
    providerName: 'Sophie',
    providerSlug: 'sophie'
  }
}

function response(ids: string[], nextCursor: string | null = null): ListClientContentsResponse {
  return { items: ids.map(makeItem), nextCursor }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('createClientContents — refresh', () => {
  test('the first page is loaded with the page limit and no filter', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      }
    })

    await contents.refresh()

    assert.deepEqual(calls, [{ limit: 20 }])
    assert.deepEqual(contents.items.value.map(item => item.id), ['a'])
    assert.equal(contents.pending.value, false)
  })

  test('a stale response never overwrites a fresher one', async () => {
    const first = deferred<ListClientContentsResponse>()
    const second = deferred<ListClientContentsResponse>()
    const queue = [first.promise, second.promise]

    const contents = createClientContents({ list: async () => queue.shift()! })

    const stale = contents.refresh()
    const fresh = contents.refresh()

    second.resolve(response(['fresh']))
    first.resolve(response(['stale']))

    await Promise.all([stale, fresh])

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh'])
  })

  test('error state is set and pending cleared on failure', async () => {
    const contents = createClientContents({
      list: async () => {
        throw new Error('boom')
      }
    })

    await contents.refresh()

    assert.equal(contents.pending.value, false)
    assert.ok(contents.errorMessage.value)
    assert.deepEqual(contents.items.value, [])
  })
})

describe('createClientContents — filters', () => {
  test('type filter refetches immediately', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      }
    })

    await contents.refresh()
    calls.length = 0

    contents.typeFilter.value = 'recette'
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()

    assert.equal(calls.length, 1)
    assert.equal(calls[0].type, 'recette')
  })

  test('search query is debounced', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      },
      debounceMs: 10
    })

    await contents.refresh()
    calls.length = 0

    contents.searchQuery.value = 'hello'
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()
    assert.equal(calls.length, 0)

    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].q, 'hello')
  })
})

describe('createClientContents — pagination', () => {
  test('loadMore appends when cursor present', async () => {
    const calls: ListClientContentsParams[] = []
    let n = 0
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        return response(['b'], null)
      }
    })

    await contents.refresh()
    assert.equal(contents.nextCursor.value, 'cursor-1')

    await contents.loadMore()

    assert.deepEqual(contents.items.value.map(item => item.id), ['a', 'b'])
    assert.equal(contents.nextCursor.value, null)
  })

  test('loadMore does nothing without cursor', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'], null)
      }
    })

    await contents.refresh()
    const before = calls.length
    await contents.loadMore()
    assert.equal(calls.length, before)
  })
})

describe('createClientContents — loadMore errors', () => {
  test('loadMore sets loadMoreErrorMessage when the second page rejects', async () => {
    let n = 0
    const contents = createClientContents({
      list: async () => {
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        throw new Error('boom')
      }
    })

    await contents.refresh()
    assert.equal(contents.nextCursor.value, 'cursor-1')

    await contents.loadMore()

    assert.equal(contents.loadMorePending.value, false)
    assert.ok(contents.loadMoreErrorMessage.value)
    assert.deepEqual(contents.items.value.map(item => item.id), ['a'])
  })

  test('loadMore refreshes page 1 when a search is pending', async () => {
    const calls: ListClientContentsParams[] = []
    let n = 0
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        return response(['b'], null)
      },
      debounceMs: 50
    })

    await contents.refresh()
    calls.length = 0

    contents.searchQuery.value = 'hello'
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()

    await contents.loadMore()

    assert.equal(calls.length, 1)
    assert.equal(calls[0].q, 'hello')
    assert.equal(contents.nextCursor.value, null)
  })

  test('loadMore is refused while a refresh is in flight, so two queries cannot be mixed', async () => {
    // `refresh()` does not clear `nextCursor`: during a filter change the
    // button is still on screen pointing at the PREVIOUS query's page 2.
    // Fetching it would append the old result set under the new query.
    const calls: ListClientContentsParams[] = []
    const second = deferred<ListClientContentsResponse>()
    let n = 0
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        return second.promise
      }
    })

    await contents.refresh()
    calls.length = 0

    const refreshing = contents.refresh()
    // Not awaited before the assertion: if the guard is removed this call
    // waits on `second`, and awaiting it here would hang instead of failing.
    const more = contents.loadMore()
    await Promise.resolve()

    assert.equal(calls.length, 1, 'no page-2 call while page 1 is being refetched')
    assert.equal(calls[0].cursor, undefined)

    second.resolve(response(['fresh']))
    await Promise.all([refreshing, more])

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh'])
    assert.equal(contents.loadMorePending.value, false)
  })

  test('a page 2 started before a refresh is dropped instead of appended', async () => {
    const firstPageTwo = deferred<ListClientContentsResponse>()
    let n = 0
    const contents = createClientContents({
      list: async () => {
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        if (n === 2) return firstPageTwo.promise
        return response(['fresh'], null)
      }
    })

    await contents.refresh()
    const stale = contents.loadMore()
    await contents.refresh()
    firstPageTwo.resolve(response(['stale-b']))
    await stale

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh'])
  })

  test('a stale page 2 cannot clear the loading flag of a newer one', async () => {
    // `loadMore` does not bump `requestId`, so two page-2 calls of the same
    // query share it. Without an owner token, the stale one's `finally` lets a
    // third click start while the second is still in flight — and two appends
    // of the same cursor duplicate every card.
    const pageTwoA = deferred<ListClientContentsResponse>()
    const pageTwoB = deferred<ListClientContentsResponse>()
    let n = 0
    const contents = createClientContents({
      list: async () => {
        n += 1
        if (n === 1) return response(['a'], 'cursor-1')
        if (n === 2) return pageTwoA.promise
        if (n === 3) return response(['fresh'], 'cursor-2')
        return pageTwoB.promise
      }
    })

    await contents.refresh()
    const stale = contents.loadMore()
    await contents.refresh()
    const fresh = contents.loadMore()

    pageTwoA.resolve(response(['stale-b']))
    await stale

    assert.equal(contents.loadMorePending.value, true, 'the in-flight page 2 still owns the flag')

    pageTwoB.resolve(response(['b'], null))
    await fresh

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh', 'b'])
    assert.equal(contents.loadMorePending.value, false)
  })
})

describe('createClientContents — query bounds and filter reset', () => {
  test('the search query is truncated to the contract bound before it is sent', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      },
      debounceMs: 5
    })

    await contents.refresh()
    calls.length = 0

    contents.searchQuery.value = 'x'.repeat(250)
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(calls.length, 1)
    assert.equal(calls[0].q?.length, CLIENT_CONTENTS_SEARCH_MAX_LENGTH)
  })

  test('hasActiveFilters follows both filters, and resetFilters clears them in one refresh', async () => {
    const calls: ListClientContentsParams[] = []
    const contents = createClientContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      },
      debounceMs: 5
    })

    await contents.refresh()
    assert.equal(contents.hasActiveFilters.value, false)

    contents.typeFilter.value = 'recette'
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()
    assert.equal(contents.hasActiveFilters.value, true)

    calls.length = 0
    contents.resetFilters()
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(contents.typeFilter.value, 'all')
    assert.equal(contents.searchQuery.value, '')
    assert.equal(contents.hasActiveFilters.value, false)
    assert.equal(calls.length, 1, 'resetting both filters must refetch once, not twice')
    assert.deepEqual(calls[0], { limit: 20 })
  })
})
