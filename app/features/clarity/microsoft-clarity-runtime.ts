import {
  shouldLoadClarity,
  type ClarityResolution
} from './microsoft-clarity-helpers'

type ClarityWindow = Record<string, unknown>

type ClarityScriptElement = {
  async: boolean
  src: string
}

export function injectClarityTag<TScript extends ClarityScriptElement>(
  targetWindow: ClarityWindow,
  createScript: () => TScript,
  appendToHead: (element: TScript) => void,
  clarityId: string
): void {
  const fn = function (...args: unknown[]) {
    ((targetWindow['clarity'] as { q?: unknown[] }).q = (targetWindow['clarity'] as { q?: unknown[] }).q || []).push(args)
  }
  fn.q = [] as unknown[]
  targetWindow['clarity'] = fn

  const script = createScript()
  script.async = true
  script.src = `https://www.clarity.ms/tag/${clarityId}`
  appendToHead(script)
}

export function mountMicrosoftClarity(input: {
  context: ClarityResolution
  cookieConsent: string | null
}): void {
  const { context, cookieConsent } = input

  if (!context.clarityId || !shouldLoadClarity(context.googleAdsId, cookieConsent)) {
    return
  }

  const targetWindow = window as unknown as Record<string, unknown>
  if (typeof targetWindow.clarity === 'function') {
    return
  }

  injectClarityTag(
    targetWindow,
    () => document.createElement('script'),
    (script) => {
      document.head.appendChild(script)
    },
    context.clarityId
  )
}
