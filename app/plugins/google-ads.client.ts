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

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

type GtagFn = (...args: unknown[]) => void

type AdsConfig = { id: string | null, label: string | null }

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
    // 1. Try slug from route params (platform /coach/[slug] pages)
    const paramSlug = route.params.slug as string | undefined
    if (paramSlug) {
      const { data } = useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${paramSlug}`)
      if (data.value?.googleAdsId) {
        return { slug: paramSlug, ads: { id: data.value.googleAdsId, label: data.value.googleAdsConversionLabel ?? null } }
      }
      return { slug: paramSlug, ads: { id: null, label: null } }
    }

    // 2. Try white-label home tenant (public-tenant-home)
    const tenantHome = useNuxtData<{ slug?: string }>('public-tenant-home')
    if (tenantHome.data.value?.slug) {
      const slug = tenantHome.data.value.slug
      const { data } = useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${slug}`)
      if (data.value?.googleAdsId) {
        return { slug, ads: { id: data.value.googleAdsId, label: data.value.googleAdsConversionLabel ?? null } }
      }
      return { slug, ads: { id: null, label: null } }
    }

    // 3. Try booking page tenant (public-tenant-discovery)
    const tenantDiscovery = useNuxtData<{ slug?: string }>('public-tenant-discovery')
    if (tenantDiscovery.data.value?.slug) {
      return { slug: tenantDiscovery.data.value.slug, ads: { id: null, label: null } }
    }

    // 4. Try platform booking tenant (public-tenant:*)
    for (const key of [`public-tenant:${route.params.slug}`]) {
      const { data } = useNuxtData<{ slug?: string }>(key)
      if (data.value?.slug) {
        return { slug: data.value.slug, ads: { id: null, label: null } }
      }
    }

    return { slug: null, ads: { id: null, label: null } }
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
    const consent = useCookie<string | null>('cookieConsent')
    if (consent.value === 'all') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      })
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
    if (slug) {
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
