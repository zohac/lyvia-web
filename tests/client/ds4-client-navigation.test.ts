import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import {
  CLIENT_NAVIGATION,
  getClientNavigationItems
} from '../../app/features/navigation/domain/client-navigation'

const repoRoot = process.cwd()
const appRoot = path.resolve(repoRoot, 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

test('DS4.1: client navigation exposes 4 visible entries including Ressources', () => {
  const labels = getClientNavigationItems().map(item => item.label)

  assert.deepStrictEqual(labels, ['Accueil', 'Mes rendez-vous', 'Mon compte', 'Ressources'])
  assert.equal(labels.length, 4)
})

test('DS4.1: client navigation no longer exposes legacy account entries', () => {
  const labels = getClientNavigationItems().map(item => item.label)
  const paths = getClientNavigationItems().map(item => item.to)

  assert.equal(labels.includes('Paiements'), false)
  assert.equal(labels.includes('Paramètres'), false)
  assert.equal(paths.includes('/client/payments'), false)
  assert.equal(paths.includes('/client/settings'), false)

  assert.equal(labels.includes('Ressources'), true)
  assert.equal(paths.includes('/client/content'), true)
})

test('DS4.1: client navigation has an Accompagnement group with Ressources', () => {
  const group = CLIENT_NAVIGATION.groups.find(g => g.label === 'Accompagnement')
  assert.ok(group, 'groupe Accompagnement manquant')
  assert.equal(group!.items.length, 1)
  assert.equal(group!.items[0].label, 'Ressources')
  assert.equal(group!.items[0].to, '/client/content')
})

test('DS4.1: client navigation home entry points to dashboard', () => {
  assert.equal(CLIENT_NAVIGATION.home.label, 'Accueil')
  assert.equal(CLIENT_NAVIGATION.home.to, '/client/dashboard')
})

test('DS4.1: dashboard payments CTA points directly to account payments tab', () => {
  const source = readAppFile('pages/client/dashboard.vue')

  assert.equal(source.includes('to="/client/payments"'), false)
  assert.ok(source.includes('to="/client/account?tab=paiements"'))
})

test('DS4.1: choose-slot pending payment CTA points directly to account payments tab', () => {
  const source = readAppFile('pages/client/consultation/choose-slot.vue')

  assert.equal(source.includes('to="/client/payments"'), false)
  assert.ok(source.includes('to="/client/account?tab=paiements"'))
})

test('DS4.1: account tabs keep content mounted between tab switches', () => {
  const source = readAppFile('pages/client/account.vue')

  assert.ok(source.includes(':unmount-on-hide="false"'))
})

test('DS4.1: routeRules preserve legacy client account routes with redirects', () => {
  const configSource = fs.readFileSync(path.resolve(repoRoot, 'nuxt.config.ts'), 'utf-8')

  assert.ok(
    configSource.includes('\'/client/payments\': { redirect: { to: \'/client/account?tab=paiements\', statusCode: 301 } }')
  )
  assert.ok(
    configSource.includes('\'/client/settings\': { redirect: { to: \'/client/account?tab=preferences\', statusCode: 301 } }')
  )
  assert.equal(
    configSource.includes('\'/client/content\': { redirect: { to: \'/client/dashboard\', statusCode: 301 } }'),
    false
  )
})
