import * as assert from 'node:assert/strict'
import test from 'node:test'

import { buildCalendarRange } from '../../app/features/calendar/domain/range'

const timeZone = 'Europe/Paris'

function formatInTz(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(iso))
}

test('buildCalendarRange(day) returns local day bounds in UTC', () => {
  const range = buildCalendarRange({
    anchorDate: new Date('2026-01-07T12:00:00.000Z'),
    view: 'day',
    timeZone
  })

  assert.equal(range.view, 'day')
  assert.equal(range.anchorKey, '2026-01-07')
  assert.equal(range.from, '2026-01-06T23:00:00.000Z')
  assert.equal(range.to, '2026-01-07T23:00:00.000Z')
})

test('buildCalendarRange(week) starts on Monday in provider timezone', () => {
  const range = buildCalendarRange({
    anchorDate: new Date('2026-01-07T12:00:00.000Z'),
    view: 'week',
    timeZone
  })

  assert.equal(range.view, 'week')
  assert.equal(range.anchorKey, '2026-01-05')
  assert.equal(formatInTz(range.from), '05/01/2026 00:00')
  assert.equal(formatInTz(range.to), '12/01/2026 00:00')
})

test('buildCalendarRange(week) handles DST forward shift', () => {
  const range = buildCalendarRange({
    anchorDate: new Date('2026-03-29T12:00:00.000Z'),
    view: 'week',
    timeZone
  })

  assert.equal(range.anchorKey, '2026-03-23')
  assert.equal(formatInTz(range.from), '23/03/2026 00:00')
  assert.equal(formatInTz(range.to), '30/03/2026 00:00')
})

test('buildCalendarRange(month) returns month bounds', () => {
  const range = buildCalendarRange({
    anchorDate: new Date('2026-01-15T12:00:00.000Z'),
    view: 'month',
    timeZone
  })

  assert.equal(range.anchorKey, '2026-01')
  assert.equal(formatInTz(range.from), '01/01/2026 00:00')
  assert.equal(formatInTz(range.to), '01/02/2026 00:00')
})
