import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, test } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from './render-sfc'

function fixture(name: string): string {
  return path.join('tests', 'helpers', 'fixtures', name)
}

describe('render-sfc — enfant .vue rendu sans mock manuel (story 0-42)', () => {
  test('un parent qui importe un enfant .vue rend le rendu de l\'enfant', async () => {
    const html = await renderSfc(fixture('ParentWithChild.vue'))

    assert.match(html, /child-content/)
    assert.match(html, /data-testid="parent"/)
  })

  test('un enfant .vue stubbé via mocks est utilisé à la place du réel', async () => {
    const html = await renderSfc(fixture('ParentWithChild.vue'), {
      mocks: {
        './ChildComponent.vue': {
          name: 'ChildComponent',
          setup: () => () => Vue.h('span', 'from-stub')
        }
      }
    })

    // Le stub prend la place : le contenu réel de l'enfant disparaît,
    // le marqueur du stub apparaît.
    assert.doesNotMatch(html, /child-content/)
    assert.match(html, /from-stub/)
  })
})
