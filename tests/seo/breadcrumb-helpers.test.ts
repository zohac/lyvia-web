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

// --- AC-6: UI/Schema.org synchronization (CR1) ---

describe('AC-6 breadcrumb sync', () => {
  test('coach breadcrumb label matches Schema.org BreadcrumbList structure', () => {
    const displayName = 'Sophie Jouan'
    const uiItems = buildCoachBreadcrumbs(displayName, true)

    // Schema.org BreadcrumbList (from useCoachSchemaOrg): Accueil > {displayName}
    // UI must match: same hierarchy, same labels
    assert.equal(uiItems.length, 2)
    assert.equal(uiItems[0].label, 'Accueil')
    assert.equal(uiItems[1].label, displayName)
  })

  test('booking breadcrumb labels match Schema.org structure (platform)', () => {
    const displayName = 'Sophie Jouan'
    const uiItems = buildBookingBreadcrumbs(displayName, 'sophie-jouan', true)

    // Schema.org (from useBookingSchemaOrg): Accueil > {displayName} > Appel découverte
    assert.equal(uiItems.length, 3)
    assert.equal(uiItems[0].label, 'Accueil')
    assert.equal(uiItems[1].label, displayName)
    assert.equal(uiItems[2].label, 'Appel découverte')
  })

  test('booking breadcrumb labels match Schema.org structure (white-label)', () => {
    const uiItems = buildBookingBreadcrumbs('Sophie Jouan', 'sophie-jouan', false)

    // Schema.org (from useBookingSchemaOrg WL): Accueil > Appel découverte
    assert.equal(uiItems.length, 2)
    assert.equal(uiItems[0].label, 'Accueil')
    assert.equal(uiItems[1].label, 'Appel découverte')
  })
})
