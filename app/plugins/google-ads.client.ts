/**
 * Google Ads Tag + Consent Mode v2 — conditional injection plugin.
 *
 * Resolves googleAdsId from multiple NuxtData sources (profile pages,
 * booking pages, white-label pages) to cover all public page types.
 *
 * - If no ID is configured: does nothing (zero perf impact).
 * - If ID is present: injects gtag.js, sets Consent Mode v2 defaults (denied),
 *   and exposes gtag + config via useState for banner & booking wizard.
 * - On returning visitors who already accepted cookies ('all'):
 *   immediately grants consent.
 */

import { apiFetch } from '~/services/api/apiFetch'
import {
  COOKIE_CONSENT_NAME,
  resolveAdsContext,
  shouldFetchAdsProfile,
  shouldRestoreConsent,
  toConsentSignals,
  type AdsConfig,
  type ConsentValue
} from '~/features/consent/consent-logic'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

type GtagFn = (...args: unknown[]) => void

export default defineNuxtPlugin(() => {
  const route = useRoute()

  // Expose states for other components (banner, wizard)
  const gtagState = useState<GtagFn | null>('gtag', () => null)
  const googleAdsIdState = useState<string | null>('googleAdsId', () => null)
  const googleAdsConversionLabelState = useState<string | null>('googleAdsConversionLabel', () => null)

  /**
   * Try to find Google Ads config from any available NuxtData source.
   * Covers: coach profile pages, white-label home, booking pages.
   */
  function findFromNuxtData(): { slug: string | null, ads: AdsConfig } {
    const routeSlug = typeof route.params.slug === 'string' ? route.params.slug : null
    const routeProfile = routeSlug
      ? useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${routeSlug}`).data.value
      : null

    const tenantHomeSlug = useNuxtData<{ slug?: string }>('public-tenant-home').data.value?.slug ?? null
    const tenantHomeProfile = tenantHomeSlug
      ? useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${tenantHomeSlug}`).data.value
      : null

    const tenantDiscoverySlug = useNuxtData<{ slug?: string }>('public-tenant-discovery').data.value?.slug ?? null
    const tenantRouteSlug = routeSlug
      ? useNuxtData<{ slug?: string }>(`public-tenant:${routeSlug}`).data.value?.slug ?? null
      : null

    return resolveAdsContext({
      routeSlug,
      routeProfile: routeProfile
        ? {
            id: routeProfile.googleAdsId ?? null,
            label: routeProfile.googleAdsConversionLabel ?? null
          }
        : null,
      tenantHomeSlug,
      tenantHomeProfile: tenantHomeProfile
        ? {
            id: tenantHomeProfile.googleAdsId ?? null,
            label: tenantHomeProfile.googleAdsConversionLabel ?? null
          }
        : null,
      tenantDiscoverySlug,
      tenantRouteSlug
    })
  }

  function injectGtag(googleAdsId: string, conversionLabel: string | null) {
    if (gtagState.value) return // Already injected

    googleAdsIdState.value = googleAdsId
    googleAdsConversionLabelState.value = conversionLabel

    // 1. Initialize dataLayer + gtag function
    window.dataLayer = window.dataLayer || []
    const gtag: GtagFn = function (...args: unknown[]) {
      window.dataLayer.push(args)
    }

    // 2. Consent Mode v2 — defaults denied (RGPD/DMA compliant)
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500
    })

    // 3. Load gtag.js script async (non-blocking)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`
    document.head.appendChild(script)

    // 4. Configure tag
    gtag('js', new Date())
    gtag('config', googleAdsId)

    // 5. Expose gtag for cookie banner and booking wizard
    gtagState.value = gtag

    // 6. Restore consent for returning visitors
    const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
    if (shouldRestoreConsent(consent.value)) {
      gtag('consent', 'update', toConsentSignals(true))
    }
  }

  // Wait for app to be mounted so NuxtData is populated
  const nuxtApp = useNuxtApp()
  nuxtApp.hook('app:mounted', async () => {
    const { slug, ads } = findFromNuxtData()

    // If Google Ads ID already found in NuxtData, inject immediately
    if (ads.id) {
      injectGtag(ads.id, ads.label)
      return
    }

    // If we have a slug but no profile data yet (booking pages),
    // fetch the profile to get the Google Ads config
    if (shouldFetchAdsProfile(slug, ads.id)) {
      try {
        const profile = await apiFetch<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(
          `/public/provider/${slug}/profile`,
          { method: 'GET', withAuth: false }
        )
        if (profile.googleAdsId) {
          injectGtag(profile.googleAdsId, profile.googleAdsConversionLabel ?? null)
        }
      } catch {
        // Silent fail — no Google Ads tracking on this page
      }
    }
  })
})
