import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getStatusBadge, getDiffusionBadge, getTypeBadge } from '../../app/features/contents/domain/contents-badges'

test('status badge', () => {
  assert.deepEqual(getStatusBadge(true), { color: 'success', label: 'Publié' })
  assert.deepEqual(getStatusBadge(false), { color: 'neutral', label: 'Brouillon' })
})

test('diffusion badge', () => {
  assert.deepEqual(getDiffusionBadge('all'), { color: 'info', label: 'Toutes mes clientes' })
  assert.deepEqual(getDiffusionBadge('selected'), { color: 'warning', label: 'Clientes choisies' })
})

test('type badge', () => {
  assert.deepEqual(getTypeBadge('article'), { color: 'primary', label: 'Article' })
  assert.deepEqual(getTypeBadge('recette'), { color: 'secondary', label: 'Recette' })
  assert.deepEqual(getTypeBadge('actualite'), { color: 'neutral', label: 'Actualité' })
  assert.deepEqual(getTypeBadge('unknown'), { color: 'neutral', label: 'unknown' })
})
