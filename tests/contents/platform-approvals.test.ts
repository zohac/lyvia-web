import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  applyApprovalToList,
  platformApprovalActionLabel,
  platformApprovalErrorMessage,
  platformApprovalStatusLabel,
  platformApprovalToastMessage,
  platformExcerpt,
  rollbackApprovalToList,
  snapshotApproval
} from '../../app/features/contents/domain/platform-approvals'
import { createPlatformContents } from '../../app/features/contents/createPlatformContents'
import type { PlatformContentItem, ListPlatformContentsResponse } from '../../app/features/contents/api/contents.contract'
import {
  buildApprovePlatformContentCall,
  buildListPlatformContentsCall,
  buildWithdrawPlatformApprovalCall
} from '../../app/features/contents/api/platform-contents.request'

function item(id: string, approved = false, body: string | null = 'corps'): PlatformContentItem {
  return {
    id,
    title: `Article ${id}`,
    type: 'article',
    slug: id,
    body,
    coverImageUrl: null,
    isPublished: true,
    publishedAt: '2026-11-01T00:00:00.000Z',
    approved,
    document: null
  }
}

describe('platform-approvals domain helpers', () => {
  test('status labels are verbatim', () => {
    assert.equal(platformApprovalStatusLabel(true), 'Visible par vos clientes')
    assert.equal(platformApprovalStatusLabel(false), 'Non visible')
  })

  test('action labels are verbatim', () => {
    assert.equal(platformApprovalActionLabel(false), 'Rendre visible à mes clientes')
    assert.equal(platformApprovalActionLabel(true), 'Ne plus rendre visible')
  })

  test('toast messages differ by direction', () => {
    assert.equal(platformApprovalToastMessage(true), 'Article rendu visible à vos clientes.')
    assert.equal(platformApprovalToastMessage(false), 'Article retiré de la vue de vos clientes.')
  })

  test('error message is French', () => {
    assert.match(platformApprovalErrorMessage(), /Impossible/)
  })

  test('applyApprovalToList updates only the targeted item', () => {
    const items = [item('a', false), item('b', true)]
    const next = applyApprovalToList(items, 'a', true)
    assert.equal(next[0].approved, true)
    assert.equal(next[1].approved, true)
    assert.notEqual(next, items)
  })

  test('snapshotApproval returns previous value or null', () => {
    const items = [item('a', false)]
    assert.equal(snapshotApproval(items, 'a'), false)
    assert.equal(snapshotApproval(items, 'zzz'), null)
  })

  test('rollbackApprovalToList restores previous value', () => {
    const items = [item('a', true)]
    const restored = rollbackApprovalToList(items, 'a', false)
    assert.equal(restored[0].approved, false)
  })

  test('rollbackApprovalToList is a no-op when previous is null', () => {
    const items = [item('a', true)]
    const restored = rollbackApprovalToList(items, 'a', null)
    assert.equal(restored[0].approved, true)
  })

  test('platformExcerpt truncates long bodies', () => {
    const long = 'a'.repeat(200)
    const out = platformExcerpt(long, 10)
    assert.equal(out.length, 11) // 10 + ellipsis
    assert.ok(out.endsWith('…'))
  })

  test('platformExcerpt returns empty for null', () => {
    assert.equal(platformExcerpt(null), '')
  })
})

describe('createPlatformContents — list', () => {
  test('refresh loads items and clears pending', async () => {
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a')], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()
    assert.equal(contents.items.value.length, 1)
    assert.equal(contents.pending.value, false)
    assert.equal(contents.errorMessage.value, null)
  })

  test('refresh failure becomes a French message', async () => {
    const contents = createPlatformContents({
      list: async () => { throw new Error('boom') },
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()
    assert.match(contents.errorMessage.value ?? '', /Impossible/)
    assert.equal(contents.pending.value, false)
  })

  test('empty list stays empty', async () => {
    const contents = createPlatformContents({
      list: async () => ({ items: [], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()
    assert.equal(contents.items.value.length, 0)
  })
})

describe('createPlatformContents — approve rollback', () => {
  test('approve optimistically flips to approved and notifies success', async () => {
    const notifications: string[] = []
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', false)], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: (n) => { if (n.title) notifications.push(n.title) }
    })
    await contents.refresh()
    await contents.approveItem('a')
    assert.equal(contents.items.value[0].approved, true)
    assert.ok(notifications.some(n => n.includes('rendu visible')))
  })

  test('approve failure restores the previous state and notifies error', async () => {
    const notifications: string[] = []
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', false)], nextCursor: null }),
      approve: async () => { throw new Error('boom') },
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: (n) => { if (n.title) notifications.push(n.title) }
    })
    await contents.refresh()
    await contents.approveItem('a')
    assert.equal(contents.items.value[0].approved, false)
    assert.ok(notifications.some(n => /Impossible/.test(n)))
  })
})

describe('createPlatformContents — withdraw symmetry', () => {
  test('withdraw flips to not approved and notifies success', async () => {
    const notifications: string[] = []
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', true)], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: (n) => { if (n.title) notifications.push(n.title) }
    })
    await contents.refresh()
    await contents.withdrawItem('a')
    assert.equal(contents.items.value[0].approved, false)
    assert.ok(notifications.some(n => n.includes('retiré')))
  })

  test('withdraw failure restores the previous state', async () => {
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', true)], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async () => { throw new Error('boom') },
      notify: () => {}
    })
    await contents.refresh()
    await contents.withdrawItem('a')
    assert.equal(contents.items.value[0].approved, true)
  })
})

describe('createPlatformContents — preview', () => {
  test('openPreview sets previewItem; closePreview clears it', async () => {
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a')], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()
    contents.openPreview(contents.items.value[0])
    assert.equal(contents.previewItem.value?.id, 'a')
    contents.closePreview()
    assert.equal(contents.previewItem.value, null)
  })
})

describe('createPlatformContents — one in-flight mutation per item', () => {
  test('a second approve on the same item does not issue a second request', async () => {
    let calls = 0
    let resolveApprove!: (value: { contentId: string, approved: boolean }) => void
    const pendingApprove = new Promise<{ contentId: string, approved: boolean }>((resolve) => {
      resolveApprove = resolve
    })
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', false)], nextCursor: null }),
      approve: async () => {
        calls += 1
        return await pendingApprove
      },
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()

    const first = contents.approveItem('a')
    const second = contents.approveItem('a')
    resolveApprove({ contentId: 'a', approved: true })
    await Promise.all([first, second])

    assert.equal(calls, 1)
    assert.equal(contents.items.value[0].approved, true)
  })

  test('a second withdraw on the same item does not issue a second request', async () => {
    let calls = 0
    let resolveWithdraw!: (value: { contentId: string, approved: boolean }) => void
    const pendingWithdraw = new Promise<{ contentId: string, approved: boolean }>((resolve) => {
      resolveWithdraw = resolve
    })
    const contents = createPlatformContents({
      list: async () => ({ items: [item('a', true)], nextCursor: null }),
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async () => {
        calls += 1
        return await pendingWithdraw
      },
      notify: () => {}
    })
    await contents.refresh()

    const first = contents.withdrawItem('a')
    const second = contents.withdrawItem('a')
    resolveWithdraw({ contentId: 'a', approved: false })
    await Promise.all([first, second])

    assert.equal(calls, 1)
    assert.equal(contents.items.value[0].approved, false)
  })
})

describe('createPlatformContents — loadMore ownership', () => {
  test('a stale loadMore neither appends its page nor clears the newer fetch flag', async () => {
    const pendingLoads: Array<(value: ListPlatformContentsResponse) => void> = []
    let pageOneCount = 0

    const contents = createPlatformContents({
      list: async (params) => {
        if (!params?.cursor) {
          pageOneCount += 1
          return { items: [item(`page1-${pageOneCount}`)], nextCursor: 'cursor-1' }
        }
        return await new Promise<ListPlatformContentsResponse>((resolve) => {
          pendingLoads.push(resolve)
        })
      },
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })

    await contents.refresh()
    const stale = contents.loadMore()
    assert.equal(contents.loadMorePending.value, true)

    // A page-1 refresh lands while page 2 is still in flight.
    await contents.refresh()
    const fresh = contents.loadMore()
    assert.equal(pendingLoads.length, 2)

    pendingLoads[0]({ items: [item('stale-page2')], nextCursor: 'cursor-x' })
    await stale
    assert.deepEqual(contents.items.value.map(entry => entry.id), ['page1-2'])
    assert.equal(contents.loadMorePending.value, true)

    pendingLoads[1]({ items: [item('fresh-page2')], nextCursor: null })
    await fresh
    assert.deepEqual(contents.items.value.map(entry => entry.id), ['page1-2', 'fresh-page2'])
    assert.equal(contents.loadMorePending.value, false)
  })

  test('a failed loadMore exposes a French retry message', async () => {
    let page = 0
    const contents = createPlatformContents({
      list: async () => {
        page += 1
        if (page === 1) return { items: [item('a')], nextCursor: 'cursor-1' }
        throw new Error('boom')
      },
      approve: async id => ({ contentId: id, approved: true }),
      withdraw: async id => ({ contentId: id, approved: false }),
      notify: () => {}
    })
    await contents.refresh()
    await contents.loadMore()
    assert.match(contents.loadMoreErrorMessage.value ?? '', /Impossible/)
    assert.equal(contents.loadMorePending.value, false)
  })
})

describe('platform-contents.request builders', () => {
  test('list builder emits GET /provider/platform-content with the query', () => {
    const call = buildListPlatformContentsCall({ limit: 20, cursor: 'abc' })
    assert.equal(call.path, '/provider/platform-content')
    assert.equal(call.options.method, 'GET')
    assert.deepEqual(call.options.query, { limit: 20, cursor: 'abc' })
  })

  test('approve builder emits POST on the approve path', () => {
    const call = buildApprovePlatformContentCall('content-1')
    assert.equal(call.path, '/provider/platform-content/content-1/approve')
    assert.equal(call.options.method, 'POST')
  })

  test('withdraw builder emits DELETE on the same approve path', () => {
    const call = buildWithdrawPlatformApprovalCall('content-1')
    assert.equal(call.path, '/provider/platform-content/content-1/approve')
    assert.equal(call.options.method, 'DELETE')
  })
})
