import { defineEventHandler, readFormData, sendRedirect } from 'h3'

import { setForwardedHeaders } from '../utils/forwarded-headers'
import {
  buildConsentWithdrawalPatch,
  isPassiveConsentSubmission,
  type ConsentWithdrawalSelection
} from '../../app/features/preferences/consent-page'
import {
  pickConsentSubmitFields,
  preferencesSubmitRedirect
} from '../utils/preferences-submit'

/**
 * CC.2b — the no-JS fallback of the withdrawal page.
 *
 * The SSR form posts in `application/x-www-form-urlencoded` here; this relays a
 * PATCH to `/public/consent/preferences` and redirects (303) back to
 * `/preferences` with a neutral state. The interactive path uses the same API
 * endpoint through `apiFetch`, so the two cannot drift on what the API does —
 * only on transport.
 *
 * It relays, and nothing more. No validity check, no 404, no "expired link": the
 * API answers `200 { updated: true }` for every token, and a branch here keyed on
 * the token's fate would hand back the oracle `cc-2a` exists to deny.
 *
 * Nothing is logged: the token is a bearer credential and lives in the query
 * string of a `no-store` page.
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const upstreamBase = (config.apiBase as string | undefined) ?? 'http://localhost:3001'

  const form = await readFormData(event).catch(() => null)
  const selection: ConsentWithdrawalSelection = form
    ? pickConsentSubmitFields(form)
    : { token: '', channels: [] }

  function redirectTo(outcome: 'ok' | 'ko'): Promise<void> {
    return sendRedirect(
      event,
      preferencesSubmitRedirect({
        token: selection.token,
        outcome,
        channels: selection.channels
      }),
      303
    )
  }

  // Passive submission: nothing was checked, or the token cannot be acted on
  // (blank or over-long — a malformed link, not an unknown one). Asking the API
  // anyway would write `consent_source = 'settings'` on a no-op PATCH, or come
  // back 422 and render an error keyed on the token's shape. This page's whole
  // safety argument is that reopening the link cannot change anything and that
  // no token shape gets its own state.
  if (isPassiveConsentSubmission(selection)) {
    return redirectTo('ok')
  }

  try {
    // `setForwardedHeaders` carries the visitor's IP, like the public proxy does.
    // Without it every no-JS request would share one rate-limit bucket, and the
    // shared-bucket defect (LB2-5) would degrade a legitimate withdrawal into a
    // silent 429.
    const headers = new Headers({ accept: 'application/json' })
    setForwardedHeaders(headers, event)

    await $fetch(`${upstreamBase.replace(/\/+$/, '')}/public/consent/preferences`, {
      method: 'PATCH',
      body: buildConsentWithdrawalPatch(selection.token, selection.channels),
      headers
    })

    return redirectTo('ok')
  } catch {
    // Transport failure or 429 — both independent of the token's validity, so
    // this branch says nothing about whether the link is live.
    return redirectTo('ko')
  }
})
