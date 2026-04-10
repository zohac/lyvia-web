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

import { apiFetch } from '~/services/api/apiFetch'
import { COOKIE_CONSENT_NAME, type ConsentValue } from '~/features/consent/consent-logic'
import {
  resolveClarityContext,
  shouldLoadClarity,
  shouldFetchClarityProfile,
  type ClarityProfile
} from './microsoft-clarity-helpers'

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

    const w = window as unknown as Record<string, unknown>
    const fn = function (...args: unknown[]) {
      ((w['clarity'] as { q?: unknown[] }).q = (w['clarity'] as { q?: unknown[] }).q || []).push(args)
    }
    fn.q = [] as unknown[]
    w['clarity'] = fn

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.clarity.ms/tag/${clarityId}`
    document.head.appendChild(script)
  }

  const nuxtApp = useNuxtApp()
  nuxtApp.hook('app:mounted', async () => {
    const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
    const { slug, clarityId, googleAdsId } = gatherNuxtData()

    if (clarityId && shouldLoadClarity(googleAdsId, consent.value)) {
      injectClarity(clarityId)
      return
    }

    // If we have a slug but no profile data yet (booking pages), fetch it
    if (shouldFetchClarityProfile(slug, clarityId)) {
      try {
        const profile = await apiFetch<ClarityProfile>(
          `/public/provider/${slug}/profile`,
          { method: 'GET', withAuth: false }
        )
        if (profile.microsoftClarityId && shouldLoadClarity(profile.googleAdsId ?? null, consent.value)) {
          injectClarity(profile.microsoftClarityId)
        }
      } catch {
        // Silent fail — no Clarity tracking on this page
      }
    }
  })
})
