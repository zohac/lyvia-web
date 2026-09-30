import { defineEventHandler, readFormData, sendRedirect } from 'h3'

import { setForwardedHeaders } from '../utils/forwarded-headers'
import { waitlistReplayStore } from '../utils/waitlist-replay-store'
import {
  pickWaitlistFields,
  WAITLIST_ERROR_REDIRECT,
  waitlistErrorRedirectWithReplay,
  waitlistRedirectFor
} from '../utils/waitlist-submit'

/**
 * LB.3 — Fallback sans JavaScript de la demande d'accès.
 *
 * Le formulaire SSR poste en `application/x-www-form-urlencoded` vers cette
 * route, qui relaie la demande au vrai traitement serveur (`POST /public/waitlist`)
 * puis redirige vers la landing avec un état de confirmation lisible sans JS.
 * La version interactive (JS) utilise le même endpoint API via `apiFetch`.
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const upstreamBase = (config.apiBase as string | undefined) ?? 'http://localhost:3001'

  const form = await readFormData(event).catch(() => null)
  if (!form) {
    return sendRedirect(event, WAITLIST_ERROR_REDIRECT, 303)
  }

  const body = pickWaitlistFields(form)

  /**
   * Un échec fait perdre la saisie : on la garde côté serveur derrière un jeton
   * à usage unique, que la landing consomme pour pré-remplir le formulaire.
   * Rien n'est mis en URL (hors le jeton opaque) ni dans un cookie.
   */
  function redirectToError(): Promise<void> {
    const hasSomethingToRestore = Object.keys(body).length > 0
    const target = hasSomethingToRestore
      ? waitlistErrorRedirectWithReplay(waitlistReplayStore.save(body))
      : WAITLIST_ERROR_REDIRECT

    return sendRedirect(event, target, 303)
  }

  try {
    // `setForwardedHeaders` porte l'IP de la visiteuse, comme le proxy public.
    // Sans lui, toutes les demandes sans JavaScript partageraient un unique
    // bucket de rate limit côté API (IP du conteneur Nitro).
    const headers = new Headers({ accept: 'application/json' })
    setForwardedHeaders(headers, event)

    const response = await $fetch<{ registered?: boolean }>(
      `${upstreamBase.replace(/\/+$/, '')}/public/waitlist`,
      {
        method: 'POST',
        body,
        headers
      }
    )

    if (response?.registered) {
      return sendRedirect(event, waitlistRedirectFor(true), 303)
    }

    return redirectToError()
  } catch {
    return redirectToError()
  }
})
