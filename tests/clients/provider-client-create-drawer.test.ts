import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'app', relativePath), 'utf-8')
}

test('provider client drawer uses the provider timezone and configured discovery duration', () => {
  const source = readAppFile('components/organisms/ProviderClientCreateDrawer.vue')

  assert.match(source, /getMyProviderProfileIdentity/)
  assert.match(source, /timeZone: providerTimeZone\.value/)
  assert.match(source, /providerDiscoveryDuration/)
  assert.doesNotMatch(source, /Appel découverte \(15 min\)/)
})

test('provider client drawer disables duplicate submits and reuses its idempotency key', () => {
  const drawer = readAppFile('components/organisms/ProviderClientCreateDrawer.vue')
  const service = readAppFile('features/clients/services/provider-clients.service.ts')

  assert.match(drawer, /:disabled="hasErrors \|\| saving"/)
  assert.match(drawer, /discoveryIdempotencyKey\.value = globalThis\.crypto\.randomUUID\(\)/)
  assert.match(drawer, /createProviderDiscoveryClient\([\s\S]*discoveryIdempotencyKey\.value\)/)
  assert.match(service, /idempotencyKey: string/)
  assert.match(service, /'Idempotency-Key': key/)
  assert.doesNotMatch(service, /crypto\.randomUUID\(\)/)
})
