/**
 * Tracking orchestrator — lazy-loaded module.
 *
 * Contains ALL tracking resolution logic (NuxtData gathering, context resolution,
 * consent checks) so that none of it ends up in the entry chunk.
 *
 * Called on `app:mounted` and `page:finish` by the thin tracking plugin.
 * Resolves Google Ads and Clarity contexts in one pass, then lazy-imports
 * each runtime only when a matching ID is found.
 */
import {
  resolveAdsContext,
  shouldMountGoogleAdsTag,
  type AdsConfig
} from '~/features/consent/consent-logic'
import {
  resolveClarityContext,
  type ClarityProfile
} from '~/features/clarity/microsoft-clarity-helpers'

type TrackingProfile = ClarityProfile & {
  googleAdsId?: string | null
  googleAdsConversionLabel?: string | null
  googleTagId?: string | null
}

function gatherNuxtData() {
  const route = useRoute()
  const routeSlug = typeof route.params.slug === 'string' ? route.params.slug : null

  const routeProfile = routeSlug
    ? useNuxtData<TrackingProfile>(`public-provider-profile:${routeSlug}`).data.value
    : null

  const tenantHomeSlug = useNuxtData<{ slug?: string }>('public-tenant-home').data.value?.slug ?? null
  const tenantHomeProfile = tenantHomeSlug
    ? useNuxtData<TrackingProfile>(`public-provider-profile:${tenantHomeSlug}`).data.value
    : null

  const tenantDiscoverySlug = useNuxtData<{ slug?: string }>('public-tenant-discovery').data.value?.slug ?? null
  const tenantDiscoveryProfile = tenantDiscoverySlug
    ? useNuxtData<TrackingProfile>(`public-provider-profile:${tenantDiscoverySlug}`).data.value
    : null

  const tenantRouteSlug = routeSlug
    ? useNuxtData<{ slug?: string }>(`public-tenant:${routeSlug}`).data.value?.slug ?? null
    : null

  return {
    routeSlug,
    routeProfile,
    tenantHomeSlug,
    tenantHomeProfile,
    tenantDiscoverySlug,
    tenantDiscoveryProfile,
    tenantRouteSlug
  }
}

function toAdsConfig(p: TrackingProfile | null | undefined): AdsConfig | null {
  if (!p) return null
  return {
    id: p.googleAdsId ?? null,
    label: p.googleAdsConversionLabel ?? null,
    tagId: p.googleTagId ?? null
  }
}

export async function mountTracking(): Promise<void> {
  const trackingResolvedState = useState<boolean>('tracking-resolved', () => false)

  const data = gatherNuxtData()

  // ── Google Ads ──
  const { ads } = resolveAdsContext({
    routeSlug: data.routeSlug,
    routeProfile: toAdsConfig(data.routeProfile),
    tenantHomeSlug: data.tenantHomeSlug,
    tenantHomeProfile: toAdsConfig(data.tenantHomeProfile),
    tenantDiscoverySlug: data.tenantDiscoverySlug,
    tenantDiscoveryProfile: toAdsConfig(data.tenantDiscoveryProfile),
    tenantRouteSlug: data.tenantRouteSlug
  })

  if (shouldMountGoogleAdsTag(ads)) {
    const { mountGoogleAds } = await import('~/features/consent/google-ads-runtime')
    mountGoogleAds({
      googleAdsId: ads.id,
      conversionLabel: ads.label,
      googleTagId: ads.tagId ?? null
    })
  }

  // ── Microsoft Clarity ──
  const clarityCtx = resolveClarityContext({
    routeSlug: data.routeSlug,
    routeProfile: data.routeProfile ?? null,
    tenantHomeSlug: data.tenantHomeSlug,
    tenantHomeProfile: data.tenantHomeProfile ?? null,
    tenantDiscoverySlug: data.tenantDiscoverySlug,
    tenantDiscoveryProfile: data.tenantDiscoveryProfile ?? null,
    tenantRouteSlug: data.tenantRouteSlug
  })

  if (clarityCtx.clarityId) {
    const { mountMicrosoftClarity } = await import('~/features/clarity/microsoft-clarity-runtime')
    mountMicrosoftClarity({ context: clarityCtx })
  }

  // Signal that the tracking context is fully resolved — CookieConsentBanner
  // uses this to avoid a race where a white-label visitor would see the
  // `simple` mode (acknowledge) before `googleAdsId` is set.
  trackingResolvedState.value = true
}
