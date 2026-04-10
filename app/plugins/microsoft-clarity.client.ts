/**
 * Microsoft Clarity — conditional injection plugin.
 *
 * Resolves microsoftClarityId AND googleAdsId from the SAME profile data
 * to avoid the race condition where Google Ads plugin state hasn't been
 * populated yet on booking pages.
 *
 * - If no Clarity ID is configured: does nothing (zero perf impact).
 * - If Clarity ID is present: checks consent based on googleAdsId from
 *   the same profile resolution (not from Google Ads plugin state).
 * - Consent: In simple mode (no Google Ads), Clarity loads directly
 *   (analytics/functional). In full mode, only with 'all' or 'acknowledged'.
 */

import { apiFetch } from '../services/api/apiFetch'
import { COOKIE_CONSENT_NAME, type ConsentValue } from '../features/consent/consent-logic'
import {
  resolveClarityContext,
  type ClarityProfile
} from './microsoft-clarity-helpers'
import {
  injectClarityTag,
  runMicrosoftClarityMounted
} from './microsoft-clarity-runtime'

export default defineNuxtPlugin(() => {
  const route = useRoute()

  function gatherNuxtData() {
    const routeSlug = typeof route.params.slug === 'string' ? route.params.slug : null
    const routeProfile = routeSlug
      ? useNuxtData<ClarityProfile>(`public-provider-profile:${routeSlug}`).data.value
      : null

    const tenantHomeSlug = useNuxtData<{ slug?: string }>('public-tenant-home').data.value?.slug ?? null
    const tenantHomeProfile = tenantHomeSlug
      ? useNuxtData<ClarityProfile>(`public-provider-profile:${tenantHomeSlug}`).data.value
      : null

    const tenantDiscoverySlug = useNuxtData<{ slug?: string }>('public-tenant-discovery').data.value?.slug ?? null
    const tenantRouteSlug = routeSlug
      ? useNuxtData<{ slug?: string }>(`public-tenant:${routeSlug}`).data.value?.slug ?? null
      : null

    return resolveClarityContext({
      routeSlug,
      routeProfile: routeProfile ?? null,
      tenantHomeSlug,
      tenantHomeProfile: tenantHomeProfile ?? null,
      tenantDiscoverySlug,
      tenantRouteSlug
    })
  }

  let injected = false

  function injectClarity(clarityId: string) {
    if (injected) return
    injected = true
    injectClarityTag(
      window as unknown as Record<string, unknown>,
      () => document.createElement('script'),
      (script) => {
        document.head.appendChild(script)
      },
      clarityId
    )
  }

  const nuxtApp = useNuxtApp()
  nuxtApp.hook('app:mounted', async () => {
    const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
    await runMicrosoftClarityMounted({
      context: gatherNuxtData(),
      cookieConsent: consent.value,
      fetchProfile: async (slug: string) => apiFetch<ClarityProfile>(
        `/public/provider/${slug}/profile`,
        { method: 'GET', withAuth: false }
      ),
      injectClarity
    })
  })
})
