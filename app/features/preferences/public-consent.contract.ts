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
 *
 * The type says `false` and not `boolean` on purpose: this route WITHDRAWS, it
 * never grants. A `true` here would write `email_marketing_opt_in = true` with
 * `consent_source = 'settings'` and a `CLIENT_COMMUNICATION_CONSENT_UPDATED`
 * business log — a proof of consent (art. 7(1)) that nobody gave, and a
 * prospection the client never asked for. The backend refuses it too (the DTO
 * only accepts `false`), but the type makes the mistake unrepresentable here.
 */
export type UpdatePublicConsentRequest = {
  token: string
  emailMarketingOptIn?: false
  smsMarketingOptIn?: false
}
