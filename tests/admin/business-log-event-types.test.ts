/**
 * em-2b — la fonction pure qui traduit une sélection de chips en préfixes.
 *
 * Depuis em-2b, la taxonomie (familles, préfixes, ordre, exclusions) est servie
 * par l'API : ce module ne contient plus de liste. Ce qui reste à prouver ici est
 * l'aplatissement — et le fait qu'il dépende de ce que l'API sert, pas d'une
 * copie locale.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  prefixesForFamilies,
  type BusinessLogEventFamily
} from '../../app/features/admin/domain/business-log-event-types'

// Fixture volontairement différente de la taxonomie réelle : si le panneau
// retenait une copie de la liste, ces clés inconnues ne seraient jamais servies.
const FAMILIES: BusinessLogEventFamily[] = [
  { key: 'payment', label: 'Paiements', prefixes: ['PAYMENT_', 'PAYMENTS_'] },
  {
    key: 'appointment',
    label: 'RDV',
    prefixes: ['APPOINTMENT_', 'APPOINTMENTS_', 'FREE_FOLLOWUP_']
  },
  { key: 'program', label: 'Programmes', prefixes: ['PROGRAM_'] }
]

test('em-2b: cliquer une famille envoie tous ses préfixes, pluriels compris', () => {
  assert.deepEqual(prefixesForFamilies(FAMILIES, ['payment']), [
    'PAYMENT_',
    'PAYMENTS_'
  ])
})

test('em-2b: plusieurs familles s additionnent dans l ordre servi, pas celui des clics', () => {
  assert.deepEqual(prefixesForFamilies(FAMILIES, ['program', 'payment']), [
    'PAYMENT_',
    'PAYMENTS_',
    'PROGRAM_'
  ])
})

test('em-2b: aucune sélection n envoie aucun préfixe', () => {
  // Sans cela la requête partirait avec un filtre vide, qui ne filtre pas mais
  // prétend le contraire à l'écran.
  assert.deepEqual(prefixesForFamilies(FAMILIES, []), [])
})

test('em-2b: une clé inconnue de l API est ignorée, pas inventée', () => {
  assert.deepEqual(prefixesForFamilies(FAMILIES, ['nope']), [])
  assert.deepEqual(prefixesForFamilies(FAMILIES, ['nope', 'program']), [
    'PROGRAM_'
  ])
})

test('em-2b: les préfixes servis sont utilisés tels quels, sans re-découpage', () => {
  const custom: BusinessLogEventFamily[] = [
    { key: 'custom', label: 'Custom', prefixes: ['MUTATED_PREFIX_'] }
  ]
  assert.deepEqual(prefixesForFamilies(custom, ['custom']), ['MUTATED_PREFIX_'])
})
