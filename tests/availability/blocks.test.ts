import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatBlockReason, sortBlocksByStartAt } from '../../app/features/availability/domain/blocks'

test('sortBlocksByStartAt keeps upcoming blocks first (ASC) then past blocks (DESC)', () => {
  const now = Date.parse('2030-01-01T00:00:00.000Z')

  const blocks = sortBlocksByStartAt(
    [
      { id: 'past-1', startAt: '2029-12-30T10:00:00.000Z', endAt: '2029-12-30T12:00:00.000Z', blockType: 'all', reason: null },
      { id: 'future-2', startAt: '2030-01-05T10:00:00.000Z', endAt: '2030-01-05T12:00:00.000Z', blockType: 'consultation', reason: null },
      { id: 'future-1', startAt: '2030-01-02T10:00:00.000Z', endAt: '2030-01-02T12:00:00.000Z', blockType: 'discovery', reason: 'Holiday' },
      { id: 'past-2', startAt: '2029-12-31T08:00:00.000Z', endAt: '2029-12-31T09:00:00.000Z', blockType: 'all', reason: null }
    ],
    now
  )

  assert.deepStrictEqual(
    blocks.map(block => block.id),
    ['future-1', 'future-2', 'past-2', 'past-1']
  )
})

test('formatBlockReason returns null for empty strings and trims content', () => {
  assert.equal(formatBlockReason(null), null)
  assert.equal(formatBlockReason(''), null)
  assert.equal(formatBlockReason('   '), null)
  assert.equal(formatBlockReason(' Vacation  '), 'Vacation')
})
