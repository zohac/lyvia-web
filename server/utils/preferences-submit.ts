import {
  consentRedirectTarget,
  CONSENT_SUBMIT_FIELD,
  isPassiveConsentSubmission,
  parseConsentWithdrawals,
  readConsentToken,
  type ConsentPageState,
  type ConsentWithdrawalChannel
} from '../../app/features/preferences/consent-page'

/**
 * CC.2b — the decision logic of the no-JS fallback (`POST /preferences-submit`).
 *
 * Split out of the Nitro handler, exactly like `waitlist-submit.ts`, so it can
 * be tested by running the code. The JS path would keep working if the whitelist
 * dropped a field or the two outcomes were swapped, and nothing else would say
 * so — the fallback is only exercised by the visitors least able to run the
 * interactive path.
 *
 * The shared rules themselves (what a checked box means, what the redirect
 * looks like) live in `app/features/preferences/consent-page.ts` and are
 * imported, never re-implemented: the two paths disagreeing about what
 * `retrait=email` withdraws is precisely the bug this file's existence prevents.
 */

/**
 * Reads the whitelisted fields out of a `FormData`.
 *
 * The field names come from `CONSENT_SUBMIT_FIELD`, derived from
 * `CONSENT_SUBMIT_FIELDS`, so the whitelist is the single source of truth: a
 * name removed there is a name this stops reading. `getAll` for `retrait`
 * because a group of native checkboxes posts the same `name` once per box.
 */
export function pickConsentSubmitFields(form: FormData): {
  token: string
  channels: ConsentWithdrawalChannel[]
} {
  return {
    token: readConsentToken(form.get(CONSENT_SUBMIT_FIELD.token)),
    channels: parseConsentWithdrawals(form.getAll(CONSENT_SUBMIT_FIELD.retrait))
  }
}

/**
 * Which state a given outcome maps to.
 *
 * Only two outcomes exist and neither consults the token: a 200, or a 429 or a
 * transport failure. The API answers `200 { updated: true }` for every token, so
 * "the token was valid" is simply not information this handler can have.
 */
export function consentStateFor(outcome: 'ok' | 'ko'): ConsentPageState {
  return outcome === 'ok' ? 'saved' : 'error'
}

/**
 * Where to redirect after a submission.
 *
 * A passive submission — nothing checked, or a token that cannot be acted on —
 * short-circuits to the neutral page: no `state` is set, because no request was
 * made and there is nothing to report.
 */
export function preferencesSubmitRedirect(input: {
  token: string
  outcome: 'ok' | 'ko'
  channels: ConsentWithdrawalChannel[]
}): string {
  if (isPassiveConsentSubmission({ token: input.token, channels: input.channels })) {
    return consentRedirectTarget({ token: input.token, state: null, channels: [] })
  }

  return consentRedirectTarget({
    token: input.token,
    state: consentStateFor(input.outcome),
    channels: input.channels
  })
}
