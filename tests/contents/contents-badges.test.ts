import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getStatusBadge, getVisibilityBadge, getTypeBadge } from '../../app/features/contents/domain/contents-badges'

test('status badge', () => {
  assert.deepEqual(getStatusBadge(true), { color: 'success', label: 'Publié' })
  assert.deepEqual(getStatusBadge(false), { color: 'neutral', label: 'Brouillon' })
})

test('visibility badge', () => {
  assert.deepEqual(getVisibilityBadge('public'), { color: 'info', label: 'Public' })
  assert.deepEqual(getVisibilityBadge('private'), { color: 'warning', label: 'Privé' })
})

test('type badge', () => {
  assert.deepEqual(getTypeBadge('article'), { color: 'primary', label: 'Article' })
  assert.deepEqual(getTypeBadge('recette'), { color: 'secondary', label: 'Recette' })
  assert.deepEqual(getTypeBadge('actualite'), { color: 'neutral', label: 'Actualité' })
  assert.deepEqual(getTypeBadge('unknown'), { color: 'neutral', label: 'unknown' })
})