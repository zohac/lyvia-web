import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  pickWaitlistValues,
  WAITLIST_FAILURE_MESSAGES,
  WAITLIST_SUBMIT_FIELDS,
  waitlistAccessStateForStatus,
  waitlistErrorStatus,
  waitlistFailureStateFromAccess
} from '../../shared/utils/waitlist-submission'

/**
 * Contrat partagé par le chemin JavaScript et le chemin sans JavaScript.
 *
 * Ces tests visent le module lui-même, pas une de ses copies : le serveur
 * (`server/utils/waitlist-submit.ts`) et le composant (`WaitlistForm.vue`)
 * importent le même fichier, donc une divergence ici casse les deux clients
 * en même temps — ce qu'un test qui recopierait les constantes ne prouverait
 * jamais.
 */

describe('WAITLIST_SUBMIT_FIELDS', () => {
  it('porte les huit champs humains et le champ leurre', () => {
    assert.deepEqual([...WAITLIST_SUBMIT_FIELDS], [
      'firstName', 'lastName', 'email', 'specialty', 'activityStage',
      'mainBlocker', 'discoverySource', 'message', 'website'
    ])
  })
})

describe('pickWaitlistValues', () => {
  it('relaye le leurre quand il est rempli', () => {
    const body = pickWaitlistValues({ firstName: 'Émilie', website: 'https://spam.example' })
    assert.equal(body.website, 'https://spam.example')
  })

  it('omet le leurre vide ou blanc', () => {
    for (const website of ['', '   ']) {
      const body = pickWaitlistValues({ firstName: 'Émilie', website })
      assert.equal('website' in body, false, `le leurre ${JSON.stringify(website)} ne doit pas partir`)
    }
  })

  it('ébarbe les valeurs et ignore les non-chaînes', () => {
    const body = pickWaitlistValues({
      firstName: '  Émilie ',
      specialty: undefined,
      activityStage: 42,
      website: '  https://spam.example  '
    })
    assert.deepEqual(body, { firstName: 'Émilie', website: 'https://spam.example' })
  })

  it('ne restitue jamais le leurre : le replay ne le stocke pas', () => {
    const replay = pickWaitlistValues({ firstName: 'Émilie', website: 'https://spam.example' }, { replay: true })
    assert.deepEqual(replay, { firstName: 'Émilie' })
    assert.equal('website' in replay, false)
  })
})

describe('waitlistAccessStateForStatus', () => {
  it('classe la validation en error', () => {
    assert.equal(waitlistAccessStateForStatus(422), 'error')
    assert.equal(waitlistAccessStateForStatus(400), 'error')
  })

  it('classe le débit en rate-limited', () => {
    assert.equal(waitlistAccessStateForStatus(429), 'rate-limited')
  })

  it('classe le système en unavailable', () => {
    assert.equal(waitlistAccessStateForStatus(500), 'unavailable')
    assert.equal(waitlistAccessStateForStatus(503), 'unavailable')
  })

  it('classe la panne réseau en unavailable', () => {
    // `apiFetch` normalise une panne réseau en statut 0 ; un `undefined`
    // couvre l'absence totale de réponse.
    assert.equal(waitlistAccessStateForStatus(0), 'unavailable')
    assert.equal(waitlistAccessStateForStatus(undefined), 'unavailable')
  })
})

describe('waitlistFailureStateFromAccess', () => {
  it('traduit les trois états d\'échec nommés', () => {
    assert.equal(waitlistFailureStateFromAccess('error'), 'error')
    assert.equal(waitlistFailureStateFromAccess('rate-limited'), 'rate-limited')
    assert.equal(waitlistFailureStateFromAccess('unavailable'), 'unavailable')
  })

  it('ne produit aucun état pour une valeur inconnue ou absente', () => {
    assert.equal(waitlistFailureStateFromAccess('received'), null)
    assert.equal(waitlistFailureStateFromAccess('bogus'), null)
    assert.equal(waitlistFailureStateFromAccess(undefined), null)
    assert.equal(waitlistFailureStateFromAccess(['error', 'unavailable']), null)
  })
})

describe('waitlistErrorStatus', () => {
  it('lit le statut porté par une erreur de fetch', () => {
    assert.equal(waitlistErrorStatus(Object.assign(new Error('upstream'), { statusCode: 429 })), 429)
  })

  it('retombe sur `status` quand `statusCode` est absent', () => {
    assert.equal(waitlistErrorStatus({ status: 503 }), 503)
  })

  it('rend undefined sans réponse', () => {
    assert.equal(waitlistErrorStatus(new Error('ECONNREFUSED')), undefined)
    assert.equal(waitlistErrorStatus(null), undefined)
    assert.equal(waitlistErrorStatus('boom'), undefined)
  })
})

describe('WAITLIST_FAILURE_MESSAGES', () => {
  it('porte les trois libellés verbatim de l\'epic (AC-3)', () => {
    assert.equal(
      WAITLIST_FAILURE_MESSAGES['error'],
      'Votre demande n’a pas pu être envoyée. Merci de vérifier les champs obligatoires puis de réessayer.'
    )
    assert.equal(
      WAITLIST_FAILURE_MESSAGES['rate-limited'],
      'Trop de tentatives. Réessayez plus tard.'
    )
    assert.equal(
      WAITLIST_FAILURE_MESSAGES['unavailable'],
      'Un problème technique a empêché l’envoi de votre demande. Vos informations restent pré-remplies ci-dessous — vous pouvez réessayer.'
    )
  })
})
