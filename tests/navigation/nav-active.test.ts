import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { isNavItemActive, type NavMatchItem } from '../../app/features/navigation/domain/nav-active'

const contents: NavMatchItem = { label: 'Contenus', to: '/provider/content', match: 'prefix' }
const keova: NavMatchItem = { label: 'Articles Keova', to: '/provider/content/keova', match: 'prefix' }
const payments: NavMatchItem = { label: 'Paramètres', to: '/provider/settings/payments', match: 'prefix' }
const notifications: NavMatchItem = { label: 'Notifications', to: '/provider/settings/notifications', match: 'prefix' }
const home: NavMatchItem = { label: 'Vue d\'ensemble', to: '/provider/dashboard', match: 'exact' }

const all: NavMatchItem[] = [home, contents, keova, payments, notifications]

describe('isNavItemActive', () => {
  test('the section stays active on its own page', () => {
    assert.equal(isNavItemActive('/provider/content', contents, all), true)
  })

  test('the nested entry does not light up the section it lives in', () => {
    assert.equal(isNavItemActive('/provider/content/keova', contents, all), false)
    assert.equal(isNavItemActive('/provider/content/keova', keova, all), true)
  })

  test('the section stays active on a child that has no entry of its own', () => {
    assert.equal(isNavItemActive('/provider/content/1234', contents, all), true)
  })

  test('two sibling prefixes under the same parent are independent', () => {
    assert.equal(isNavItemActive('/provider/settings/notifications', payments, all), false)
    assert.equal(isNavItemActive('/provider/settings/notifications', notifications, all), true)
    assert.equal(isNavItemActive('/provider/settings/payments', payments, all), true)
    assert.equal(isNavItemActive('/provider/settings/payments', notifications, all), false)
  })

  test('exact entries ignore sub-paths', () => {
    assert.equal(isNavItemActive('/provider/dashboard', home, all), true)
    assert.equal(isNavItemActive('/provider/dashboard/extra', home, all), false)
  })

  test('an item with no match mode only matches its own path', () => {
    const sparse: NavMatchItem = { to: '/provider/pages' }
    assert.equal(isNavItemActive('/provider/pages', sparse, all), true)
    assert.equal(isNavItemActive('/provider/pages/1234', sparse, all), false)
  })
})
