import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCreateContentCall,
  buildDeleteContentCall,
  buildGetContentCall,
  buildListContentsCall,
  buildPublishContentCall,
  buildUnpublishContentCall,
  buildUpdateContentCall
} from '../../app/features/contents/api/provider-contents.request'

test('list contents targets GET /provider/content with cleaned query', () => {
  const call = buildListContentsCall({ type: 'article', status: 'draft', q: 'hello', limit: 10, cursor: 'c1' })
  assert.equal(call.path, '/provider/content')
  assert.equal(call.options.method, 'GET')
  assert.equal(call.options.withAuth, true)
  assert.deepEqual(call.options.query, { type: 'article', status: 'draft', q: 'hello', limit: 10, cursor: 'c1' })
})

test('list contents drops empty filters', () => {
  const call = buildListContentsCall({})
  assert.deepEqual(call.options.query, {})
})

test('get content targets GET /provider/content/:id', () => {
  const call = buildGetContentCall('abc')
  assert.equal(call.path, '/provider/content/abc')
  assert.equal(call.options.method, 'GET')
})

test('create content targets POST /provider/content with body', () => {
  const payload = { title: 'T', type: 'article' as const }
  const call = buildCreateContentCall(payload)
  assert.equal(call.path, '/provider/content')
  assert.equal(call.options.method, 'POST')
  assert.deepEqual(call.options.body, payload)
})

test('update content targets PATCH /provider/content/:id', () => {
  const payload = { title: 'T2' }
  const call = buildUpdateContentCall('abc', payload)
  assert.equal(call.path, '/provider/content/abc')
  assert.equal(call.options.method, 'PATCH')
  assert.deepEqual(call.options.body, payload)
})

test('publish/unpublish/delete target correct paths and verbs', () => {
  assert.deepEqual(buildPublishContentCall('abc'), { path: '/provider/content/abc/publish', options: { method: 'POST', withAuth: true } })
  assert.deepEqual(buildUnpublishContentCall('abc'), { path: '/provider/content/abc/unpublish', options: { method: 'POST', withAuth: true } })
  assert.deepEqual(buildDeleteContentCall('abc'), { path: '/provider/content/abc', options: { method: 'DELETE', withAuth: true } })
})