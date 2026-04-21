/**
 * Discrete choices exposed on `/provider/scheduling` for
 * `minBookingNoticeHours` (story 0-25). Each entry maps to a value validated
 * server-side by `@IsIn(MIN_BOOKING_NOTICE_HOURS_ALLOWED)` in the API DTO.
 *
 * Order and labels are copied verbatim from AC-2 of story 0-25 (convention
 * A31). Adding a 9th value requires: (1) API migration + enum update,
 * (2) bump this list. `as const` guarantees the array is immutable at the
 * type level and that `BookingNoticeOptionValue` stays a precise union.
 */
export const BOOKING_NOTICE_OPTIONS = [
  { value: 2, label: '2h' },
  { value: 4, label: '4h' },
  { value: 6, label: '6h — recommandé' },
  { value: 8, label: '8h' },
  { value: 10, label: '10h' },
  { value: 12, label: '12h — une demi-journée' },
  { value: 24, label: '24h — un jour' },
  { value: 48, label: '48h — deux jours' }
] as const

export type BookingNoticeOption = (typeof BOOKING_NOTICE_OPTIONS)[number]
export type BookingNoticeOptionValue = BookingNoticeOption['value']

/**
 * Default matching the API SQL `DEFAULT 6` on `provider_profiles`. Used when
 * the fetched account is `null` (pre-hydration) so the `USelect` renders a
 * sensible value instead of `undefined`.
 */
export const DEFAULT_BOOKING_NOTICE_HOURS: BookingNoticeOptionValue = 6

export function findBookingNoticeOption(
  value: number
): BookingNoticeOption | undefined {
  return BOOKING_NOTICE_OPTIONS.find(option => option.value === value)
}
