import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { formatCredentialMeta } from '../../app/features/coach/domain/credential-meta'

describe('LAB.1 — formatCredentialMeta (helper pur)', () => {
  test('les deux champs renseignés → "organisme · année"', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', institution: 'Menopulse', year: 2026 }),
      'Menopulse · 2026'
    )
  })

  test('organisme seul → "organisme"', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', institution: 'Menopulse' }),
      'Menopulse'
    )
  })

  test('année seule → "année"', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', year: 2026 }),
      '2026'
    )
  })

  test('aucun des deux → null (pas de ligne secondaire)', () => {
    assert.equal(formatCredentialMeta({ title: 'T' }), null)
  })

  test('year === null (LAB.4, nullable) → ignoré, pas "null" affiché', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', institution: 'Menopulse', year: null }),
      'Menopulse'
    )
    assert.equal(formatCredentialMeta({ title: 'T', year: null }), null)
  })

  test('year === 0 est une année valide, pas un absent', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', institution: 'X', year: 0 }),
      'X · 0'
    )
  })

  test('institution vide/whitespace → ignorée', () => {
    assert.equal(
      formatCredentialMeta({ title: 'T', institution: '   ', year: 2024 }),
      '2024'
    )
  })
})
