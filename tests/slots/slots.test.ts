import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getYmdInTimeZone, groupSlotsByLocalDay, sortSlotsByStartAt } from '../../app/features/slots/domain/slots'

test('sortSlotsByStartAt sorts by startAt asc (UTC timestamps)', () => {
  const sorted = sortSlotsByStartAt([
    { startAt: '2025-12-20T10:00:00.000Z', endAt: '2025-12-20T10:30:00.000Z' },
    { startAt: '2025-12-20T09:00:00.000Z', endAt: '2025-12-20T09:30:00.000Z' }
  ])

  assert.equal(sorted[0]?.startAt, '2025-12-20T09:00:00.000Z')
  assert.equal(sorted[1]?.startAt, '2025-12-20T10:00:00.000Z')
})

test('groupSlotsByLocalDay groups by local day key and sorts groups by day', () => {
  const timeZone = 'Europe/Paris'
  const slots = [
    { startAt: '2025-12-20T10:00:00.000Z', endAt: '2025-12-20T10:30:00.000Z' },
    { startAt: '2025-12-21T10:00:00.000Z', endAt: '2025-12-21T10:30:00.000Z' },
    { startAt: '2025-12-20T09:00:00.000Z', endAt: '2025-12-20T09:30:00.000Z' }
  ]

  const groups = groupSlotsByLocalDay(slots, timeZone)
  assert.equal(groups.length, 2)

  const expectedDay1 = getYmdInTimeZone(new Date('2025-12-20T09:00:00.000Z'), timeZone)
  const expectedDay2 = getYmdInTimeZone(new Date('2025-12-21T10:00:00.000Z'), timeZone)
  assert.equal(groups[0]?.key, expectedDay1)
  assert.equal(groups[1]?.key, expectedDay2)

  assert.equal(groups[0]?.slots.length, 2)
  assert.equal(groups[1]?.slots.length, 1)
  assert.equal(groups[0]?.slots[0]?.startAt, '2025-12-20T09:00:00.000Z')
  assert.equal(groups[0]?.slots[1]?.startAt, '2025-12-20T10:00:00.000Z')
})
