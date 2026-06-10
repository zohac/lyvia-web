/**
 * Regression guard for hotfix-17.
 *
 * Nuxt renders `app/error.vue` standalone — it bypasses `<NuxtLayout>`, so none
 * of the layouts (which each `import '~/assets/css/main.css'`) are mounted. If
 * the error page does not import `main.css` itself, every 404/500 renders as
 * raw, unstyled HTML (Times headings, native buttons, no card).
 *
 * This test fails if error.vue ever loses the global stylesheet import.
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const REPO_ROOT = process.cwd()
const MAIN_CSS_IMPORT = /import\s+['"]~\/assets\/css\/main\.css['"]/

test('error.vue imports main.css so error pages are styled without a layout (hotfix-17)', () => {
  const source = readFileSync(join(REPO_ROOT, 'app', 'error.vue'), 'utf8')

  assert.match(
    source,
    MAIN_CSS_IMPORT,
    'error.vue must import ~/assets/css/main.css — it renders without a layout, so it is the only place that loads the global stylesheet on error pages'
  )
})

// Sanity: the layouts that DO mount the stylesheet keep importing it, so the
// "error.vue is the exception" assumption stays true.
for (const name of ['default', 'public', 'legal', 'focus']) {
  test(`layout ${name}.vue still imports main.css (root-cause invariant)`, () => {
    const source = readFileSync(join(REPO_ROOT, 'app', 'layouts', `${name}.vue`), 'utf8')

    assert.match(
      source,
      MAIN_CSS_IMPORT,
      `${name}.vue must import ~/assets/css/main.css (layouts are the normal CSS entry point)`
    )
  })
}
