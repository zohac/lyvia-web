import * as assert from 'node:assert/strict'
import test from 'node:test'

import { groupAppointmentsByLocalDay, sortAppointmentsByStartAt } from '../../app/features/calendar/domain/appointments'
import type { ProviderAppointmentListItem } from '../../app/features/calendar/api/calendar.contract'

const timeZone = 'Europe/Paris'

function appointment(id: string, startAt: string): ProviderAppointmentListItem {
  const start = new Date(startAt)
  const end = new Date(start.getTime() + 15 * 60 * 1000)

  return {
    id,
    startAt,
    endAt: end.toISOString(),
    durationMinutes: 15,
    type: 'discovery',
    pricePlanId: null,
    status: 'scheduled',
    paymentStatus: 'not_required',
    source: 'client_booking',
    clientProfileId: 'cp1',
    firstname: 'Marie',
    lastname: 'Test',
    clientEmail: 'marie@example.com',
    clientPhone: '0612345678',
    clientStage: 'lead',
    meetingLink: null
  }
}

test('sortAppointmentsByStartAt sorts ascending by startAt', () => {
  const sorted = sortAppointmentsByStartAt([
    appointment('b', '2026-01-05T10:00:00.000Z'),
    appointment('a', '2026-01-05T09:00:00.000Z')
  ])

  assert.deepStrictEqual(sorted.map(item => item.id), ['a', 'b'])
})

test('groupAppointmentsByLocalDay groups by local date and keeps appointment order', () => {
  const groups = groupAppointmentsByLocalDay(
    [
      appointment('a', '2026-01-05T08:00:00.000Z'),
      appointment('b', '2026-01-05T10:00:00.000Z'),
      appointment('c', '2026-01-06T08:00:00.000Z')
    ],
    timeZone
  )

  assert.equal(groups.length, 2)
  assert.equal(groups[0]!.key, '2026-01-05')
  assert.equal(groups[1]!.key, '2026-01-06')
  assert.deepStrictEqual(groups[0]!.appointments.map(item => item.id), ['a', 'b'])
})
