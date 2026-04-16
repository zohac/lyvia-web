import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()
const appRoot = path.resolve(repoRoot, 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

test('provider coach page uses AtomsDsPageHeader to match Nuxt auto-import naming', () => {
  const source = readAppFile('pages/provider/coach-page.vue')

  assert.ok(source.includes('<AtomsDsPageHeader'))
  assert.equal(source.includes('<DsPageHeader>'), false)
})
