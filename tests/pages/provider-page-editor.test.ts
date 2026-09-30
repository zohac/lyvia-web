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

describe('pages/editor — image block wiring (V2.2c)', () => {
  const editor = read('app/components/organisms/ProviderPageEditor.vue')

  test('offers the image add action in the empty state and the add bar', () => {
    assert.match(editor, /addImage/)
    assert.ok(editor.includes('Ajouter une image'))
  })

  test('mounts the image block editor and routes removal through confirmation', () => {
    assert.ok(editor.includes('BlockImageEditor'))
    assert.match(editor, /@update:model-value="updateImageBlockData\(index, \$event\)"/)
    assert.match(editor, /@remove="requestRemoveBlock\(index\)"/)
    assert.match(editor, /function requestRemoveBlock\(index: number\)/)
    assert.ok(editor.includes('setImageBlockData'))
  })

  test('does not render the placeholder image copy anymore', () => {
    assert.ok(!editor.includes('Ce bloc image sera modifiable dans une prochaine version.'))
  })
})

describe('pages/editor — accessible reordering wiring (V2.2d)', () => {
  const editor = read('app/components/organisms/ProviderPageEditor.vue')
  const controls = read('app/components/molecules/PageBlockReorderControls.vue')

  test('renders a reorder bar per block and exposes stable render keys', () => {
    assert.ok(editor.includes('PageBlockReorderControls'))
    assert.ok(editor.includes(':key="blockKey(index)"'))
    assert.ok(!editor.includes(':key="index"'), 'blocks must not be keyed by index')
  })

  test('wires the Monter/Descendre buttons to the editor move path', () => {
    assert.match(editor, /:can-move-up="canMoveUp\(index\)"/)
    assert.match(editor, /:can-move-down="canMoveDown\(index\)"/)
    assert.match(editor, /@move-up="moveByButton\(index, 'up'\)"/)
    assert.match(editor, /@move-down="moveByButton\(index, 'down'\)"/)
    assert.match(editor, /moveEditorBlock/)
    assert.match(editor, /focusButton/)
    assert.match(editor, /await nextTick\(\)/)
  })

  test('adds native HTML5 mouse drag & drop (no library)', () => {
    assert.ok(editor.includes('draggable="true"'))
    assert.match(editor, /@dragstart="onDragStart\(index, \$event\)"/)
    assert.match(editor, /@dragover\.prevent/)
    assert.match(editor, /@drop\.prevent/)
    assert.match(editor, /@dragend="onDragEnd"/)
    assert.match(editor, /effectAllowed = 'move'/)
  })

  test('announces the new position through a polite live region', () => {
    assert.ok(editor.includes('role="status"'))
    assert.ok(editor.includes('aria-live="polite"'))
    assert.ok(editor.includes('aria-atomic="true"'))
    assert.ok(editor.includes('describeBlockMove'))
  })

  test('the reorder bar exposes accessible, ≥ 44px buttons and a decorative grip', () => {
    assert.ok(controls.includes('UButton'))
    assert.ok(controls.includes('i-lucide-grip-vertical'))
    assert.ok(controls.includes('aria-hidden'))
    assert.ok(controls.includes('Monter le bloc'))
    assert.ok(controls.includes('Descendre le bloc'))
    assert.match(controls, /:disabled="!canMoveUp"/)
    assert.match(controls, /:disabled="!canMoveDown"/)
    assert.ok(controls.includes('min-h-11'))
    assert.ok(controls.includes('min-w-11'))
    assert.ok(controls.includes('defineExpose({ focusButton })'))
  })

  test('uses only existing design tokens (no ghost var)', () => {
    const shared = read('app/assets/css/shared.css')
    for (const file of [editor, controls]) {
      const vars = [...file.matchAll(/var\((--[a-z0-9-]+)/g)].map(match => match[1]!)
      assert.ok(vars.length > 0)
      for (const name of new Set(vars)) {
        assert.ok(shared.includes(`${name}:`), `${name} must exist in shared.css`)
      }
    }
  })
})
