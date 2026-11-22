import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { nextTick } from 'vue'

import { createClientContents } from '../../app/features/contents/createClientContents'
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
})
