import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getAppointmentNotificationSummary } from '../../app/features/clients/domain/clients'

// em-1's user-visible guard: the consultation reminder reads J-2 (it fires at
// 48 h), the discovery one stays J-1. em-6 moved the *channel label* to the API
// (`EMAIL_CATALOGUE`, pinned by `notification-channel-label.spec.ts` in
// `lyvia-api`); these two labels stay here because they are derived from the
// channel the summary matches, not from the registry.

// Fixtures are plain literals: `NotificationLogItem.channel` is a `string`, so
// nothing here breaks at compile time on a rename. The compile-time link lives
// in `clients.ts` (`SUMMARY_CHANNELS` typed against `NotificationChannel`); these
// tests are the runtime half — they assert the channel the summary actually reads.
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
