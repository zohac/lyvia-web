/**
 * Preuve de la story 0-42 : le harnais SFC rend un composant enfant `.vue`
 * importé par le composant testé, sans mock manuel.
 *
 * Non-vacuité, rejouée le 2026-10-29 :
 * - retirer la branche `.vue` de `createScope` fait tomber le premier test ;
 * - retirer les candidats de `resolveWithExtension` fait tomber les imports
 *   sans extension et de répertoire ;
 * - déplacer la branche `.vue` au-dessus de `hasKey(mocks, resolved)` fait
 *   tomber le test du mock clé par chemin absolu.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, test } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from './render-sfc'

function fixture(name: string): string {
  return path.join('tests', 'helpers', 'fixtures', name)
}

const stubChild = {
  name: 'ChildComponent',
  setup: () => () => Vue.h('span', 'from-stub')
}

describe('render-sfc — enfant .vue rendu sans mock manuel (story 0-42)', () => {
  test('un parent importe un enfant .vue qui apparait dans le HTML', async () => {
    const html = await renderSfc(fixture('ParentWithChild.vue'))

    assert.match(html, /data-testid="parent"/)
    assert.match(html, /data-testid="child-rendered"/)
    assert.match(html, /child-content/)
  })

  test('un import sans extension résout le composant enfant .vue', async () => {
    const html = await renderSfc(fixture('ParentImportsWithoutExtension.vue'))

    assert.match(html, /child-content/)
  })

  test('un import de répertoire résout index.vue', async () => {
    const html = await renderSfc(fixture('ParentImportsDirectory.vue'))

    assert.match(html, /nested-index-content/)
  })

  test('un enfant qui importe un module .ts et lit une globale est rendu', async () => {
    const html = await renderSfc(fixture('ParentWithImportedChild.vue'), {
      globals: { useHarnessGlobal: () => 'globale-ok' }
    })

    assert.match(html, /child-module:globale-ok/)
  })

  test('un specifier ambigu résout le .ts avant le .vue, comme Vite', async () => {
    const html = await renderSfc(fixture('ParentWithAmbiguousImport.vue'))

    assert.match(html, /from-ts-module/)
  })

  test('un enfant .vue stubbé via mocks est utilisé à la place du réel', async () => {
    const html = await renderSfc(fixture('ParentWithChild.vue'), {
      mocks: { './ChildComponent.vue': stubChild }
    })

    // Le stub prend la place : le contenu réel de l'enfant disparaît,
    // le marqueur du stub apparaît.
    assert.doesNotMatch(html, /child-content/)
    assert.match(html, /from-stub/)
  })

  test('un mock clé par chemin absolu reste prioritaire sur la compilation', async () => {
    const html = await renderSfc(fixture('ParentWithChild.vue'), {
      mocks: { [path.resolve(fixture('ChildComponent.vue'))]: stubChild }
    })

    assert.doesNotMatch(html, /child-content/)
    assert.match(html, /from-stub/)
  })

  test('une erreur dans un enfant est propagée, pas avalée', async () => {
    await assert.rejects(
      () => renderSfc(fixture('ParentWithBrokenChild.vue')),
      /SFC parse failed|template compile failed/
    )
  })

  test('un import non exécutable échoue bruyamment au lieu de rendre vide', async () => {
    await assert.rejects(
      () => renderSfc(fixture('JsonImportChild.vue')),
      /Cannot find module/
    )
  })
})
