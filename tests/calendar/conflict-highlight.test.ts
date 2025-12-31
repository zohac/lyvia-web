import test from 'node:test'
import assert from 'node:assert/strict'
import type { ProviderAppointmentListItem } from '../../app/features/calendar/api/calendar.contract'
import { buildConflictHighlight, minutesSinceStartOfDayInTimeZone } from '../../app/features/calendar/domain/conflict-highlight'

test('minutesSinceStartOfDayInTimeZone converts UTC to Europe/Paris minutes', () => {
  // 08:00Z = 09:00 Europe/Paris (winter time)
  const minutes = minutesSinceStartOfDayInTimeZone('2025-12-25T08:00:00.000Z', 'Europe/Paris')
  assert.equal(minutes, 9 * 60)
})

test('buildConflictHighlight identifies overlapping appointment when possible', () => {
  const appointments: ProviderAppointmentListItem[] = [
    {
      id: 'a1',
      startAt: '2025-12-25T08:00:00.000Z',
      endAt: '2025-12-25T09:00:00.000Z',
      durationMinutes: 60,
      type: 'consultation',
      status: 'scheduled',
      paymentStatus: 'unpaid',
      source: 'provider_manual',
      clientProfileId: 'c1',
      firstname: 'Alice',
      lastname: 'Example',
      clientStage: 'lead'
    }
  ]

  const highlight = buildConflictHighlight({
    appointments,
    timeZone: 'Europe/Paris',
    startAt: '2025-12-25T08:30:00.000Z',
    durationMinutes: 30,
    autoScroll: false
  })

  assert.equal(highlight.dayKey, '2025-12-25')
  assert.equal(highlight.appointmentId, 'a1')
  assert.equal(highlight.startMinutes, 9 * 60 + 30)
})
