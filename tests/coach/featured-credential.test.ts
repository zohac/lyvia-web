import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  findFeaturedCredential,
  orderCredentialsForDisplay,
  selectHeroCredential
} from '../../app/features/coach/domain/featured-credential'

describe('LAB.3 — sélection de la certification mise en avant (helper pur)', () => {
  test('la certification `featured` est retenue même si elle n\'est pas la première (AC2)', () => {
    const credentials = [
      { title: 'Première' },
      { title: 'Deuxième' },
      { title: 'Mise en avant', featured: true }
    ]

    assert.equal(selectHeroCredential(credentials)?.title, 'Mise en avant')
    assert.equal(findFeaturedCredential(credentials)?.title, 'Mise en avant')
  })

  test('sans `featured`, la ligne retombe sur la première certification (AC3)', () => {
    const credentials = [{ title: 'Première' }, { title: 'Deuxième' }]

    assert.equal(selectHeroCredential(credentials)?.title, 'Première')
  })

  test('sans `featured`, le logo de mise en avant reste absent (findFeature rend null)', () => {
    const credentials = [{ title: 'Première' }, { title: 'Deuxième' }]

    assert.equal(findFeaturedCredential(credentials), null)
  })

  test('deux `featured` en base → la première est retenue (défense en profondeur AC1)', () => {
    const credentials = [
      { title: 'Première' },
      { title: 'Featured A', featured: true },
      { title: 'Featured B', featured: true }
    ]

    assert.equal(selectHeroCredential(credentials)?.title, 'Featured A')
    assert.equal(findFeaturedCredential(credentials)?.title, 'Featured A')
  })

  test('liste vide ou absente → null, aucun accès hors bornes', () => {
    assert.equal(selectHeroCredential([]), null)
    assert.equal(selectHeroCredential(null), null)
    assert.equal(selectHeroCredential(undefined), null)
    assert.equal(findFeaturedCredential([]), null)
    assert.equal(findFeaturedCredential(null), null)
  })

  test('le rail place la mise en avant en première position (jamais masquée)', () => {
    const credentials = [
      { title: 'Première' },
      { title: 'Deuxième' },
      { title: 'Mise en avant', featured: true }
    ]

    assert.deepEqual(
      orderCredentialsForDisplay(credentials).map(cred => cred.title),
      ['Mise en avant', 'Première', 'Deuxième']
    )
  })

  test('l\'ordre déclaré est conservé quand rien n\'est mis en avant', () => {
    const credentials = [{ title: 'A' }, { title: 'B' }, { title: 'C' }]

    assert.deepEqual(
      orderCredentialsForDisplay(credentials).map(cred => cred.title),
      ['A', 'B', 'C']
    )
  })

  test('le tri du rail ne mute pas la liste reçue', () => {
    const credentials = [{ title: 'A' }, { title: 'B', featured: true }]

    orderCredentialsForDisplay(credentials)

    assert.deepEqual(credentials, [{ title: 'A' }, { title: 'B', featured: true }])
  })

  test('le helper ne mute pas la liste reçue', () => {
    const credentials = [{ title: 'Première' }, { title: 'Featured', featured: true }]

    selectHeroCredential(credentials)

    assert.deepEqual(credentials, [
      { title: 'Première' },
      { title: 'Featured', featured: true }
    ])
  })
})
