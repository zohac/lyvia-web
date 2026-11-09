import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolveTenantTag, UNKNOWN_TENANT } from '../../app/features/observability/sentry-tenant-tag'

test('tenant tag: keova.fr stays keova.fr', () => {
  assert.equal(resolveTenantTag('keova.fr'), 'keova.fr')
})

test('tenant tag: sophiejouan.fr stays sophiejouan.fr', () => {
  assert.equal(resolveTenantTag('sophiejouan.fr'), 'sophiejouan.fr')
})

test('tenant tag: strips a port', () => {
  assert.equal(resolveTenantTag('sophiejouan.fr:3000'), 'sophiejouan.fr')
})

test('tenant tag: missing host → unknown', () => {
  assert.equal(resolveTenantTag(null), UNKNOWN_TENANT)
  assert.equal(resolveTenantTag(undefined), UNKNOWN_TENANT)
  assert.equal(resolveTenantTag(''), UNKNOWN_TENANT)
})

test('tenant tag: malformed host → unknown', () => {
  assert.equal(resolveTenantTag('not a host'), UNKNOWN_TENANT)
  assert.equal(resolveTenantTag('sophie-jouan'), UNKNOWN_TENANT)
  assert.equal(resolveTenantTag('javascript:alert(1)'), UNKNOWN_TENANT)
  assert.equal(resolveTenantTag('[::1]'), UNKNOWN_TENANT)
})

test('tenant tag: a syntactically valid host is carried (format validation only, per D3)', () => {
  assert.equal(resolveTenantTag('evil.example.com.attacker.test'), 'evil.example.com.attacker.test')
})

test('tenant tag: lowercases', () => {
  assert.equal(resolveTenantTag('SophieJouan.FR'), 'sophiejouan.fr')
})
