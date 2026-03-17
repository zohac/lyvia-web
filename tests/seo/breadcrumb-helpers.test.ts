import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  buildCoachBreadcrumbs,
  buildBookingBreadcrumbs,
  buildLegalBreadcrumbs
} from '../../app/features/seo/breadcrumb-helpers'

describe('buildCoachBreadcrumbs', () => {
  test('platform: returns Accueil > displayName', () => {
    const items = buildCoachBreadcrumbs('Sophie Jouan', true)
    assert.equal(items.length, 2)
    assert.deepStrictEqual(items[0], { label: 'Accueil', to: '/' })
    assert.deepStrictEqual(items[1], { label: 'Sophie Jouan' })
  })

  test('white-label: returns empty (home = coach profile)', () => {
    const items = buildCoachBreadcrumbs('Sophie Jouan', false)
    assert.equal(items.length, 0)
  })
})

describe('buildBookingBreadcrumbs', () => {
  test('platform: returns Accueil > displayName > Appel découverte', () => {
    const items = buildBookingBreadcrumbs('Sophie Jouan', 'sophie-jouan', true)
    assert.equal(items.length, 3)
    assert.deepStrictEqual(items[0], { label: 'Accueil', to: '/' })
    assert.deepStrictEqual(items[1], { label: 'Sophie Jouan', to: '/coach/sophie-jouan' })
    assert.deepStrictEqual(items[2], { label: 'Appel découverte' })
  })

  test('white-label: returns Accueil > Appel découverte (no coach link)', () => {
    const items = buildBookingBreadcrumbs('Sophie Jouan', 'sophie-jouan', false)
    assert.equal(items.length, 2)
    assert.deepStrictEqual(items[0], { label: 'Accueil', to: '/' })
    assert.deepStrictEqual(items[1], { label: 'Appel découverte' })
  })
})

describe('buildLegalBreadcrumbs', () => {
  test('returns Accueil > pageTitle', () => {
    const items = buildLegalBreadcrumbs('Conditions Générales d\'Utilisation')
    assert.equal(items.length, 2)
    assert.deepStrictEqual(items[0], { label: 'Accueil', to: '/' })
    assert.deepStrictEqual(items[1], { label: 'Conditions Générales d\'Utilisation' })
  })

  test('last item has no link (current page)', () => {
    const items = buildLegalBreadcrumbs('Mentions légales')
    assert.equal(items[1].to, undefined)
  })
})
