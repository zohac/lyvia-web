/**
 * Discrete choices exposed on `/provider/scheduling` for
 * `minBookingNoticeHours` (story 0-25). Each entry maps to a value validated
 * server-side by `@IsIn(MIN_BOOKING_NOTICE_HOURS_ALLOWED)` in the API DTO.
 *
 * Order and labels are copied verbatim from AC-2 of story 0-25 (convention
 * A31). Adding a 9th value requires: (1) API migration + enum update,
 * (2) bump this list.
 *
 * NB: we intentionally keep the array type mutable (`BookingNoticeOption[]`)
 * rather than `readonly` so Nuxt UI `USelect` accepts it directly as
 * `:items="..."`. Immutability is enforced by TypeScript at the binding
 * level (the export is `const`) and by convention — never `.push()` on it.
 */
/**
 * The `value` field is typed as `number` rather than the literal union
 * `2 | 4 | 6 | 8 | 10 | 12 | 24 | 48` on purpose: Nuxt UI `USelect` infers
 * its `v-model` type from `:items`, and a literal-union item type forces
 * every ref in the call chain (pickDiscoveryConfig → DiscoveryConfigValues
 * → API DTO) to adopt that union. The authoritative allow-list lives in
 * the API DTO (`@IsIn(MIN_BOOKING_NOTICE_HOURS_ALLOWED)`), and on the UI
 * side `findBookingNoticeOption` filters out any value drift from the
 * server. The trade-off is TS literal-narrowness lost — gained Nuxt UI
 * interop and a single source of truth for the enum (the backend).
 */
export type BookingNoticeOptionValue = number

export type BookingNoticeOption = {
  value: BookingNoticeOptionValue
  label: string
}

export const BOOKING_NOTICE_OPTIONS: BookingNoticeOption[] = [
  { value: 2, label: '2h' },
  { value: 4, label: '4h' },
  { value: 6, label: '6h — recommandé' },
  { value: 8, label: '8h' },
  { value: 10, label: '10h' },
  { value: 12, label: '12h — une demi-journée' },
  { value: 24, label: '24h — un jour' },
  { value: 48, label: '48h — deux jours' }
]

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
