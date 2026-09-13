import * as assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = process.cwd()

// =============================================================================
// CSS Variables Audit: Verifying that all CSS vars used in new components exist in shared.css / main.css
// =============================================================================

test('CSS Variables Audit: all CSS variables referenced in components exist in stylesheets', () => {
  const sharedCss = readFileSync(join(REPO_ROOT, 'app', 'assets', 'css', 'shared.css'), 'utf8')

  const componentPaths = [
    join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockText.vue'),
    join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockImage.vue'),
    join(REPO_ROOT, 'app', 'components', 'molecules', 'PageBlockRenderer.vue'),
    join(REPO_ROOT, 'app', 'pages', '[...slug].vue'),
    join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', '[pageSlug].vue')
  ]

  const varRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g

  for (const filePath of componentPaths) {
    const content = readFileSync(filePath, 'utf8')
    let match
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1]
      // Check if variable is defined in shared.css or is one of the dynamic brand variables
      const isDefined = sharedCss.includes(varName) || varName.startsWith('--color-brand-') || varName.startsWith('--font-') || varName.startsWith('--color-surface-') || varName.startsWith('--color-text-')
      assert.ok(isDefined, `Ghost CSS variable detected: ${varName} in ${filePath}`)
    }
  }
})

// =============================================================================
// BlockText Security: rel="noopener noreferrer" on target="_blank"
// =============================================================================

test('BlockText: secures target="_blank" links with rel="noopener noreferrer"', () => {
  const blockTextSource = readFileSync(join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockText.vue'), 'utf8')
  assert.ok(blockTextSource.includes('noopener noreferrer'), 'BlockText must enforce rel="noopener noreferrer" on target="_blank"')
})

// =============================================================================
// BlockImage: loading="lazy", decoding="async", aspect ratio & layout shift prevention
// =============================================================================

test('BlockImage: contains lazy loading, async decoding and responsive image layout', () => {
  const blockImageSource = readFileSync(join(REPO_ROOT, 'app', 'components', 'atoms', 'BlockImage.vue'), 'utf8')
  assert.ok(blockImageSource.includes('loading="lazy"'), 'BlockImage must have loading="lazy"')
  assert.ok(blockImageSource.includes('decoding="async"'), 'BlockImage must have decoding="async"')
  assert.ok(blockImageSource.includes(':width="data.width || undefined"'), 'BlockImage should set width when available')
  assert.ok(blockImageSource.includes(':height="data.height || undefined"'), 'BlockImage should set height when available')
  assert.ok(blockImageSource.includes('figcaption'), 'BlockImage should support caption')
  assert.ok(blockImageSource.includes('aspect-video') || blockImageSource.includes('fallback') || blockImageSource.includes('v-else'), 'BlockImage must have a graceful placeholder')
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

test('[...slug].vue: requires single segment on white-label domain and rejects multi-segments', () => {
  const catchAllSource = readFileSync(join(REPO_ROOT, 'app', 'pages', '[...slug].vue'), 'utf8')
  assert.ok(catchAllSource.includes('slugArray.length !== 1'), 'Must reject multi-segment paths in V1')
  assert.ok(catchAllSource.includes('!ctx.isWhiteLabel'), 'Must reject platform domain in root catch-all')
  assert.ok(catchAllSource.includes('usePublicTenantHome()'), 'Must load tenant branding context')
})

test('coach/[slug]/[pageSlug].vue: handles platform provider page consultation', () => {
  const coachPageSource = readFileSync(join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', '[pageSlug].vue'), 'utf8')
  assert.ok(coachPageSource.includes('providerSlug'), 'Must extract providerSlug')
  assert.ok(coachPageSource.includes('pageSlug'), 'Must extract pageSlug')
})
