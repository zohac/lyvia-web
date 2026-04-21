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
