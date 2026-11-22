/**
 * Story 5.5 — execution tests for the provider contents list state machine.
 *
 * `createProviderContents` carries the race guards, the filter wiring and the
 * cursor pagination behind `/provider/content`. It imports only `vue`, so the
 * behaviour is executed here with a fake transport and no Nuxt context.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { nextTick } from 'vue'

import { createProviderContents } from '../../app/features/contents/createProviderContents'
import type { ContentItem, ListContentsParams, ListContentsResponse } from '../../app/features/contents/api/contents.contract'

function makeItem(id: string): ContentItem {
  return {
    id,
    providerId: 'provider-1',
    title: `Contenu ${id}`,
    type: 'article',
    slug: id,
    body: 'corps',
    coverImageUrl: null,
    visibility: 'public',
    isPublished: false,
    publishedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z'
  }
}

function response(ids: string[], nextCursor: string | null = null): ListContentsResponse {
  return { items: ids.map(makeItem), nextCursor }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function lastCall(calls: ListContentsParams[]): ListContentsParams | undefined {
  return calls[calls.length - 1]
}

async function flushDebounce() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

describe('createProviderContents — refresh', () => {
  test('the first page is loaded with the page limit and no filter', async () => {
    const calls: ListContentsParams[] = []
    const contents = createProviderContents({
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
    const first = deferred<ListContentsResponse>()
    const second = deferred<ListContentsResponse>()
    const queue = [first.promise, second.promise]

    const contents = createProviderContents({ list: async () => queue.shift()! })

    const stale = contents.refresh()
    const fresh = contents.refresh()

    second.resolve(response(['fresh']))
    await fresh
    first.resolve(response(['stale']))
    await stale

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh'])
  })

  test('a failed load becomes a French message and never leaves the screen pending', async () => {
    const contents = createProviderContents({
      list: async () => {
        throw new Error('Failed to fetch')
      }
    })

    await contents.refresh()

    assert.equal(contents.errorMessage.value, 'Impossible de charger les contenus. Veuillez réessayer.')
    assert.equal(contents.pending.value, false)
  })
})

describe('createProviderContents — filters', () => {
  test('a type filter change re-issues the request at once with the new type', async () => {
    const calls: ListContentsParams[] = []
    const contents = createProviderContents({
      list: async (params) => {
        calls.push(params)
        return response([])
      }
    })

    await contents.refresh()
    contents.typeFilter.value = 'recette'
    await nextTick()

    assert.deepEqual(lastCall(calls), { limit: 20, type: 'recette' })
  })

  test('a status filter change re-issues the request with the new status', async () => {
    const calls: ListContentsParams[] = []
    const contents = createProviderContents({
      list: async (params) => {
        calls.push(params)
        return response([])
      }
    })

    await contents.refresh()
    contents.statusFilter.value = 'published'
    await nextTick()

    assert.deepEqual(lastCall(calls), { limit: 20, status: 'published' })
  })

  test('a search keystroke is debounced into one request carrying the trimmed query', async () => {
    const calls: ListContentsParams[] = []
    const contents = createProviderContents({
      list: async (params) => {
        calls.push(params)
        return response([])
      },
      debounceMs: 0
    })

    await contents.refresh()
    contents.searchQuery.value = 'm'
    await nextTick()
    contents.searchQuery.value = 'méno'
    await nextTick()

    assert.equal(calls.length, 1, 'nothing is fetched before the debounce elapses')

    await flushDebounce()

    assert.deepEqual(lastCall(calls), { limit: 20, q: 'méno' })
    assert.equal(calls.length, 2)
  })

  test('a filter change resets the cursor', async () => {
    const contents = createProviderContents({
      list: async params => response(params.cursor ? ['page-2'] : ['page-1'], 'cursor-1')
    })

    await contents.refresh()
    await contents.loadMore()
    assert.equal(contents.items.value.length, 2)

    contents.typeFilter.value = 'article'
    await nextTick()

    assert.equal(contents.nextCursor.value, 'cursor-1')
    assert.deepEqual(contents.items.value.map(item => item.id), ['page-1'])
  })
})

describe('createProviderContents — loadMore', () => {
  test('appends the next page and keeps the new cursor', async () => {
    const contents = createProviderContents({
      list: async params => (params.cursor ? response(['b'], null) : response(['a'], 'cursor-1'))
    })

    await contents.refresh()
    await contents.loadMore()

    assert.deepEqual(contents.items.value.map(item => item.id), ['a', 'b'])
    assert.equal(contents.nextCursor.value, null)
  })

  test('a page started before a refresh is dropped instead of appended', async () => {
    const page = deferred<ListContentsResponse>()
    let refreshCount = 0
    const contents = createProviderContents({
      list: async (params) => {
        if (params.cursor) return page.promise
        refreshCount += 1
        return response([`fresh-${refreshCount}`], 'cursor-1')
      }
    })

    await contents.refresh()
    const loading = contents.loadMore()
    await contents.refresh()

    page.resolve(response(['stale-page'], null))
    await loading

    assert.deepEqual(contents.items.value.map(item => item.id), ['fresh-2'])
  })

  test('clicking "Charger plus" while a search is debouncing reloads page one', async () => {
    const calls: ListContentsParams[] = []
    const contents = createProviderContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'], 'cursor-1')
      }
    })

    await contents.refresh()
    contents.searchQuery.value = 'néo'
    await nextTick()
    await contents.loadMore()

    assert.deepEqual(lastCall(calls), { limit: 20, q: 'néo' })
    assert.equal(calls.some(call => call.cursor === 'cursor-1'), false)
  })

  test('a failed page keeps the rows already on screen', async () => {
    const contents = createProviderContents({
      list: async (params) => {
        if (params.cursor) throw new Error('network down')
        return response(['a'], 'cursor-1')
      }
    })

    await contents.refresh()
    await contents.loadMore()

    assert.deepEqual(contents.items.value.map(item => item.id), ['a'])
    assert.equal(contents.loadMoreErrorMessage.value, 'Impossible de charger plus de contenus.')
    assert.equal(contents.errorMessage.value, null)
  })
})
