import type { TrackPageViewRequest } from './api/analytics.contract'
import { detectDeviceType, detectBrowser } from './helpers/detect-device'
import { extractUtmParams } from './helpers/extract-utm'
import { extractReferrerDomain } from './helpers/extract-referrer'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Fire-and-forget page view tracking.
 * Runs client-side only (onMounted). Errors are silently ignored.
 */
export function usePageTracking(tenantId: MaybeRefOrGetter<string | undefined>) {
  const tracked = ref(false)

  onMounted(async () => {
    if (tracked.value) return
    tracked.value = true

    const id = toValue(tenantId)
    if (!id) return

    const ua = navigator.userAgent
    const utm = extractUtmParams(window.location.search)
    const referrerDomain = extractReferrerDomain(document.referrer, window.location.hostname)

    const body: TrackPageViewRequest = {
      tenantId: id,
      pagePath: window.location.pathname,
      referrerDomain,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      deviceType: detectDeviceType(ua),
      browser: detectBrowser(ua)
    }

    try {
      await apiFetch('/public/page-views', {
        method: 'POST',
        withAuth: false,
        body
      })
    } catch {
      // Silently ignore — tracking errors must not impact UX
    }
  })
}
