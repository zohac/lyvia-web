import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import type {
  AppointmentDisplayItem,
  NotificationLogItem
} from '../../app/features/clients/api/clients.contract'
import {
  getAppointmentEmailReason,
  getAppointmentLastEmail,
  getNotificationStatusLabel
} from '../../app/features/clients/domain/clients'

/**
 * EM-6 — the practitioner surface must not re-derive what the API computed.
 *
 * The first cut carried four aliased reason fields and a 4-way `??` fallback, and
 * labelled a `simulated` row « envoyé ». Both are pinned here.
 */

function notification(
  overrides: Partial<NotificationLogItem> = {}
): NotificationLogItem {
  return {
    channel: 'consultation_reminder_j1',
    channelLabel: 'Rappel consultation J-2 (48 h)',
    status: 'sent',
    createdAt: '2026-11-12T09:14:00.000Z',
    simulated: false,
    ...overrides
  }
}

describe('getNotificationStatusLabel — `sent` is not `sent`', () => {
  test('a simulated row reads « simulé », never « envoyé »', () => {
    // The whole epic: `status='sent'` means the gateway resolved. In console mode
    // nothing left the process, and the client file said « envoyé ».
    assert.equal(getNotificationStatusLabel('sent', true), 'simulé')
    assert.equal(getNotificationStatusLabel('sent', false), 'envoyé')
  })

  test('a failure still reads as a failure, simulated or not', () => {
    assert.equal(getNotificationStatusLabel('failed', false), 'échec')
    assert.equal(getNotificationStatusLabel('failed', true), 'échec')
  })

  test('a skipped row reads « ignoré »', () => {
    assert.equal(getNotificationStatusLabel('skipped', false), 'ignoré')
  })
})

describe('getAppointmentLastEmail', () => {
  test('returns the most recent row', () => {
    const last = getAppointmentLastEmail({
      notifications: [
        notification({ channel: 'discovery_confirmation', createdAt: '2026-09-01T10:00:00.000Z' }),
        notification({ channel: 'discovery_reminder_j1', createdAt: '2026-09-27T13:55:00.000Z' })
      ]
    })

    assert.equal(last?.channel, 'discovery_reminder_j1')
    assert.equal(last?.channelLabel, 'Rappel consultation J-2 (48 h)')
    assert.equal(last?.simulated, false)
  })

  test('carries the server label, so a channel the old map forgot is readable', () => {
    const last = getAppointmentLastEmail({
      notifications: [
        notification({
          channel: 'manual_consultation_created',
          channelLabel: 'Consultation créée manuellement'
        })
      ]
    })

    assert.equal(last?.channelLabel, 'Consultation créée manuellement')
    assert.notEqual(last?.channelLabel, 'manual_consultation_created')
  })

  test('returns null when nothing is recorded', () => {
    assert.equal(getAppointmentLastEmail({}), null)
    assert.equal(getAppointmentLastEmail({ notifications: [] }), null)
  })
})

describe('getAppointmentEmailReason', () => {
  test('passes the server motive through, code and label', () => {
    const reason = getAppointmentEmailReason({
      emailReason: { code: 'payment_unpaid', label: 'consultation impayée' }
    })

    assert.deepEqual(reason, { code: 'payment_unpaid', label: 'consultation impayée' })
  })

  test('does not synthesise a motive from the appointment', () => {
    // An unpaid scheduled consultation with no registry row: the browser must not
    // conclude « consultation impayée » on its own. Only the API may.
    const appointment: AppointmentDisplayItem = {
      id: 'a1',
      type: 'consultation',
      status: 'scheduled',
      scheduledAt: '2026-11-20T10:00:00.000Z',
      durationMinutes: 60,
      paymentStatus: 'unpaid',
      cancellationReason: null,
      notifications: []
    }

    assert.equal(getAppointmentEmailReason(appointment), null)
  })
})
