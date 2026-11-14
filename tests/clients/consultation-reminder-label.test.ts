import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getAppointmentNotificationSummary } from '../../app/features/clients/domain/clients'

// em-1's user-visible guard: the consultation reminder reads J-2 (it fires at
// 48 h), the discovery one stays J-1. em-6 moved the *channel label* to the API
// (`EMAIL_CATALOGUE`, pinned by `notification-channel-label.spec.ts` in
// `lyvia-api`); these two labels stay here because they are derived from the
// channel the summary matches, not from the registry.

// Fixtures are typed (not cast) so a rename in the contract breaks the test at
// compile time instead of silently building a shape the function no longer reads.
const consultationWithReminder = {
  type: 'consultation' as const,
  status: 'scheduled' as const,
  notifications: [
    {
      channel: 'consultation_reminder',
      channelLabel: 'Rappel consultation J-2 (48 h)',
      status: 'sent' as const,
      createdAt: '2026-11-12T09:14:00.000Z',
      simulated: false
    }
  ]
}

const discoveryWithReminder = {
  type: 'discovery' as const,
  status: 'scheduled' as const,
  notifications: [
    {
      channel: 'discovery_reminder_j1',
      channelLabel: 'Rappel discovery J-1',
      status: 'sent' as const,
      createdAt: '2026-11-12T09:14:00.000Z',
      simulated: false
    }
  ]
}

test('getAppointmentNotificationSummary: consultation reminder pushes J-2 (em-1)', () => {
  const summary = getAppointmentNotificationSummary(consultationWithReminder)
  assert.deepEqual(summary.remindersSent, ['J-2'])
})

test('getAppointmentNotificationSummary: discovery reminder still pushes J-1 (em-1)', () => {
  const summary = getAppointmentNotificationSummary(discoveryWithReminder)
  assert.deepEqual(summary.remindersSent, ['J-1'])
})
