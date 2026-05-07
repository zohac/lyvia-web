import {
  COOKIE_CONSENT_NAME,
  resolvePrimaryGoogleTagId,
  shouldRestoreConsent,
  toConsentSignals,
  type ConsentValue
} from './consent-logic'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: GtagFn
  }
}

type GtagFn = (...args: unknown[]) => void

type GoogleAdsScriptElement = {
  async: boolean
  src: string
}

type GoogleAdsWindow = {
  dataLayer?: unknown[]
  gtag?: GtagFn
}

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
  const gtag: GtagFn = function () {
    targetWindow.dataLayer?.push(arguments)
  }
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

export function mountGoogleAds(input: {
  googleAdsId: string
  conversionLabel: string | null
  googleTagId?: string | null
}): void {
  const { googleAdsId, conversionLabel, googleTagId = null } = input
  const primaryTagId = resolvePrimaryGoogleTagId({ googleAdsId, googleTagId })
  if (!primaryTagId) return

  const gtagState = useState<GtagFn | null>('gtag', () => null)
  const googleAdsIdState = useState<string | null>('googleAdsId', () => null)
  const googleTagIdState = useState<string | null>('googleTagId', () => null)
  const googleAdsConversionLabelState = useState<string | null>('googleAdsConversionLabel', () => null)

  googleAdsIdState.value = googleAdsId
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

  if (primaryTagId !== googleAdsId) {
    gtag('config', googleAdsId)
  }

  gtagState.value = gtag

  const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
  if (shouldRestoreConsent(consent.value)) {
    gtag('consent', 'update', toConsentSignals(true))
  }
}
