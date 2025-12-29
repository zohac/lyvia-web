import * as assert from 'node:assert/strict'
import test from 'node:test'

import { buildCopyRulePayloads, buildCopyRulesPlan } from '../../app/features/availability/domain/copy'

test('buildCopyRulePayloads dedupes payloads by weekday/time', () => {
  const payloads = buildCopyRulePayloads({
    allRules: [
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
        slotDurationMinutes: 45,
        isActive: false
      }
    ],
    sourceType: 'discovery',
    targetType: 'consultation',
    adaptDurations: false,
    recommendedDurations: { discovery: 30, consultation: 60 }
  })

  assert.equal(payloads.length, 1)
  assert.equal(payloads[0]!.key, '1|09:00|10:00')
  assert.equal(payloads[0]!.body.appointmentType, 'consultation')
})

test('buildCopyRulePayloads applies recommended duration when adaptDurations is true', () => {
  const payloads = buildCopyRulePayloads({
    allRules: [
      {
        id: 'r1',
        appointmentType: 'discovery',
        weekday: 1,
        startTime: '09:00',
        endTime: '10:00',
        slotDurationMinutes: 30,
        isActive: true
      }
    ],
    sourceType: 'discovery',
    targetType: 'consultation',
    adaptDurations: true,
    recommendedDurations: { discovery: 30, consultation: 60 }
  })

  assert.equal(payloads[0]!.body.slotDurationMinutes, 60)
})

test('buildCopyRulesPlan reports duplicatesCount for identical windows', () => {
  const plan = buildCopyRulesPlan(
    [
      {
        id: 'd1',
        appointmentType: 'discovery',
        weekday: 1,
        startTime: '09:00',
        endTime: '10:00',
        slotDurationMinutes: 30,
        isActive: true
      },
      {
        id: 'd2',
        appointmentType: 'discovery',
        weekday: 2,
        startTime: '11:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
        isActive: true
      },
      {
        id: 'c1',
        appointmentType: 'consultation',
        weekday: 1,
        startTime: '09:00:00',
        endTime: '10:00:00',
        slotDurationMinutes: 60,
        isActive: true
      }
    ],
    'discovery',
    'consultation'
  )

  assert.equal(plan.sourceCount, 2)
  assert.equal(plan.targetCount, 1)
  assert.equal(plan.duplicatesCount, 1)
})
