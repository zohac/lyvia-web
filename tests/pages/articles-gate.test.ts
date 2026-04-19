import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-22 — Gate B2C /articles.
 *
 * Les pages /articles et /articles/[slug] doivent renvoyer 404 sur tout
 * domaine autre que B2C (keova.app + white-label). Ce test vérifie que le
 * script setup de chacune des deux pages :
 *  1. appelle getDomainContext,
 *  2. throw createError({ statusCode: 404 }) quand !ctx.isB2C.
 *
 * C'est un test de structure qui garantit que la gate n'est pas retirée
 * accidentellement — les smokes curl en runtime (voir Validation de la
 * story) valident le comportement réel sur les 3 domaines.
 */

const appRoot = path.resolve(process.cwd(), 'app')

function readPage(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('articles gate B2C — /articles (page liste)', () => {
  const source = readPage('pages/articles/index.vue')

  test('imports getDomainContext from #shared/utils/domain-context', () => {
    assert.match(source, /import\s*\{[^}]*getDomainContext[^}]*\}\s*from\s*['"]#shared\/utils\/domain-context['"]/)
  })

  test('throws 404 createError when !ctx.isB2C', () => {
    assert.match(source, /if\s*\(\s*!\s*ctx\.isB2C\s*\)/)
    assert.match(source, /throw\s+createError\s*\(\s*\{\s*statusCode:\s*404/)
  })

  test('gate is placed BEFORE useAsyncData (don\'t fetch content on non-B2C)', () => {
    const gateIndex = source.indexOf('!ctx.isB2C')
    const fetchIndex = source.indexOf('useAsyncData(')
    assert.ok(gateIndex > -1, 'gate present')
    assert.ok(fetchIndex > -1, 'useAsyncData present')
    assert.ok(gateIndex < fetchIndex, 'gate runs before content fetch')
  })
})

describe('articles gate B2C — /articles/[...slug] (page détail)', () => {
  const source = readPage('pages/articles/[...slug].vue')

  test('imports getDomainContext from #shared/utils/domain-context', () => {
    assert.match(source, /import\s*\{[^}]*getDomainContext[^}]*\}\s*from\s*['"]#shared\/utils\/domain-context['"]/)
  })

  test('throws 404 createError when !ctx.isB2C', () => {
    assert.match(source, /if\s*\(\s*!\s*ctx\.isB2C\s*\)/)
    assert.match(source, /throw\s+createError\s*\(\s*\{\s*statusCode:\s*404/)
  })

  test('gate is placed BEFORE useAsyncData (don\'t fetch content on non-B2C)', () => {
    const gateIndex = source.indexOf('!ctx.isB2C')
    const fetchIndex = source.indexOf('useAsyncData(')
    assert.ok(gateIndex > -1, 'gate present')
    assert.ok(fetchIndex > -1, 'useAsyncData present')
    assert.ok(gateIndex < fetchIndex, 'gate runs before content fetch')
  })

  test('also throws 404 when slug param is empty (defense in depth)', () => {
    // Pattern attendu : const slug = ...; if (!slug) throw createError(...)
    assert.match(source, /if\s*\(\s*!\s*slug\s*\)\s*\{\s*throw\s+createError/)
  })
})
