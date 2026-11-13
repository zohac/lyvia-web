import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAppointmentNotificationSummary,
  getNotificationChannelLabel
} from '../../app/features/clients/domain/clients'

test('getNotificationChannelLabel: consultation reminder is labelled J-2 (em-1)', () => {
  assert.equal(
    getNotificationChannelLabel('consultation_reminder_j1'),
    'Rappel J-2 envoyé'
  )
})

test('getNotificationChannelLabel: discovery reminder stays J-1 (em-1)', () => {
  assert.equal(
    getNotificationChannelLabel('discovery_reminder_j1'),
    'Rappel J-1 envoyé'
  )
})

// Fixtures are typed (not cast) so a rename in the contract breaks the test at
// compile time instead of silently building a shape the function no longer reads.
const consultationWithReminder = {
  type: 'consultation' as const,
  status: 'scheduled' as const,
  notifications: [
    { channel: 'consultation_reminder_j1' as const, status: 'sent' as const, createdAt: '2026-11-12T09:14:00.000Z' }
  ]
}

const discoveryWithReminder = {
  type: 'discovery' as const,
  status: 'scheduled' as const,
  notifications: [
    { channel: 'discovery_reminder_j1' as const, status: 'sent' as const, createdAt: '2026-11-12T09:14:00.000Z' }
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
