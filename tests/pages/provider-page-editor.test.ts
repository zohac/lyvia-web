/**
 * V2.2b — Wiring guards for the page editor surfaces.
 *
 * Pure rules live in `content-blocks.test.ts`, `paste-sanitizer.test.ts`,
 * `guided-links.test.ts` and `page-editor.test.ts`. These source-inspection
 * tests protect the behaviours the I/O matrix depends on (toolbar a11y, paste
 * interception, guided link modal, protected removal, PUT wiring).
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test, { describe } from 'node:test'

import { ALLOWED_TAGS } from '../../app/features/pages/domain/paste-sanitizer'

const ROOT = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

describe('pages/editor — PageEditorTextBlock', () => {
  const block = read('app/components/organisms/PageEditorTextBlock.vue')

  test('exposes an accessible toolbar and a native editable zone', () => {
    assert.ok(block.includes('role="toolbar"'))
    assert.ok(block.includes('aria-label="Mise en forme du texte"'))
    assert.ok(block.includes('contenteditable="true"'))
    assert.ok(block.includes('role="textbox"'))
  })

  test('intercepts paste and normalizes through the shared sanitizer', () => {
    assert.match(block, /@paste="onPaste"/)
    assert.match(block, /onPaste[\s\S]*?event\.preventDefault\(\)/)
    assert.match(block, /onPaste[\s\S]*?resolvePasteSource\(/)
    assert.ok(!block.includes('textToHtml'), 'the component must delegate text fallback to resolvePasteSource')
  })

  test('toolbar commands are reachable from a plain click (assistive tech activation)', () => {
    assert.match(block, /@click="runCommand\(command\)"/)
    assert.match(block, /@click="openLinkModal"/)
    assert.match(block, /@mousedown\.prevent/)
  })

  test('every block-format command targets an allowlisted tag (I/O matrix: mise en forme)', () => {
    const formatValues = [...block.matchAll(/value: '<([a-z0-9]+)>'/g)].map(match => match[1]!)
    assert.ok(formatValues.length >= 4, 'expected paragraph/h2/h3/blockquote commands')
    for (const tag of formatValues) {
      assert.ok(ALLOWED_TAGS.includes(tag), `${tag} must be in the server allowlist`)
    }
    for (const command of ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList']) {
      assert.ok(block.includes(`command: '${command}'`), `${command} command must be exposed`)
    }
  })

  test('renders the same .page-block-text class as the public renderer', () => {
    assert.ok(block.includes('page-block-text'))
  })

  test('opens the guided link modal and inserts the resolved anchor', () => {
    assert.match(block, /<GuidedLinkModal/)
    assert.match(block, /@insert="onInsertLink"/)
    assert.ok(block.includes('payload.rel'))
    assert.ok(block.includes('payload.target'))
  })
})

describe('pages/editor — GuidedLinkModal', () => {
  const modal = read('app/components/organisms/GuidedLinkModal.vue')

  test('offers the two tabs required by the UX spec', () => {
    assert.ok(modal.includes('<UTabs'))
    assert.ok(modal.includes('Destinations du site'))
    assert.ok(modal.includes('Lien externe'))
  })

  test('resolves destinations from the catalogue instead of free text', () => {
    assert.ok(modal.includes('selectedDestination'))
    assert.ok(modal.includes('emit(\'insert\''))
  })

  test('validates external links and guarantees the new-tab rel', () => {
    assert.match(modal, /buildExternalInsert\(validation\)/)
    assert.ok(modal.includes('Ouvrir dans un nouvel onglet'))
  })
})

describe('pages/editor — ProviderPageEditor', () => {
  const editor = read('app/components/organisms/ProviderPageEditor.vue')

  test('persists through the extracted save factory', () => {
    assert.ok(editor.includes('usePageEditor'))
    assert.ok(editor.includes('onSave'))
  })

  test('protects the last block and confirms removal', () => {
    assert.ok(editor.includes('ConfirmActionModal'))
    assert.ok(editor.includes('canRemove'))
    assert.ok(editor.includes(':disabled="!canRemove"'))
  })

  test('offers the empty-state add action and the save button', () => {
    assert.ok(editor.includes('Ajouter un paragraphe'))
    assert.ok(editor.includes('Enregistrer'))
    assert.ok(editor.includes('AtomsDsEmptyState'))
  })

  test('passes the guided destinations down to every text block', () => {
    assert.match(editor, /<PageEditorTextBlock[\s\S]*?:destinations="destinations"/)
  })

  test('renders the conflict reload affordance for 409', () => {
    assert.ok(editor.includes('Recharger la dernière version'))
    assert.ok(editor.includes('reloadFromServer'))
  })
})

describe('pages/editor — /provider/pages/:id wiring', () => {
  const page = read('app/pages/provider/pages/[id].vue')

  test('mounts the editor instead of the placeholder', () => {
    assert.ok(page.includes('ProviderPageEditor'))
    assert.ok(!page.includes('L\'éditeur de contenu arrive bientôt'))
  })

  test('builds guided destinations from useCoachLink and published pages', () => {
    assert.match(page, /await loadDestinations\(\)/)
    assert.match(page, /:destinations="destinations"/)
    assert.match(page, /@reload="loadPage"/)
    assert.match(page, /pricingEnabled: account\.sectionsConfig\?\.pricing/)
    assert.ok(page.includes('buildGuidedDestinations'))
    assert.ok(page.includes('useCoachLink'))
    assert.ok(page.includes('selectGuidedPages'))
  })
})
