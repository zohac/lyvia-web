/**
 * CC.2b — the contract of the tokenized public consent route.
 *
 * A separate contract from `client-preferences.contract.ts` because the two
 * paths are NOT the same thing: that one is the authenticated settings screen
 * (`GET` + `PATCH /client/preferences`, with pre-filled state and re-consent),
 * this one is a bearer-token write issued to a visitor who has no account yet.
 *
 * There is deliberately no `GET` here. Pre-filling would need a read that
 * distinguishes a valid token from an invalid one, which is exactly the oracle
 * the whole feature exists to deny (`cc-2a`).
 */

/**
 * `true` always, identically for every token — valid, unknown, revoked or
 * expired. It is a type, not a value the page is allowed to branch on.
 */
export type UpdatePublicConsentResponse = {
  updated: true
}

/**
 * Body of `PATCH /public/consent/preferences`.
 *
 * The flags are **absent**, never `true`: this page is a withdrawal channel
 * (decision arbitrated on 2026-10-11), so an unchecked box means "no change",
 * and only a checked one contributes an explicit `false`. A passive submission
 * therefore sends `{ token }` alone and asks for no write at all.
 */
export type UpdatePublicConsentRequest = {
  token: string
  emailMarketingOptIn?: boolean
  smsMarketingOptIn?: boolean
}
