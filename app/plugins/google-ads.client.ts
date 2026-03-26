/**
 * Google Ads Tag + Consent Mode v2 — conditional injection plugin.
 *
 * - Reads googleAdsId from the public provider profile (multi-tenant).
 * - If no ID is configured: does nothing (zero perf impact).
 * - If ID is present: injects gtag.js, sets Consent Mode v2 defaults (denied),
 *   and exposes gtag + config via useState for banner & booking wizard.
 * - On returning visitors who already accepted cookies ('all'):
 *   immediately grants consent.
 */

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

type GtagFn = (...args: unknown[]) => void

export default defineNuxtPlugin(() => {
  // Resolve provider profile from NuxtData (loaded by useCoachSchemaOrg in public pages)
  const route = useRoute()
  const slug = computed(() => {
    // Extract slug from route params or from tenant home
    const paramSlug = route.params.slug as string | undefined
    if (paramSlug) return paramSlug
    // For white-label pages (no slug in URL), try to get from NuxtData keys
    return null
  })

  // Try to find the profile data from any available NuxtData key
  const findGoogleAdsId = (): { id: string | null, label: string | null } => {
    // Try slug-based key first
    if (slug.value) {
      const { data } = useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${slug.value}`)
      if (data.value?.googleAdsId) {
        return { id: data.value.googleAdsId, label: data.value.googleAdsConversionLabel ?? null }
      }
    }

    // For white-label: try to find any public-provider-profile key
    // The profile is loaded by useCoachSchemaOrg which uses the tenant slug
    const tenantData = useNuxtData<{ slug?: string }>('public-tenant-home')
    if (tenantData.data.value?.slug) {
      const { data } = useNuxtData<{ googleAdsId?: string | null, googleAdsConversionLabel?: string | null }>(`public-provider-profile:${tenantData.data.value.slug}`)
      if (data.value?.googleAdsId) {
        return { id: data.value.googleAdsId, label: data.value.googleAdsConversionLabel ?? null }
      }
    }

    return { id: null, label: null }
  }

  // Expose states for other components (banner, wizard)
  const gtagState = useState<GtagFn | null>('gtag', () => null)
  const googleAdsIdState = useState<string | null>('googleAdsId', () => null)
  const googleAdsConversionLabelState = useState<string | null>('googleAdsConversionLabel', () => null)

  // Wait for app to be mounted so NuxtData is populated
  const nuxtApp = useNuxtApp()
  nuxtApp.hook('app:mounted', () => {
    const { id: googleAdsId, label: conversionLabel } = findGoogleAdsId()

    if (!googleAdsId) return

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
  })
})
