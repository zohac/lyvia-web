/**
 * V2.2a — Wiring tests for the provider pages screen.
 *
 * The pure rules are covered by `provider-pages-domain.test.ts`. These tests
 * guard the UI wiring the I/O matrix depends on (gating, empty/error/limit
 * states, actions menu, support-mode access) using the repo's source-inspection
 * convention (`tests/design-system/ds4-modal-slideover-convention.test.ts`).
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test, { describe } from 'node:test'

const ROOT = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

describe('pages/view — /provider/pages wiring', () => {
  const page = read('app/pages/provider/pages/index.vue')
  const modal = read('app/components/organisms/ProviderPageCreateModal.vue')

  test('gates the whole screen behind the page_builder feature', () => {
    assert.ok(page.includes('FeatureGate'))
    assert.ok(page.includes('feature="page_builder"'))
    assert.ok(page.includes('FEATURE_PAGE_BUILDER'))
  })

  test('delegates the locked short-circuit to the pure helper', () => {
    assert.ok(page.includes('shouldLoadProviderPages'))
    assert.ok(page.includes('void load()'))
  })

  test('renders the zero-state wording and a CTA that opens the modal', () => {
    assert.ok(page.includes('AtomsDsEmptyState'))
    assert.ok(page.includes('pas encore créé de page personnalisée'))
    assert.ok(page.includes('Créer ma première page'))
    assert.ok(page.includes('@click="openCreateModal"'))
  })

  test('renders a retryable error state', () => {
    assert.ok(page.includes('AtomsDsErrorState'))
    assert.ok(page.includes('@retry="load()"'))
  })

  test('disables creation and shows the limit badge when 10 pages are reached', () => {
    assert.ok(page.includes(':disabled="isLimitReached"'))
    assert.ok(page.includes('PAGE_LIMIT_BADGE_LABEL'))
  })

  test('exposes Modifier and only a safe external link for published pages', () => {
    assert.ok(page.includes('/provider/pages/${page.id}'))
    assert.ok(page.includes('page.status === \'published\''))
    assert.ok(page.includes('target: \'_blank\''))
    assert.ok(page.includes('rel: \'noopener noreferrer\''))
  })

  test('derives the visible status through the shared status meta', () => {
    assert.ok(page.includes('resolvePageStatus'))
    assert.ok(page.includes('PAGE_STATUS_META'))
  })

  test('creates through the two-field UModal driven by the pure helper', () => {
    assert.ok(modal.includes('<UModal'))
    assert.ok(modal.includes('applyCreatePageTitleChange'))
    assert.ok(modal.includes('resolveCreatePageSubmit'))
    assert.ok(modal.includes('emit(\'submit\''))
    assert.ok(modal.includes('existingSlugs'))
  })
})

describe('pages/view — navigation & support mode', () => {
  test('provider navigation exposes /provider/pages', () => {
    const layout = read('app/layouts/provider-standard.vue')
    assert.ok(layout.includes('/provider/pages'))
  })

  test('support mode whitelists /provider/pages and its children', () => {
    const contract = read('app/features/support-session/api/support-session.contract.ts')
    assert.ok(contract.includes('to: \'/provider/pages\''))
  })
})
