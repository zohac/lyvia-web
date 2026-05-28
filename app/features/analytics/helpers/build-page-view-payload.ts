import type { TrackPageViewRequest } from '../api/analytics.contract'
import { detectBrowser, detectDeviceType } from './detect-device'
import { extractClickIds } from './extract-click-ids'
import { extractReferrerDomain } from './extract-referrer'
import { extractUtmParams } from './extract-utm'

export type BuildPageViewPayloadInput = {
  tenantId: string
  pathname: string
  search: string
  referrer: string
  hostname: string
  userAgent: string
}

/**
 * Pure builder for the `POST /public/page-views` payload.
 *
 * Lives outside the composable so the behaviour can be tested directly with
 * deterministic inputs (no DOM, no Vue lifecycle). Story 0-32 R1-F3.
 *
 * `paidClickIds` is only added when at least one recognised click ID is
 * present in the search string — never `paidClickIds: {}` or `null`.
 */
export function buildPageViewPayload(
  input: BuildPageViewPayloadInput
): TrackPageViewRequest {
  const utm = extractUtmParams(input.search)
  const referrerDomain = extractReferrerDomain(input.referrer, input.hostname)
  const clickIds = extractClickIds(input.search)

  const body: TrackPageViewRequest = {
    tenantId: input.tenantId,
    pagePath: input.pathname,
    referrerDomain,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    deviceType: detectDeviceType(input.userAgent),
    browser: detectBrowser(input.userAgent)
  }

  if (Object.keys(clickIds).length > 0) {
    body.paidClickIds = clickIds
  }

  return body
}
