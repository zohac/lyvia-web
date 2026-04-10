import {
  shouldFetchClarityProfile,
  shouldLoadClarity,
  type ClarityProfile,
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

export async function runMicrosoftClarityMounted(input: {
  context: ClarityResolution
  cookieConsent: string | null
  fetchProfile: (slug: string) => Promise<ClarityProfile>
  injectClarity: (clarityId: string) => void
}): Promise<void> {
  const { context, cookieConsent, fetchProfile, injectClarity } = input

  if (context.clarityId && shouldLoadClarity(context.googleAdsId, cookieConsent)) {
    injectClarity(context.clarityId)
    return
  }

  if (!shouldFetchClarityProfile(context.slug, context.profileResolved)) {
    return
  }

  try {
    const profile = await fetchProfile(context.slug as string)
    if (profile.microsoftClarityId && shouldLoadClarity(profile.googleAdsId ?? null, cookieConsent)) {
      injectClarity(profile.microsoftClarityId)
    }
  } catch {
    // Silent fail — no Clarity tracking on this page
  }
}
