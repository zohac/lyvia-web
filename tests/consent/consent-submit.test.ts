import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiFetchError } from '../../app/services/api/api-error'
import {
  buildConsentSubmission,
  consentOutcomeFor,
  consentOutcomeToast,
  CONSENT_ERROR_MESSAGE,
  CONSENT_RATE_LIMIT_MESSAGE,
  CONSENT_RATE_LIMIT_STATUS,
  isRateLimitedError,
  readErrorStatusCode
} from '../../app/features/preferences/consent-submit'

/**
 * CC.2b / R5 — the rules of one submission of the withdrawal page.
 *
 * These are the decisions the `.vue` page and the no-JS relay both depend on.
 * The page is an SFC and the repo has no Vue runner: before this module
 * existed, the body the page actually submitted was built by code NO test
 * could run, and a page that submitted a fixed list of channels instead of the
 * visitor's own kept the whole suite green.
 */

describe('buildConsentSubmission', () => {
  it('envoie un `false` explicite par canal coché, et rien pour les autres', () => {
    // La régression R5 : une sélection PARTIELLE ne doit produire que le canal
    // coché. Si la page envoyait une sélection fixe, ce corps serait faux.
    const submission = buildConsentSubmission({ token: 'tok', channels: ['email'] })

    assert.equal(submission.passive, false)
    assert.deepEqual(submission.body, {
      token: 'tok',
      emailMarketingOptIn: false
    })
    assert.equal('smsMarketingOptIn' in (submission.body ?? {}), false)
  })

  it('n\'envoie JAMAIS `true` — la page est un canal de retrait', () => {
    const submission = buildConsentSubmission({ token: 'tok', channels: ['email', 'sms'] })

    assert.equal(submission.body?.emailMarketingOptIn, false)
    assert.equal(submission.body?.smsMarketingOptIn, false)
    assert.equal((Object.values(submission.body ?? {}) as unknown[]).includes(true), false)
  })

  it('produit le corps des DEUX canaux quand les deux sont cochés', () => {
    const submission = buildConsentSubmission({ token: 'tok', channels: ['email', 'sms'] })

    assert.deepEqual(submission.body, {
      token: 'tok',
      emailMarketingOptIn: false,
      smsMarketingOptIn: false
    })
  })

  it('ne produit AUCUN corps quand rien n\'est coché', () => {
    // Une soumission passive n'atteint pas l'API : elle demanderait une
    // écriture vide, ou un 422 keyed sur la forme du token.
    const submission = buildConsentSubmission({ token: 'tok', channels: [] })

    assert.equal(submission.passive, true)
    assert.equal(submission.body, null)
  })

  it('ne produit AUCUN corps pour un token inutilisable', () => {
    // Token vide ou trop long : un lien malformé, pas un lien inconnu. La
    // réponse doit rester neutre pour toute forme de token.
    for (const token of ['', 'a'.repeat(513)]) {
      const submission = buildConsentSubmission({ token, channels: ['email'] })
      assert.equal(submission.passive, true, `token de ${token.length} caractères`)
      assert.equal(submission.body, null)
    }
  })

  it('produit le même corps pour un token valide et pour un token inconnu', () => {
    // L'invariant central de la feature : rien ne dépend de la validité.
    const valid = buildConsentSubmission({ token: 'tok', channels: ['email'] })
    const unknown = buildConsentSubmission({ token: 'nimporte-quoi', channels: ['email'] })

    assert.deepEqual(
      { ...valid.body, token: 'X' },
      { ...unknown.body, token: 'X' }
    )
  })
})

describe('readErrorStatusCode', () => {
  it('lit le statut d\'une `ApiFetchError` (chemin navigateur)', () => {
    const error = new ApiFetchError({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes'
    })

    assert.equal(readErrorStatusCode(error), 429)
  })

  it('lit le statut d\'une erreur de transport (chemin no-JS)', () => {
    // ofetch expose `statusCode` ET `response.status` : les deux formes
    // doivent être lues, sinon le relais perdrait la distinction.
    assert.equal(readErrorStatusCode({ statusCode: 429 }), 429)
    assert.equal(readErrorStatusCode({ response: { status: 429 } }), 429)
    assert.equal(readErrorStatusCode({ status: '429' }), 429)
  })

  it('rend `null` quand il n\'y a pas de statut', () => {
    assert.equal(readErrorStatusCode(new Error('réseau coupé')), null)
    assert.equal(readErrorStatusCode(null), null)
    assert.equal(readErrorStatusCode(undefined), null)
    assert.equal(readErrorStatusCode('429'), null)
  })
})

describe('isRateLimitedError', () => {
  it('reconnaît le 429, quelle que soit sa forme', () => {
    assert.equal(isRateLimitedError(new ApiFetchError({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes'
    })), true)
    assert.equal(isRateLimitedError({ statusCode: 429 }), true)
    assert.equal(isRateLimitedError({ response: { status: 429 } }), true)
  })

  it('ne confond pas un 429 avec une autre erreur', () => {
    assert.equal(isRateLimitedError(new ApiFetchError({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Oups'
    })), false)
    assert.equal(isRateLimitedError(new Error('réseau coupé')), false)
    assert.equal(isRateLimitedError({ statusCode: 422 }), false)
  })

  it('reconnaît le 429 quel que soit le chemin, avec le même code', () => {
    // Les deux chemins doivent partager la règle, sinon l'un des deux perd la
    // distinction — c'est exactement ce que le relais Nitro fait.
    assert.equal(CONSENT_RATE_LIMIT_STATUS, 429)
  })
})

describe('consentOutcomeFor', () => {
  it('distingue le 429 de l\'échec générique', () => {
    assert.equal(consentOutcomeFor({ statusCode: 429 }), 'rate-limited')
    assert.equal(consentOutcomeFor({ statusCode: 500 }), 'error')
    assert.equal(consentOutcomeFor(new Error('réseau coupé')), 'error')
  })

  it('ne dépend pas du token : la même erreur, le même verdict', () => {
    // Le 429 est infrastructurel (bucket partagé, LB2-5) : il compte des
    // requêtes, pas des tokens. Dire la même chose pour un token valide et
    // pour un token inconnu ne régresse pas.
    const withValidToken = consentOutcomeFor({ statusCode: 429 })
    const withUnknownToken = consentOutcomeFor({ statusCode: 429 })

    assert.equal(withValidToken, withUnknownToken)
  })
})

describe('les messages', () => {
  it('le message throttled reprend le libellé du dépôt', () => {
    // Aligné sur `WaitlistForm` / `LeadCaptureForm` / `CoachLeadCapture`.
    assert.match(CONSENT_RATE_LIMIT_MESSAGE, /^Trop de tentatives\. Réessayez plus tard\./)
  })

  it('les deux messages promettent que les choix sont conservés', () => {
    // L'AC de cc-2b exige la conservation des valeurs en cas d\'erreur : la
    // visiteuse ne doit pas avoir à recocher ses cases.
    assert.match(CONSENT_RATE_LIMIT_MESSAGE, /Vos choix sont conservés/)
    assert.match(CONSENT_ERROR_MESSAGE, /Vos choix sont conservés/)
  })

  it('aucun message n\'évoque le token, sa validity ou son âge', () => {
    for (const message of [CONSENT_ERROR_MESSAGE, CONSENT_RATE_LIMIT_MESSAGE]) {
      assert.equal(/token|expir|invalid|introuv/i.test(message), false, message)
    }
  })

  it('l\'erreur générique dit que rien n\'a été enregistré', () => {
    assert.match(CONSENT_ERROR_MESSAGE, /n’ont pas pu être enregistrées/)
  })
})

describe('consentOutcomeToast', () => {
  it('accompagne le succès', () => {
    assert.deepEqual(consentOutcomeToast('saved'), {
      title: 'Préférences enregistrées',
      color: 'success'
    })
  })

  it('accompagne le 429 avec le libellé du dépôt', () => {
    const toast = consentOutcomeToast('rate-limited')

    assert.equal(toast.title, 'Trop de tentatives. Réessayez plus tard.')
    assert.equal(toast.description, 'Vos choix sont conservés.')
    assert.equal(toast.color, 'error')
  })

  it('accompagne l\'échec générique', () => {
    const toast = consentOutcomeToast('error')

    assert.equal(toast.title, 'Erreur')
    assert.equal(toast.color, 'error')
  })

  it('ne dit jamais quoi que ce soit du token', () => {
    for (const outcome of ['saved', 'error', 'rate-limited'] as const) {
      const toast = consentOutcomeToast(outcome)
      const text = `${toast.title} ${toast.description ?? ''}`
      assert.equal(/token|expir|invalid/i.test(text), false, text)
    }
  })
})
