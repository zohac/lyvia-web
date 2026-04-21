import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  BOOKING_NOTICE_OPTIONS,
  DEFAULT_BOOKING_NOTICE_HOURS,
  findBookingNoticeOption
} from '../../app/features/scheduling/domain/booking-notice-options'

/**
 * AC-5 #2 — "the options list is exactly [...]" (verbatim labels, exact order).
 * This test fails if a value is renamed, reordered, or added without
 * coordination with the API `@IsIn(MIN_BOOKING_NOTICE_HOURS_ALLOWED)`.
 */
test('booking-notice options: exposes exactly 8 items in the product-chosen order', () => {
  assert.equal(BOOKING_NOTICE_OPTIONS.length, 8)

  assert.deepStrictEqual(
    BOOKING_NOTICE_OPTIONS.map(o => o.value),
    [2, 4, 6, 8, 10, 12, 24, 48]
  )

  assert.deepStrictEqual(
    BOOKING_NOTICE_OPTIONS.map(o => o.label),
    [
      '2h',
      '4h',
      '6h — recommandé',
      '8h',
      '10h',
      '12h — une demi-journée',
      '24h — un jour',
      '48h — deux jours'
    ]
  )
})

test('booking-notice options: default (6) matches the API SQL default — no regression from hotfix-14', () => {
  assert.equal(DEFAULT_BOOKING_NOTICE_HOURS, 6)
  const defaultOption = findBookingNoticeOption(DEFAULT_BOOKING_NOTICE_HOURS)
  assert.ok(defaultOption, 'default must resolve to a known option')
  assert.equal(defaultOption?.label, '6h — recommandé')
})

test('booking-notice options: findBookingNoticeOption rejects values outside the allow-list', () => {
  assert.equal(findBookingNoticeOption(6)?.value, 6)
  assert.equal(findBookingNoticeOption(48)?.value, 48)
  // 5 / 7 / 36 are NOT in the enum — the helper must not fabricate a match
  // so the UI won't silently accept server drift.
  assert.equal(findBookingNoticeOption(5), undefined)
  assert.equal(findBookingNoticeOption(7), undefined)
  assert.equal(findBookingNoticeOption(36), undefined)
})
