import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGetClientContentCall,
  buildListClientContentsCall
} from '../../app/features/contents/api/client-contents.request'

test('list client contents targets GET /content with the cleaned query', () => {
  const call = buildListClientContentsCall({ type: 'article', q: 'hello', limit: 10, cursor: 'c1' })
  assert.equal(call.path, '/content')
  assert.equal(call.options.method, 'GET')
  assert.equal(call.options.withAuth, true)
  assert.deepEqual(call.options.query, { type: 'article', q: 'hello', limit: 10, cursor: 'c1' })
})

test('list client contents drops empty filters', () => {
  const call = buildListClientContentsCall({})
  assert.deepEqual(call.options.query, {})
})

test('list client contents keeps the page limit and never sends an absent cursor', () => {
  assert.deepEqual(buildListClientContentsCall({ limit: 20 }).options.query, { limit: 20 })
  assert.deepEqual(buildListClientContentsCall({ cursor: 'c1' }).options.query, { cursor: 'c1' })
})

test('get client content targets GET /content/:slug', () => {
  const call = buildGetClientContentCall('mon-article')
  assert.equal(call.path, '/content/mon-article')
  assert.equal(call.options.method, 'GET')
  assert.equal(call.options.withAuth, true)
})

test('get client content encodes the slug instead of letting it reshape the path', () => {
  const call = buildGetClientContentCall('mon article/2026')
  assert.equal(call.path, '/content/mon%20article%2F2026')
})
