import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  pickWaitlistFields,
  WAITLIST_ERROR_REDIRECT,
  WAITLIST_RECEIVED_REDIRECT,
  waitlistRedirectFor,
  waitlistRedirectForState,
  waitlistStateRedirectWithReplay
} from '../../server/utils/waitlist-submit'
import { createWaitlistReplayStore } from '../../server/utils/waitlist-replay-store'

/**
 * Contrat du fallback sans JavaScript (`POST /waitlist-submit`).
 *
 * Le chemin JS continuerait de fonctionner si ces deux fonctions étaient
 * inversées ou amputées — c'est précisément pourquoi elles sont testées en
 * exécutant le code plutôt qu'en relisant le handler Nitro.
 */

function formOf(entries: Record<string, string>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(entries)) form.set(key, value)
  return form
}

describe('pickWaitlistFields', () => {
  it('reprend les huit champs du formulaire, ébarbés', () => {
    const body = pickWaitlistFields(formOf({
      firstName: '  Émilie ',
      lastName: 'Dupont',
      email: ' emilie@example.com ',
      specialty: 'naturopathie',
      activityStage: 'preparation-lancement',
      mainBlocker: 'partie-technique',
      discoverySource: 'recommandation',
      message: 'Bonjour'
    }))

    assert.deepEqual(body, {
      firstName: 'Émilie',
      lastName: 'Dupont',
      email: 'emilie@example.com',
      specialty: 'naturopathie',
      activityStage: 'preparation-lancement',
      mainBlocker: 'partie-technique',
      discoverySource: 'recommandation',
      message: 'Bonjour'
    })
  })

  it('produit un corps vide pour un FormData vide', () => {
    // Cas réel d'un formulaire soumis sans aucun attribut `name` : l'API répond
    // 422 et la page doit basculer sur l'état d'erreur, pas sur la confirmation.
    assert.deepEqual(pickWaitlistFields(new FormData()), {})
  })

  it('ignore tout champ hors liste blanche', () => {
    const body = pickWaitlistFields(formOf({
      firstName: 'Émilie',
      isAdmin: 'true',
      legalConsent: 'true'
    }))

    assert.deepEqual(body, { firstName: 'Émilie' })
  })

  it('écarte les valeurs vides ou blanches', () => {
    const body = pickWaitlistFields(formOf({
      firstName: 'Émilie',
      lastName: '   ',
      discoverySource: ''
    }))

    assert.deepEqual(body, { firstName: 'Émilie' })
  })

  it('relaye le champ leurre : sans lui, l\'API ne peut pas rejeter le robot', () => {
    // L'oubli le plus grave : un champ absent de la liste blanche est
    // supprimé AVANT l'appel API, donc le rejet n'a jamais lieu — sans
    // produire le moindre signal.
    const body = pickWaitlistFields(formOf({
      firstName: 'Émilie',
      website: '  https://spam.example  '
    }))

    assert.deepEqual(body, { firstName: 'Émilie', website: 'https://spam.example' })
  })

  it('garde la première valeur d\'un champ répétée', () => {
    // `FormData.get()` rend la première occurrence : un formulaire qui
    // enverrait deux fois le même nom ne doit pas voir la dernière wins.
    const form = new FormData()
    form.append('firstName', 'Première')
    form.append('firstName', 'Seconde')

    assert.deepEqual(pickWaitlistFields(form), { firstName: 'Première' })
  })
})

describe('waitlistRedirectFor', () => {
  it('confirme la demande quand l\'API a enregistré le lead', () => {
    assert.equal(waitlistRedirectFor(true), WAITLIST_RECEIVED_REDIRECT)
  })

  it('bascule sur l\'état d\'erreur quand l\'API n\'a rien enregistré', () => {
    assert.equal(waitlistRedirectFor(false), WAITLIST_ERROR_REDIRECT)
    assert.equal(waitlistRedirectFor(undefined), WAITLIST_ERROR_REDIRECT)
  })

  it('pointe vers deux ancres distinctes', () => {
    assert.notEqual(WAITLIST_RECEIVED_REDIRECT, WAITLIST_ERROR_REDIRECT)
    assert.match(WAITLIST_RECEIVED_REDIRECT, /access=received/)
    assert.match(WAITLIST_ERROR_REDIRECT, /access=error/)
  })
})

describe('waitlistRedirectForState', () => {
  it('nomme les trois états d\'échec sans jeton', () => {
    assert.equal(waitlistRedirectForState('error'), '/?access=error#waitlist')
    assert.equal(waitlistRedirectForState('rate-limited'), '/?access=rate-limited#waitlist')
    assert.equal(waitlistRedirectForState('unavailable'), '/?access=unavailable#waitlist')
  })

  it('porte le jeton de restitution pour chaque état', () => {
    for (const state of ['error', 'rate-limited', 'unavailable'] as const) {
      const target = waitlistStateRedirectWithReplay(state, 'jeton-abc')
      assert.equal(target, `/?access=${state}&r=jeton-abc#waitlist`)
    }
  })

  it('échappe le jeton dans l\'URL', () => {
    assert.equal(
      waitlistStateRedirectWithReplay('error', 'a b&c=d'),
      '/?access=error&r=a%20b%26c%3Dd#waitlist'
    )
  })
})

// ── Restitution des valeurs (décision D2) ──

describe('createWaitlistReplayStore', () => {
  it('rend les valeurs une seule fois', () => {
    const store = createWaitlistReplayStore()
    const token = store.save({ email: 'marie@example.com' })

    assert.deepEqual(store.consume(token), { email: 'marie@example.com' })
    assert.equal(store.consume(token), null, 'un jeton est à usage unique')
  })

  it('ignore un jeton inconnu', () => {
    const store = createWaitlistReplayStore()
    assert.equal(store.consume('jamais-emis'), null)
  })

  it('oublie un jeton expiré', () => {
    let now = 1_000
    const store = createWaitlistReplayStore({ now: () => now, ttlMs: 100 })
    const token = store.save({ email: 'marie@example.com' })

    now += 101
    assert.equal(store.consume(token), null)
  })

  it('borne le nombre d\'entrées vivantes', () => {
    const store = createWaitlistReplayStore({ maxEntries: 3 })
    const tokens = ['a', 'b', 'c', 'd'].map(n => store.save({ firstName: n }))

    assert.equal(store.size(), 3)
    assert.equal(store.consume(tokens[0] as string), null, 'la plus ancienne est évincée')
    assert.deepEqual(store.consume(tokens[3] as string), { firstName: 'd' })
  })

  it('évince les entrées expirées avant d\'en ajouter une', () => {
    let now = 1_000
    const store = createWaitlistReplayStore({ now: () => now, ttlMs: 100, maxEntries: 3 })

    store.save({ firstName: 'a' })
    store.save({ firstName: 'b' })
    now += 200
    const freshToken = store.save({ firstName: 'c' })

    assert.equal(store.size(), 1)
    assert.deepEqual(store.consume(freshToken), { firstName: 'c' })
  })
})
