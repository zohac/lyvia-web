import { DEFAULT_BOOKING_NOTICE_HOURS } from './booking-notice-options'

export type DiscoveryConfigValues = {
  duration: number
  buffer: number
  minBookingNoticeHours: number
}

type DiscoveryConfigSource = Pick<
  {
    defaultDiscoveryDurationMinutes: number
    discoveryBufferAfterMinutes: number
    minBookingNoticeHours: number
  },
  'defaultDiscoveryDurationMinutes'
  | 'discoveryBufferAfterMinutes'
  | 'minBookingNoticeHours'
>

/**
 * Extract the 3 discovery-scheduling fields from a provider-account payload.
 * Keeps defaults in one place — no `?? 15` scattered across the page.
 *
 * Defaults mirror the API SQL defaults so a freshly seeded provider who
 * never touched scheduling renders coherent values.
 */
export function pickDiscoveryConfig(
  account: DiscoveryConfigSource | null | undefined
): DiscoveryConfigValues {
  return {
    duration: account?.defaultDiscoveryDurationMinutes ?? 15,
    buffer: account?.discoveryBufferAfterMinutes ?? 15,
    minBookingNoticeHours:
      account?.minBookingNoticeHours ?? DEFAULT_BOOKING_NOTICE_HOURS
  }
}

export function isDiscoveryConfigDirty(
  current: DiscoveryConfigValues,
  saved: DiscoveryConfigValues
): boolean {
  return (
    current.duration !== saved.duration
    || current.buffer !== saved.buffer
    || current.minBookingNoticeHours !== saved.minBookingNoticeHours
  )
}

/**
 * Shape of the PATCH body sent to `/api/provider/account` from the scheduling
 * page. We always send the 3 fields together — backend is happy with the
 * partial patch but keeping them grouped avoids `changedFields` surprises
 * when two sections are edited back-to-back.
 */
export type DiscoveryConfigPatch = {
  defaultDiscoveryDurationMinutes: number
  discoveryBufferAfterMinutes: number
  minBookingNoticeHours: number
}

export function buildDiscoveryConfigPatch(
  values: DiscoveryConfigValues
): DiscoveryConfigPatch {
  return {
    defaultDiscoveryDurationMinutes: values.duration,
    discoveryBufferAfterMinutes: values.buffer,
    minBookingNoticeHours: values.minBookingNoticeHours
  }
}

export type DiscoverySaveOutcome = {
  status: 'success' | 'error'
  displayValues: DiscoveryConfigValues
  savedValues: DiscoveryConfigValues
}

/**
 * Reconcile the scheduling page state after a PATCH attempt.
 *
 * On success, the current draft becomes the new persisted snapshot — both
 * `displayValues` (the `USelect` v-model targets) and `savedValues` (the
 * dirty-flag reference) are aligned on `current`.
 *
 * On failure, the UI rolls back to `saved` so the provider never sees a
 * value the backend rejected (network error, 422 on the isIn enum, …).
 * This is the direct fix for Finding 1 of the 2026-04-22 AI review on
 * story 0-25: before this helper, `saveDiscovery()` kept the unpersisted
 * draft on screen and pretended success visually while only the toast
 * signalled the error.
 *
 * Why return a fresh object both times: the page assigns `savedValues`
 * by reference, and tests assert that mutating the outcome never leaks
 * back into the saved snapshot the caller passed in.
 */
export function resolveDiscoverySaveOutcome(
  ok: boolean,
  current: DiscoveryConfigValues,
  saved: DiscoveryConfigValues
): DiscoverySaveOutcome {
  if (ok) {
    return {
      status: 'success',
      displayValues: { ...current },
      savedValues: { ...current }
    }
  }
  return {
    status: 'error',
    displayValues: { ...saved },
    savedValues: { ...saved }
  }
}
