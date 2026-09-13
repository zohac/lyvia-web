import * as assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secureBlankLinks } from '../../shared/utils/link-security'
import { BRAND_CSS_VARS } from '../../shared/utils/brand-color-helpers'

const REPO_ROOT = process.cwd()

// =============================================================================
// CSS Variables Audit: Strict token verification against shared.css and BRAND_CSS_VARS
// =============================================================================

test('CSS Variables Audit: all CSS variables referenced in components exist in stylesheets', () => {
  const sharedCss = readFileSync(join(REPO_ROOT, 'app', 'assets', 'css', 'shared.css'), 'utf8')

  // Extract all declared CSS variables in shared.css (e.g. "--color-text-primary:")
  const declaredVars = new Set<string>()
  const declarationRegex = /(--[a-zA-Z0-9_-]+)\s*:/g
  let declMatch
  while ((declMatch = declarationRegex.exec(sharedCss)) !== null) {
    declaredVars.add(declMatch[1]!)
  }

  // Add all dynamic brand CSS variables
  for (const varName of Object.values(BRAND_CSS_VARS)) {
    declaredVars.add(varName)
  }

  const componentPaths = [
    join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockText.vue'),
    join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockImage.vue'),
    join(REPO_ROOT, 'app', 'components', 'molecules', 'PageBlockRenderer.vue'),
    join(REPO_ROOT, 'app', 'pages', '[...slug].vue'),
    join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', '[pageSlug].vue')
  ]

  const varUsageRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g

  for (const filePath of componentPaths) {
    const content = readFileSync(filePath, 'utf8')
    let match
    while ((match = varUsageRegex.exec(content)) !== null) {
      const varName = match[1]!
      assert.ok(
        declaredVars.has(varName),
        `Ghost CSS variable detected: "${varName}" in ${filePath}`
      )
    }
  }
})

// =============================================================================
// BlockText Security: Behavioral tests for secureBlankLinks
// =============================================================================

test('secureBlankLinks: adds rel="noopener noreferrer" to links with target="_blank"', () => {
  const input = '<p>Visitez <a href="https://example.com" target="_blank">notre partenaire</a> pour en savoir plus.</p>'
  const output = secureBlankLinks(input)
  assert.ok(output.includes('rel="noopener noreferrer"'), 'Must add rel="noopener noreferrer"')
  assert.ok(output.includes('href="https://example.com"'), 'Must preserve href')
})

test('secureBlankLinks: handles single quotes, unquoted target, and whitespace around equals', () => {
  const singleQuoted = '<a href="https://example.com" target=\'_blank\'>Lien 1</a>'
  assert.ok(secureBlankLinks(singleQuoted).includes('rel="noopener noreferrer"'))

  const unquoted = '<a href="https://example.com" target=_blank>Lien 2</a>'
  assert.ok(secureBlankLinks(unquoted).includes('rel="noopener noreferrer"'))

  const spaced = '<a href="https://example.com" target = "_blank">Lien 3</a>'
  assert.ok(secureBlankLinks(spaced).includes('rel="noopener noreferrer"'))
})

test('secureBlankLinks: preserves existing rel tokens and appends missing ones', () => {
  const input = '<a href="https://example.com" target="_blank" rel="nofollow">Lien</a>'
  const output = secureBlankLinks(input)
  assert.ok(output.includes('nofollow'), 'Must preserve nofollow')
  assert.ok(output.includes('noopener'), 'Must include noopener')
  assert.ok(output.includes('noreferrer'), 'Must include noreferrer')
})

test('secureBlankLinks: does not modify links without target="_blank"', () => {
  const internal = '<p>Consultez notre <a href="/mes-services">page services</a>.</p>'
  assert.equal(secureBlankLinks(internal), internal)
})

test('secureBlankLinks: safely handles falsy or non-string inputs', () => {
  assert.equal(secureBlankLinks(''), '')
  assert.equal(secureBlankLinks(null as unknown as string), '')
  assert.equal(secureBlankLinks(undefined as unknown as string), '')
})

// =============================================================================
// BlockImage: loading="lazy", decoding="async", aspect ratio & layout shift prevention
// =============================================================================

test('BlockImage: contains lazy loading, async decoding, responsive image layout and @error fallback', () => {
  const blockImageSource = readFileSync(join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockImage.vue'), 'utf8')
  assert.ok(blockImageSource.includes('loading="lazy"'), 'BlockImage must have loading="lazy"')
  assert.ok(blockImageSource.includes('decoding="async"'), 'BlockImage must have decoding="async"')
  assert.ok(blockImageSource.includes(':width="data.width || undefined"'), 'BlockImage should set width when available')
  assert.ok(blockImageSource.includes(':height="data.height || undefined"'), 'BlockImage should set height when available')
  assert.ok(blockImageSource.includes('figcaption'), 'BlockImage should support caption')
  assert.ok(blockImageSource.includes('@error="hasLoadError = true"'), 'BlockImage must listen to @error for load failures')
  assert.ok(blockImageSource.includes('hasLoadError'), 'BlockImage must track image load errors reactively')
  assert.ok(blockImageSource.includes('v-else'), 'BlockImage must render placeholder fallback')
})

// =============================================================================
// PageBlockRenderer: strict static dispatch on block.type
// =============================================================================

test('PageBlockRenderer: dispatches strictly to BlockText and BlockImage', () => {
  const rendererSource = readFileSync(join(REPO_ROOT, 'app', 'components', 'molecules', 'PageBlockRenderer.vue'), 'utf8')
  assert.ok(rendererSource.includes('block.type === \'text\''), 'Must handle text block')
  assert.ok(rendererSource.includes('block.type === \'image\''), 'Must handle image block')
  assert.ok(!rendererSource.includes('<component :is='), 'No dynamic arbitrary component instantiation allowed')
})

// =============================================================================
// Routing & Multi-Domain Invariants
// =============================================================================

test('[...slug].vue: requires single segment on white-label domain, rejects multi-segments, injects branding', () => {
  const catchAllSource = readFileSync(join(REPO_ROOT, 'app', 'pages', '[...slug].vue'), 'utf8')
  assert.ok(catchAllSource.includes('slugArray.length !== 1'), 'Must reject multi-segment paths in V1')
  assert.ok(catchAllSource.includes('!ctx.isWhiteLabel'), 'Must reject platform domain in root catch-all')
  assert.ok(catchAllSource.includes('usePublicTenantHome()'), 'Must load tenant branding context')
  assert.ok(catchAllSource.includes('useBrandColorInjection()'), 'Must trigger brand color injection')
  assert.ok(catchAllSource.includes('isNotFoundError'), 'Must preserve non-404 server errors')
})

test('coach/[slug]/[pageSlug].vue: enforces domain isolation, extracts slugs and preserves server errors', () => {
  const coachPageSource = readFileSync(join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', '[pageSlug].vue'), 'utf8')
  assert.ok(coachPageSource.includes('providerSlug'), 'Must extract providerSlug')
  assert.ok(coachPageSource.includes('pageSlug'), 'Must extract pageSlug')
  assert.ok(coachPageSource.includes('ctx.isWhiteLabel'), 'Must enforce domain isolation on white-label host')
  assert.ok(coachPageSource.includes('useBrandColorInjection()'), 'Must trigger brand color injection on platform')
  assert.ok(coachPageSource.includes('isNotFoundError'), 'Must preserve non-404 server errors')
})
