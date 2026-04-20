import * as assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const LAYOUT_FILES = ['default', 'public', 'focus', 'auth', 'legal']
const REPO_ROOT = process.cwd()

for (const name of LAYOUT_FILES) {
  test(`layout ${name}.vue references LazyOrganismsCookieConsentBanner (Nuxt pathPrefix)`, () => {
    const source = readFileSync(join(REPO_ROOT, 'app', 'layouts', `${name}.vue`), 'utf8')

    assert.match(
      source,
      /<LazyOrganismsCookieConsentBanner\s*\/?>/,
      `${name}.vue must render <LazyOrganismsCookieConsentBanner /> (Nuxt 4 pathPrefix convention)`
    )

    assert.doesNotMatch(
      source,
      /<LazyCookieConsentBanner\b|<CookieConsentBanner\b/,
      `${name}.vue must NOT reference non-prefixed CookieConsentBanner — silently fails at render (retro hotfix-13)`
    )
  })
}
