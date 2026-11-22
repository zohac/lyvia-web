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

test('share all sends { all: true }', () => {
  const call = buildShareContentCall('abc', { all: true })
  assert.deepEqual(call.options.body, { all: true })
})

test('unshare targets DELETE /provider/content/:id/share/:clientProfileId', () => {
  const call = buildUnshareContentCall('abc', 'client-1')
  assert.equal(call.path, '/provider/content/abc/share/client-1')
  assert.equal(call.options.method, 'DELETE')
  assert.equal(call.options.withAuth, true)
})
