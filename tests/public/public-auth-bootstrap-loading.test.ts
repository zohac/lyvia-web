import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()
const appRoot = path.resolve(repoRoot, 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

test('public auth bootstrap stays lazy and no longer uses a global client plugin', () => {
  const source = readAppFile('components/templates/CoachPublicPageTemplate.vue')
  const globalPluginPath = path.join(appRoot, 'plugins/auth-bootstrap.client.ts')

  assert.ok(source.includes("import { useAuthState } from '~/features/auth/state/auth.state'"))
  assert.ok(source.includes("await import('~/composables/useAuth')"))
  assert.equal(fs.existsSync(globalPluginPath), false)
})
