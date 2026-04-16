import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import {
  ADMIN_TOOL_TAB_VALUES,
  buildAdminToolTabQuery,
  parseAdminToolTab
} from '../../app/features/admin/domain/admin-tools-tabs'
import {
  ADMIN_NAVIGATION,
  getAdminNavigationItems
} from '../../app/features/navigation/domain/admin-navigation'

const repoRoot = process.cwd()
const appRoot = path.resolve(repoRoot, 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

test('DS4.2: admin navigation exposes exactly 5 visible entries', () => {
  const labels = getAdminNavigationItems().map(item => item.label)

  assert.deepStrictEqual(labels, ['Dashboard', 'Providers', 'Clients', 'Templates pages', 'Outils', 'Design System'])
  assert.equal(labels.length, 6)
  assert.equal(ADMIN_NAVIGATION.home.to, '/admin/dashboard')
})

test('DS4.2: admin navigation no longer exposes SEO as visible item', () => {
  const labels = getAdminNavigationItems().map(item => item.label)

  assert.equal(labels.includes('SEO'), false)
})

test('DS4.2: admin tools tabs stay explicit and stable', () => {
  assert.deepStrictEqual(ADMIN_TOOL_TAB_VALUES, ['analytics', 'logs', 'notifications', 'waitlist'])
})

test('DS4.2: admin tools tab parser accepts valid values', () => {
  assert.equal(parseAdminToolTab('logs'), 'logs')
  assert.equal(parseAdminToolTab('notifications'), 'notifications')
  assert.equal(parseAdminToolTab('waitlist'), 'waitlist')
})

test('DS4.2: admin tools tab parser falls back safely to analytics', () => {
  assert.equal(parseAdminToolTab(undefined), 'analytics')
  assert.equal(parseAdminToolTab(null), 'analytics')
  assert.equal(parseAdminToolTab('abc'), 'analytics')
})

test('DS4.2: admin tools tab query builder removes tab for default analytics tab', () => {
  assert.deepStrictEqual(
    buildAdminToolTabQuery({ tab: 'logs', page: '2' }, 'analytics'),
    { page: '2' }
  )
})

test('DS4.2: admin tools tab query builder preserves other params for waitlist', () => {
  assert.deepStrictEqual(
    buildAdminToolTabQuery({ page: '2', filter: 'all' }, 'waitlist'),
    { page: '2', filter: 'all', tab: 'waitlist' }
  )
})

test('DS4.2: tools page uses DsPageHeader and keeps tabs mounted', () => {
  const source = readAppFile('pages/admin/tools.vue')

  assert.ok(source.includes('<AtomsDsPageHeader'))
  assert.ok(source.includes(':unmount-on-hide="false"'))
})

test('DS4.2: tools page renders waitlist placeholder and does not expose SEO as a tab', () => {
  const source = readAppFile('pages/admin/tools.vue')

  assert.ok(source.includes('title="Waitlist"'))
  assert.ok(source.includes('description="Cette section sera bientôt disponible pour gérer les leads en attente."'))
  assert.equal(source.includes('value: \'seo\''), false)
})

test('DS4.2: dashboard logs CTA points directly to tools logs tab', () => {
  const source = readAppFile('pages/admin/dashboard.vue')

  assert.ok(source.includes('to="/admin/tools?tab=logs"'))
  assert.equal(source.includes('to="/admin/logs"'), false)
})

test('DS4.2: routeRules preserve admin legacy redirects', () => {
  const configSource = fs.readFileSync(path.resolve(repoRoot, 'nuxt.config.ts'), 'utf-8')

  assert.ok(
    configSource.includes('\'/admin/analytics\': { redirect: { to: \'/admin/tools?tab=analytics\', statusCode: 301 } }')
  )
  assert.ok(
    configSource.includes('\'/admin/logs\': { redirect: { to: \'/admin/tools?tab=logs\', statusCode: 301 } }')
  )
  assert.ok(
    configSource.includes('\'/admin/business-logs\': { redirect: { to: \'/admin/tools?tab=logs\', statusCode: 301 } }')
  )
  assert.ok(
    configSource.includes('\'/admin/notification-logs\': { redirect: { to: \'/admin/tools?tab=notifications\', statusCode: 301 } }')
  )
})

test('DS4.2: SEO remains accessible via direct URL and is not redirected away', () => {
  const configSource = fs.readFileSync(path.resolve(repoRoot, 'nuxt.config.ts'), 'utf-8')
  const seoPageSource = readAppFile('pages/admin/seo.vue')

  assert.equal(configSource.includes('\'/admin/seo\': { redirect:'), false)
  assert.ok(seoPageSource.includes('pageTitle: \'SEO\''))
})
