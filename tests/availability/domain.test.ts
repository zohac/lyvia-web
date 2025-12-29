import * as assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRuleTime } from '../../app/features/availability/domain/time'
import { buildRuleKey, dedupeRulesByKey, groupRulesByWeekdayAndType } from '../../app/features/availability/domain/rules'

test('normalizeRuleTime strips seconds and trims', () => {
  assert.equal(normalizeRuleTime('09:00:00'), '09:00')
  assert.equal(normalizeRuleTime(' 09:30 '), '09:30')
})

test('buildRuleKey normalizes times', () => {
  const key = buildRuleKey({
    weekday: 1,
    startTime: '09:00:00',
    endTime: '10:00:00'
  })

  assert.equal(key, '1|09:00|10:00')
})

test('dedupeRulesByKey keeps first occurrence', () => {
  const rules = dedupeRulesByKey([
    {
      id: 'r1',
      appointmentType: 'discovery',
      weekday: 1,
      startTime: '09:00',
      endTime: '10:00',
      slotDurationMinutes: 30,
      isActive: true
    },
    {
      id: 'r2',
      appointmentType: 'discovery',
      weekday: 1,
      startTime: '09:00:00',
      endTime: '10:00:00',
      slotDurationMinutes: 30,
      isActive: false
    }
  ])

  assert.equal(rules.length, 1)
  assert.equal(rules[0]?.id, 'r1')
})

test('groupRulesByWeekdayAndType groups by weekday then type, and sorts by start time', () => {
  const grouped = groupRulesByWeekdayAndType([
    {
      id: 'c2',
      appointmentType: 'consultation',
      weekday: 2,
      startTime: '14:00',
      endTime: '16:00',
      slotDurationMinutes: 60,
      isActive: true
    },
    {
      id: 'd1',
      appointmentType: 'discovery',
      weekday: 1,
      startTime: '10:00',
      endTime: '12:00',
      slotDurationMinutes: 30,
      isActive: true
    },
    {
      id: 'c1',
      appointmentType: 'consultation',
      weekday: 1,
      startTime: '09:00',
      endTime: '10:00',
      slotDurationMinutes: 60,
      isActive: true
    }
  ])

  assert.equal(grouped.length, 2)
  assert.equal(grouped[0]?.weekday, 1)
  assert.equal(grouped[1]?.weekday, 2)

  const day1 = grouped[0]!
  assert.equal(day1.groups.length, 2)
  assert.equal(day1.groups[0]?.type, 'consultation')
  assert.equal(day1.groups[1]?.type, 'discovery')

  assert.equal(day1.groups[0]!.rules[0]!.id, 'c1')
  assert.equal(day1.groups[1]!.rules[0]!.id, 'd1')
})
