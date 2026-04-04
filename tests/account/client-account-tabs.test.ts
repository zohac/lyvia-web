import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildClientAccountTabQuery,
  CLIENT_ACCOUNT_TAB_VALUES,
  parseClientAccountTab
} from '../../app/features/account/domain/client-account-tabs'

test('client account tabs: supported tab values stay explicit and stable', () => {
  assert.deepStrictEqual(CLIENT_ACCOUNT_TAB_VALUES, ['informations', 'paiements', 'preferences'])
})

test('client account tabs: parse returns informations by default', () => {
  assert.equal(parseClientAccountTab(undefined), 'informations')
  assert.equal(parseClientAccountTab(null), 'informations')
  assert.equal(parseClientAccountTab(''), 'informations')
})

test('client account tabs: parse accepts paiements and preferences', () => {
  assert.equal(parseClientAccountTab('paiements'), 'paiements')
  assert.equal(parseClientAccountTab('preferences'), 'preferences')
})

test('client account tabs: parse rejects unknown values safely', () => {
  assert.equal(parseClientAccountTab('legacy-payments'), 'informations')
  assert.equal(parseClientAccountTab(['unexpected', 'paiements']), 'informations')
})

test('client account tabs: build query removes tab for default tab', () => {
  const nextQuery = buildClientAccountTabQuery(
    { tab: 'paiements', page: '2', filter: 'recent' },
    'informations'
  )

  assert.deepStrictEqual(nextQuery, {
    page: '2',
    filter: 'recent'
  })
})

test('client account tabs: build query sets tab for paiements and preserves other params', () => {
  const nextQuery = buildClientAccountTabQuery(
    { page: '2', filter: 'recent' },
    'paiements'
  )

  assert.deepStrictEqual(nextQuery, {
    page: '2',
    filter: 'recent',
    tab: 'paiements'
  })
})

test('client account tabs: build query sets tab for preferences', () => {
  const nextQuery = buildClientAccountTabQuery(
    { source: 'email' },
    'preferences'
  )

  assert.deepStrictEqual(nextQuery, {
    source: 'email',
    tab: 'preferences'
  })
})
