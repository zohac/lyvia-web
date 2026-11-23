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
import type { PlatformContentItem } from '../../app/features/contents/api/contents.contract'

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
    approved
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
