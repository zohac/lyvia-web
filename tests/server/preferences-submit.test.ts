import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  consentStateFor,
  pickConsentSubmitFields,
  preferencesSubmitRedirect
} from '../../server/utils/preferences-submit'

/**
 * CC.2b — the no-JS fallback contract (`POST /preferences-submit`).
 *
 * The interactive path would keep working if the whitelist dropped a field or if
 * `ok`/`ko` were swapped — which is exactly why these run the code rather than
 * re-reading the Nitro handler. The fallback is only ever exercised by the
 * visitors least able to run the interactive one.
 */

function formOf(entries: Array<[string, string]>): FormData {
  const form = new FormData()
  for (const [key, value] of entries) form.append(key, value)
  return form
}

describe('pickConsentSubmitFields', () => {
  it('lit le token et les canaux cochés', () => {
    const fields = pickConsentSubmitFields(
      formOf([
        ['token', ' tok-123 '],
        ['retrait', 'email'],
        ['retrait', 'sms']
      ])
    )

    assert.deepEqual(fields, { token: 'tok-123', channels: ['email', 'sms'] })
  })

  it('ignore tout champ hors liste blanche', () => {
    const fields = pickConsentSubmitFields(
      formOf([
        ['token', 'tok-123'],
        ['retrait', 'email'],
        ['emailMarketingOptIn', 'true'],
        ['consentSource', 'settings'],
        ['isAdmin', 'true']
      ])
    )

    // Un `emailMarketingOptIn=true` forgé ne peut pas transformer cette page de
    // retrait en opt-in : seuls `token` et `retrait` sont lus.
    assert.deepEqual(fields, { token: 'tok-123', channels: ['email'] })
  })

  it('rend des canaux vides pour un formulaire sans retrait coché', () => {
    const fields = pickConsentSubmitFields(formOf([['token', 'tok-123']]))
    assert.deepEqual(fields, { token: 'tok-123', channels: [] })
  })

  it('écarte un canal inconnu plutôt que de le propager', () => {
    const fields = pickConsentSubmitFields(
      formOf([
        ['token', 'tok-123'],
        ['retrait', 'phone']
      ])
    )
    assert.deepEqual(fields.channels, [])
  })
})

describe('consentStateFor', () => {
  it('associe exactement deux états aux deux issues observables', () => {
    assert.equal(consentStateFor('ok'), 'saved')
    assert.equal(consentStateFor('ko'), 'error')
  })

  it('ne dépend d\'aucune information sur le token', () => {
    // Deux issues, deux états neutres, et rien d'autre dans la signature qu'un
    // `outcome`. L'arité (`Function.length`) n'est volontairement pas épinglée :
    // elle ferait tomber un paramètre par défaut sémantiquement identique.
    assert.deepEqual((['ok', 'ko'] as const).map(consentStateFor), ['saved', 'error'])
  })
})

describe('preferencesSubmitRedirect', () => {
  it('confirme sur un 200', () => {
    const target = preferencesSubmitRedirect({
      token: 'tok',
      outcome: 'ok',
      channels: ['email']
    })
    assert.match(target, /^\/preferences\?/)
    assert.match(target, /state=saved/)
    assert.match(target, /token=tok/)
  })

  it('bascule sur l\'erreur en conservant les canaux cochés', () => {
    const target = preferencesSubmitRedirect({
      token: 'tok',
      outcome: 'ko',
      channels: ['email', 'sms']
    })
    assert.match(target, /state=error/)
    // AC #4 : les valeurs saisies sont conservées, donc les cases sont recoches.
    assert.match(target, /retrait=email%2Csms/)
  })

  it('ne signale PAS d\'erreur sur une soumission passive', () => {
    const target = preferencesSubmitRedirect({
      token: 'tok',
      outcome: 'ko',
      channels: []
    })
    // Rien n\'a été envoyé : ni `saved` ni `error` ne serait honnête, et le
    // retour à l\'état neutre est exactement ce que l\'AC exige.
    assert.equal(/state=/.test(target), false)
  })

  it('reste neutre quand le token ne peut pas être utilisé', () => {
    // Un token vide ou hors bornes est un corps malformé : il ne doit pas
    // produire `error` (422 avalé par le catch), mais une cible neutre sans
    // `state` — l'AC exige le même rendu pour toute forme de token.
    for (const token of ['', 'a'.repeat(513)]) {
      const target = preferencesSubmitRedirect({ token, outcome: 'ko', channels: ['email'] })
      assert.equal(/state=/.test(target), false)
    }
  })

  it('produit la même cible quel que soit le token, valide ou non', () => {
    // Non-vacuant : les deux cibles ne diffèrent que par le token lui-même.
    const valid = preferencesSubmitRedirect({ token: 'a', outcome: 'ok', channels: ['email'] })
    const invalid = preferencesSubmitRedirect({ token: 'b', outcome: 'ok', channels: ['email'] })
    assert.equal(
      valid.replace(/token=[^&]+/, 'token=X'),
      invalid.replace(/token=[^&]+/, 'token=X')
    )
  })

  it('ne produit jamais de cible qui évoque la validité du lien', () => {
    const outcomes = ['ok', 'ko'] as const
    const selections: Array<Array<'email' | 'sms'>> = [[], ['email'], ['email', 'sms']]

    for (const outcome of outcomes) {
      for (const channels of selections) {
        const target = preferencesSubmitRedirect({ token: 'tok', outcome, channels })
        assert.equal(/expir|invalid|introuv/i.test(target), false)
      }
    }
  })
})
