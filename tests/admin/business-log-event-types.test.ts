/**
 * em-2 — la correspondance famille → préfixes du panneau des business logs.
 *
 * Le bug corrigé : le panneau envoyait `PAYMENT_` et l'API comparait par
 * égalité exacte, donc le filtre ne pouvait rien renvoyer ; et les familles
 * plurielles (`PAYMENTS_*`, `APPOINTMENTS_*`) n'étaient couvertes par aucun
 * préfixe. Ces tests portent sur la fonction PURE qui produit la requête
 * (`prefixesForFamilies`) et sur les préfixes réels émis par l'API.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  BUSINESS_LOG_EVENT_FAMILIES,
  prefixesForFamilies
} from '../../app/features/admin/domain/business-log-event-types'

test('em-2: cliquer « Paiements » envoie le singulier ET le pluriel', () => {
  assert.deepEqual(prefixesForFamilies(['payment']), ['PAYMENT_', 'PAYMENTS_'])
})

test('em-2: cliquer « RDV » couvre les familles plurielles et le cycle de vie', () => {
  const prefixes = prefixesForFamilies(['appointment'])
  for (const expected of [
    'APPOINTMENT_',
    'APPOINTMENTS_',
    'FREE_FOLLOWUP_',
    'REQUEST_',
    'CONSULTATION_',
    'MEETING_LINK_'
  ]) {
    assert.ok(prefixes.includes(expected), `missing prefix ${expected}`)
  }
})

test('em-2: « Auth » couvre les événements auth sans préfixe AUTH_', () => {
  const prefixes = prefixesForFamilies(['auth'])
  assert.ok(prefixes.includes('AUTH_'))
  assert.ok(prefixes.includes('PASSWORD_'))
  assert.ok(prefixes.includes('EMAIL_'))
})

test('em-2: plusieurs familles s additionnent, sans doublon', () => {
  const prefixes = prefixesForFamilies(['payment', 'appointment'])
  assert.deepEqual(prefixes, [
    'PAYMENT_',
    'PAYMENTS_',
    'APPOINTMENT_',
    'APPOINTMENTS_',
    'FREE_FOLLOWUP_',
    'REQUEST_',
    'CONSULTATION_',
    'MEETING_LINK_'
  ])
  assert.equal(new Set(prefixes).size, prefixes.length)
})

test('em-2: aucune famille sélectionnée n envoie aucun préfixe', () => {
  // Sans cela la requête partirait avec un filtre vide, qui ne filtre pas mais
  // prétend le contraire à l'écran.
  assert.deepEqual(prefixesForFamilies([]), [])
})

test('em-2: les 6 familles historiques sont conservées', () => {
  const keys = BUSINESS_LOG_EVENT_FAMILIES.map(family => family.key)
  assert.deepEqual(keys, [
    'payment',
    'appointment',
    'client',
    'provider',
    'stripe',
    'auth'
  ])
})

test('em-2: chaque préfixe est un préfixe réel (terminé par _)', () => {
  // Un préfixe qui ne se termine pas par `_` matcherait par accident des
  // familles voisines (`PAYMENT` -> `PAYMENTX…`).
  for (const family of BUSINESS_LOG_EVENT_FAMILIES) {
    assert.ok(family.prefixes.length > 0, `${family.key} has no prefix`)
    for (const prefix of family.prefixes) {
      assert.match(prefix, /^[A-Z][A-Z0-9_]*_$/, `${family.key}: ${prefix}`)
    }
  }
})

test('em-2: la sélection de toutes les familles tient dans la limite API (20)', () => {
  // `ListAdminBusinessLogsQueryDto` plafonne `eventType` à 20 valeurs
  // (`@ArrayMaxSize(20)`). Sélectionner tous les chips est un geste normal :
  // s'il dépassait la limite, l'API répondrait 400 sur un filtre légitime.
  const all = prefixesForFamilies(
    BUSINESS_LOG_EVENT_FAMILIES.map(family => family.key)
  )
  assert.ok(all.length <= 20, `too many prefixes: ${all.length}`)
})
