import {
  COOKIE_CONSENT_NAME,
  shouldRestoreConsent,
  toConsentSignals,
  type ConsentValue
} from './consent-logic'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

type GtagFn = (...args: unknown[]) => void

type GoogleAdsScriptElement = {
  async: boolean
  src: string
}

export function injectGoogleAdsTag<TScript extends GoogleAdsScriptElement>(
  createScript: () => TScript,
  appendToHead: (element: TScript) => void,
  googleAdsId: string
): void {
  const script = createScript()
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`
  appendToHead(script)
}

export function mountGoogleAds(input: {
  googleAdsId: string
  conversionLabel: string | null
}): void {
  const { googleAdsId, conversionLabel } = input

  const gtagState = useState<GtagFn | null>('gtag', () => null)
  const googleAdsIdState = useState<string | null>('googleAdsId', () => null)
  const googleAdsConversionLabelState = useState<string | null>('googleAdsConversionLabel', () => null)

  if (gtagState.value) return

  googleAdsIdState.value = googleAdsId
  googleAdsConversionLabelState.value = conversionLabel

  window.dataLayer = window.dataLayer || []
  const gtag: GtagFn = function (...args: unknown[]) {
    window.dataLayer.push(args)
  }

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  })

  injectGoogleAdsTag(
    () => document.createElement('script'),
    (script) => {
      document.head.appendChild(script)
    },
    googleAdsId
  )

  gtag('js', new Date())
  gtag('config', googleAdsId)

  gtagState.value = gtag

  const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME)
  if (shouldRestoreConsent(consent.value)) {
    gtag('consent', 'update', toConsentSignals(true))
  }
}
