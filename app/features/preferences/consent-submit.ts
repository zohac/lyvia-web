import type { UpdatePublicConsentRequest } from './public-consent.contract'
import {
  buildConsentWithdrawalPatch,
  isPassiveConsentSubmission,
  type ConsentWithdrawalChannel
} from './consent-page'

/**
 * CC.2b / R5 — the rules of ONE submission of the tokenized withdrawal page.
 *
 * The page is a `.vue` file and the repo has no Vue runner: an SFC cannot be
 * executed by the Node test runner, so anything decided inside it is decided
 * *outside* any test. That is the gap this module closes — the body the page
 * actually POSTs is built HERE, by code the tests run, and the page only
 * supplies the visitor's selection.
 *
 * It is also the single place where the page and the no-JS relay agree on
 * what a submission means. The relay imports the same classification, so the
 * two paths cannot drift on "is this a transport failure or a throttled
 * request?".
 *
 * Two invariants, both from the feature's AC:
 *
 * 1. **Nothing depends on the token's validity.** The API answers
 *    `200 { updated: true }` for every token, so "the token is alive" is not
 *    information this module can have — and it never asks for it. A 429 is
 *    infrastructureal (a shared rate-limit bucket, LB2-5): it counts requests,
 *    not tokens, which is exactly why telling it apart from a transport
 *    failure breaks nothing.
 * 2. **A checked box is a withdrawal.** Only an explicit `false` is ever
 *    sent, and only for the channels actually checked — the mapping itself
 *    lives in `buildConsentWithdrawalPatch` and is not re-implemented here.
 */

/**
 * What a submission amounts to.
 *
 * `passive` means "nothing to send": no channel checked, or a token that
 * cannot be acted on (blank, or longer than the API accepts). Such a
 * submission must not reach the API — it would write `consent_source` on a
 * no-op PATCH, or come back 422 and render an error keyed on the token's
 * *shape*.
 */
export type ConsentSubmission
  = | { passive: true, body: null }
    | { passive: false, body: UpdatePublicConsentRequest }

/**
 * Builds the request the page submits.
 *
 * A passive submission yields no body at all — the caller must not send
 * anything. Otherwise the body is the explicit `false` per checked channel,
 * and the unchecked channel is simply absent (there is no read to know its
 * current value, and writing anything else would overwrite an intact
 * channel).
 */
export function buildConsentSubmission(input: {
  token: string
  channels: ConsentWithdrawalChannel[]
}): ConsentSubmission {
  if (isPassiveConsentSubmission(input)) {
    return { passive: true, body: null }
  }

  return {
    passive: false,
    body: buildConsentWithdrawalPatch(input.token, input.channels)
  }
}

/**
 * How a submission ended.
 *
 * `rate-limited` is a state of its own, not a flavour of `error`: the
 * withdrawal did not happen *yet* because the shared bucket (LB2-5) said
 * "not now", which is a different promise to make to the visitor than
 * "something went wrong".
 */
export type ConsentSubmitOutcome = 'saved' | 'error' | 'rate-limited'

/** The status a rate-limited answer carries. */
export const CONSENT_RATE_LIMIT_STATUS = 429

/**
 * Reads the HTTP status out of whatever the transport threw.
 *
 * Two shapes reach this module, and neither is the other's:
 *
 * - the browser path throws `ApiFetchError`, whose status lives in
 *   `apiError.statusCode`;
 * - the no-JS relay throws ofetch's `FetchError`, whose status lives in
 *   `statusCode` (and in `response.status`).
 *
 * Duck-typing both keeps the rule in ONE place instead of one per caller —
 * a caller that forgets the second shape silently loses the distinction.
 */
export function readErrorStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null

  const candidate = error as {
    apiError?: { statusCode?: unknown }
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }

  const values = [
    candidate.apiError?.statusCode,
    candidate.statusCode,
    candidate.status,
    candidate.response?.status
  ]

  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

/**
 * Whether the failure is a throttled request.
 *
 * Purely infrastructural: the bucket counts requests per IP, so the answer
 * says nothing about the token — the same verdict for a valid token and for
 * an unknown one.
 */
export function isRateLimitedError(error: unknown): boolean {
  return readErrorStatusCode(error) === CONSENT_RATE_LIMIT_STATUS
}

/**
 * The outcome a failed submission maps to.
 *
 * A transport failure (no status at all, or any status other than 429) is a
 * generic error; only the throttled one gets its own message.
 */
export function consentOutcomeFor(error: unknown): 'error' | 'rate-limited' {
  return isRateLimitedError(error) ? 'rate-limited' : 'error'
}

/**
 * Generic failure wording.
 *
 * It says the preferences were NOT saved — never that the link is dead — and
 * it says the visitor's choices are preserved, because the AC requires the
 * values to survive an error (the no-JS path carries them back in the
 * redirect, the JS path keeps the boxes checked).
 */
export const CONSENT_ERROR_MESSAGE
  = 'Vos préférences n’ont pas pu être enregistrées. Vos choix sont conservés : vous pouvez réessayer.'

/**
 * Throttled wording.
 *
 * The repo's existing label for a 429 (« Trop de tentatives. Réessayez plus
 * tard. » — `WaitlistForm`, `LeadCaptureForm`, `CoachLeadCapture`), plus the
 * same promise as the generic error: the visitor's choices are preserved and
 * she can try again. Nothing here mentions the token, its age or its validity.
 */
export const CONSENT_RATE_LIMIT_MESSAGE
  = 'Trop de tentatives. Réessayez plus tard. Vos choix sont conservés.'

/** The toast that accompanies a submission outcome. */
export type ConsentOutcomeToast = {
  title: string
  description?: string
  color: 'success' | 'error'
}

/**
 * The toast payload for an outcome.
 *
 * The toast is never the only carrier of the information (the `role="status"`
 * region is), but it must not contradict it either — so the wording lives
 * here, next to the messages, and not in the template.
 */
export function consentOutcomeToast(outcome: ConsentSubmitOutcome): ConsentOutcomeToast {
  if (outcome === 'saved') {
    return { title: 'Préférences enregistrées', color: 'success' }
  }

  if (outcome === 'rate-limited') {
    return {
      title: 'Trop de tentatives. Réessayez plus tard.',
      description: 'Vos choix sont conservés.',
      color: 'error'
    }
  }

  return {
    title: 'Erreur',
    description: 'Vos préférences n’ont pas pu être enregistrées.',
    color: 'error'
  }
}
