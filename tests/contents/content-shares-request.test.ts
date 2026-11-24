import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildListContentSharesCall,
  buildShareContentCall,
  buildUnshareContentCall
} from '../../app/features/contents/api/content-shares.request'

test('list shares targets GET /provider/content/:id/shares', () => {
  const call = buildListContentSharesCall('abc')
  assert.equal(call.path, '/provider/content/abc/shares')
  assert.equal(call.options.method, 'GET')
  assert.equal(call.options.withAuth, true)
})

test('share targets POST /provider/content/:id/share with body', () => {
  const payload = { clientProfileIds: ['c1', 'c2'] }
  const call = buildShareContentCall('abc', payload)
  assert.equal(call.path, '/provider/content/abc/share')
  assert.equal(call.options.method, 'POST')
  assert.deepEqual(call.options.body, payload)
})

test('share sends only clientProfileIds: `all: true` is no longer a share body', () => {
  // `ShareContentDto` (diffusion-2 AC4) no longer declares `all` — addressing
  // everybody is an audience change on the content, not a share operation.
  const call = buildShareContentCall('abc', { clientProfileIds: ['c1'] })
  assert.deepEqual(Object.keys(call.options.body), ['clientProfileIds'])
})

test('unshare targets DELETE /provider/content/:id/share/:clientProfileId', () => {
  const call = buildUnshareContentCall('abc', 'client-1')
  assert.equal(call.path, '/provider/content/abc/share/client-1')
  assert.equal(call.options.method, 'DELETE')
  assert.equal(call.options.withAuth, true)
})
