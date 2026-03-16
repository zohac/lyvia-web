import * as assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainContext } from '../../shared/utils/domain-context'

const PLATFORM = 'keova.fr'

// Tests the domain-context contract as used by the robots.txt handler — not a handler integration test.
// The h3 event wiring (getRequestHost, setResponseHeader) is not exercised here.
function buildRobotsTxt(host: string, protocol = 'https'): string {
  const origin = `${protocol}://${host}`
  const ctx = getDomainContext(host, PLATFORM)

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...ctx.robotsDisallowPaths.map(p => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`
  ]

  return lines.join('\n') + '\n'
}

// --- platform ---

test('robots.txt platform: contains User-agent and Allow', () => {
  const output = buildRobotsTxt('keova.fr')
  assert.ok(output.includes('User-agent: *'))
  assert.ok(output.includes('Allow: /'))
})

test('robots.txt platform: disallows auth paths', () => {
  const output = buildRobotsTxt('keova.fr')
  assert.ok(output.includes('Disallow: /client/'))
  assert.ok(output.includes('Disallow: /provider/'))
  assert.ok(output.includes('Disallow: /admin/'))
  assert.ok(output.includes('Disallow: /api/'))
  assert.ok(output.includes('Disallow: /login'))
  assert.ok(output.includes('Disallow: /reset-password'))
  assert.ok(output.includes('Disallow: /verify-email'))
  assert.ok(output.includes('Disallow: /forgot-password'))
})

test('robots.txt platform: does NOT disallow /coaches', () => {
  const output = buildRobotsTxt('keova.fr')
  assert.equal(output.includes('Disallow: /coaches'), false)
})

test('robots.txt platform: sitemap points to platform domain', () => {
  const output = buildRobotsTxt('keova.fr')
  assert.ok(output.includes('Sitemap: https://keova.fr/sitemap.xml'))
})

// --- white-label ---

test('robots.txt white-label: disallows auth paths', () => {
  const output = buildRobotsTxt('sophie-jouan.fr')
  assert.ok(output.includes('Disallow: /client/'))
  assert.ok(output.includes('Disallow: /admin/'))
})

test('robots.txt white-label: disallows /coaches', () => {
  const output = buildRobotsTxt('sophie-jouan.fr')
  assert.ok(output.includes('Disallow: /coaches'))
})

test('robots.txt white-label: sitemap points to white-label domain', () => {
  const output = buildRobotsTxt('sophie-jouan.fr')
  assert.ok(output.includes('Sitemap: https://sophie-jouan.fr/sitemap.xml'))
})

// --- localhost ---

test('robots.txt localhost: treated as platform, no /coaches disallowed', () => {
  const output = buildRobotsTxt('localhost:3000', 'http')
  assert.equal(output.includes('Disallow: /coaches'), false)
})

test('robots.txt localhost: sitemap points to localhost', () => {
  const output = buildRobotsTxt('localhost:3000', 'http')
  assert.ok(output.includes('Sitemap: http://localhost:3000/sitemap.xml'))
})
