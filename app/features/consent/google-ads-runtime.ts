import {
  COOKIE_CONSENT_NAME,
  GOOGLE_ADS_CONVERSION_FALLBACK_TIMEOUT_MS,
  resolveGoogleAdsConversionId,
  resolvePrimaryGoogleTagId,
  shouldFireConversion,
  shouldFireConversionPixel,
  shouldRestoreConsent,
  toGoogleAdsConversionPayload,
  toGoogleAdsConversionPixelUrl,
  toConsentSignals,
  type ConsentValue
} from './consent-logic'

declare global {
  interface Window {
    dataLayer: Array<IArguments | unknown[]>
    gtag?: GtagFn
  }
}

type GtagFn = (...args: unknown[]) => void

type GoogleAdsScriptElement = {
  async: boolean
  src: string
}

type GoogleAdsWindow = {
  dataLayer?: Array<IArguments | unknown[]>
  gtag?: GtagFn
}

type GoogleAdsConversionImage = {
  src: string
}

type ScheduleFallback = (callback: () => void, timeoutMs: number) => unknown

export function injectGoogleAdsTag<TScript extends GoogleAdsScriptElement>(
  createScript: () => TScript,
  appendToHead: (element: TScript) => void,
  tagId: string
): void {
  const script = createScript()
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`
  appendToHead(script)
}

export function installGoogleAdsTag<TScript extends GoogleAdsScriptElement>(
  targetWindow: GoogleAdsWindow,
  createScript: () => TScript,
  appendToHead: (element: TScript) => void,
  tagId: string
): GtagFn {
  targetWindow.dataLayer = targetWindow.dataLayer || []
  const gtag = function gtag() {
    // Keep Google's official queue shape: function gtag(){dataLayer.push(arguments);}
    // eslint-disable-next-line prefer-rest-params
    targetWindow.dataLayer?.push(arguments)
  } as GtagFn
  targetWindow.gtag = gtag

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  })

  injectGoogleAdsTag(createScript, appendToHead, tagId)

  gtag('js', new Date())
  gtag('config', tagId)

  return gtag
}

export function fireGoogleAdsConversionPixel(input: {
  googleAdsId: string | null | undefined
  conversionLabel: string | null | undefined
  createImage?: () => GoogleAdsConversionImage
  now?: () => number
}): boolean {
  const pixelUrl = toGoogleAdsConversionPixelUrl(
    input.googleAdsId,
    input.conversionLabel,
    input.now?.() ?? Date.now()
  )
  if (!pixelUrl) return false

  const image = input.createImage?.() ?? new Image()
  image.src = pixelUrl
  return true
}

export function fireGoogleAdsConversion(input: {
  gtag: GtagFn | null | undefined
  googleAdsId: string | null | undefined
  conversionLabel: string | null | undefined
  consent: ConsentValue
  transactionId?: string | null
  createImage?: () => GoogleAdsConversionImage
  scheduleFallback?: ScheduleFallback
  now?: () => number
}): boolean {
  const payload = toGoogleAdsConversionPayload(
    input.googleAdsId,
    input.conversionLabel,
    input.transactionId
  )
  const canUseGtag = shouldFireConversion(Boolean(input.gtag), input.googleAdsId, input.conversionLabel)

  if (!payload) return false

  if (!canUseGtag) {
    if (!shouldFireConversionPixel(input.consent, input.googleAdsId, input.conversionLabel)) {
      return false
    }
    return fireGoogleAdsConversionPixel(input)
  }

  let gtagAcknowledged = false
  input.gtag?.('event', 'conversion', {
    ...payload,
    event_callback: () => {
      gtagAcknowledged = true
    },
    event_timeout: GOOGLE_ADS_CONVERSION_FALLBACK_TIMEOUT_MS
  })

  if (shouldFireConversionPixel(input.consent, input.googleAdsId, input.conversionLabel)) {
    const scheduleFallback = input.scheduleFallback ?? ((callback, timeoutMs) => {
      window.setTimeout(callback, timeoutMs)
    })

    scheduleFallback(() => {
      if (gtagAcknowledged) return
      // Fallback bypass for gtag.js silent failure (story 0-29; see investigation).
      fireGoogleAdsConversionPixel(input)
    }, GOOGLE_ADS_CONVERSION_FALLBACK_TIMEOUT_MS)
  }

  return true
}

export function mountGoogleAds(input: {
  googleAdsId: string
  conversionLabel: string | null
  googleTagId?: string | null
}): void {
  const { googleAdsId, conversionLabel, googleTagId = null } = input
  const primaryTagId = resolvePrimaryGoogleTagId({ googleAdsId, googleTagId })
  const googleAdsConversionId = resolveGoogleAdsConversionId(googleAdsId)
  if (!primaryTagId) return

  const gtagState = useState<GtagFn | null>('gtag', () => null)
  const googleAdsIdState = useState<string | null>('googleAdsId', () => null)
  const googleTagIdState = useState<string | null>('googleTagId', () => null)
  const googleAdsConversionLabelState = useState<string | null>('googleAdsConversionLabel', () => null)

  googleAdsIdState.value = googleAdsConversionId
  googleTagIdState.value = primaryTagId.startsWith('GT-') ? primaryTagId : null
  googleAdsConversionLabelState.value = conversionLabel

  if (gtagState.value) return

  const gtag = installGoogleAdsTag(
    window,
    () => document.createElement('script'),
    (script) => {
      document.head.appendChild(script)
    },
    primaryTagId
  )

  if (googleAdsConversionId && primaryTagId !== googleAdsConversionId) {
    gtag('config', googleAdsConversionId)
  }

  gtagState.value = gtag

  const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
  if (shouldRestoreConsent(consent.value)) {
    gtag('consent', 'update', toConsentSignals(true))
  }
}
