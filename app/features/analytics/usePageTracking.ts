import { buildPageViewPayload } from './helpers/build-page-view-payload'
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

    const body = buildPageViewPayload({
      tenantId: id,
      pathname: window.location.pathname,
      search: window.location.search,
      referrer: document.referrer,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
    })

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
