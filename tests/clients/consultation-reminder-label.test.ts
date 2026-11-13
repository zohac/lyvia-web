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

test('getAppointmentNotificationSummary: consultation reminder pushes J-2 (em-1)', () => {
  const summary = getAppointmentNotificationSummary({
    type: 'consultation',
    status: 'scheduled',
    notifications: [{ channel: 'consultation_reminder_j1', status: 'sent' }]
  } as unknown as Parameters<typeof getAppointmentNotificationSummary>[0])
  assert.deepEqual(summary.remindersSent, ['J-2'])
})

test('getAppointmentNotificationSummary: discovery reminder still pushes J-1 (em-1)', () => {
  const summary = getAppointmentNotificationSummary({
    type: 'discovery',
    status: 'scheduled',
    notifications: [{ channel: 'discovery_reminder_j1', status: 'sent' }]
  } as unknown as Parameters<typeof getAppointmentNotificationSummary>[0])
  assert.deepEqual(summary.remindersSent, ['J-1'])
})
