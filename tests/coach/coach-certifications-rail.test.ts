import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * LAB.5 (révision PO du 2026-10-29) — une seule ligne de qualifications.
 *
 * Diplômes et certifications cohabitent dans **une** liste, la mise en avant en
 * tête ; la nature se lit dans l'icône de la carte, pas dans un titre de groupe.
 * Ce fichier exécute le rail : remettre deux blocs, inverser l'ordre ou perdre
 * une carte ferait tomber les assertions.
 */

interface Credential {
  title: string
  kind?: 'diploma' | 'certification'
  featured?: boolean
}

const CardStub = Vue.defineComponent({
  name: 'CoachCertificationCardStub',
  props: {
    credential: { type: Object, required: true },
    decorative: { type: Boolean, default: false }
  },
  setup: props => () => Vue.h('span', {
    'data-title': (props.credential as Credential).title,
    'data-kind': (props.credential as Credential).kind ?? 'unset',
    'data-decorative': props.decorative ? 'true' : 'false'
  })
})

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  setup: (_props, { attrs }) => () => Vue.h('button', attrs)
})

const mocks = {
  '~/components/molecules/CoachCertificationCard.vue': CardStub
}

async function renderRail(credentials: Credential[]): Promise<string> {
  return renderSfc('app/components/molecules/CoachCertificationsRail.vue', {
    props: { credentials },
    mocks,
    globals: { ...Vue },
    stubs: { UButton }
  })
}

function cards(html: string): Array<{ title: string, kind: string, decorative: string }> {
  return [...html.matchAll(/data-title="([^"]*)" data-kind="([^"]*)" data-decorative="([^"]*)"/g)]
    .map(match => ({ title: match[1]!, kind: match[2]!, decorative: match[3]! }))
}

describe('LAB.5 — CoachCertificationsRail : une seule ligne', () => {
  test('≤ 3 entrées : une seule liste, aucun titre de groupe, mise en avant en tête', async () => {
    const html = await renderRail([
      { title: 'Certification secondaire', kind: 'certification' },
      { title: 'Diplôme mis en avant', kind: 'diploma', featured: true },
      { title: 'Entrée non qualifiée' }
    ])

    assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), /<h3/)
    assert.deepEqual(cards(html), [
      { title: 'Diplôme mis en avant', kind: 'diploma', decorative: 'false' },
      { title: 'Certification secondaire', kind: 'certification', decorative: 'false' },
      { title: 'Entrée non qualifiée', kind: 'unset', decorative: 'false' }
    ])
    assert.match(html, /3 qualifications/)
    // Grille statique : aucune commande de rail.
    assert.doesNotMatch(html, /Qualifications précédentes/)
    assert.doesNotMatch(html, /Qualifications suivantes/)
  })

  test('> 3 entrées : rail, toutes les cartes dans le DOM + copie de bouclage masquée', async () => {
    const html = await renderRail([
      { title: 'A', kind: 'certification' },
      { title: 'B', kind: 'diploma' },
      { title: 'C' },
      { title: 'D', kind: 'certification' }
    ])

    assert.match(html, /4 qualifications/)
    assert.match(html, /aria-label="Qualifications : 4"/)
    assert.match(html, /aria-label="Qualifications précédentes"/)
    assert.match(html, /aria-label="Qualifications suivantes"/)

    const rendered = cards(html)
    const visible = rendered.filter(card => card.decorative === 'false')
    const loop = rendered.filter(card => card.decorative === 'true')
    assert.deepEqual(visible.map(card => card.title), ['A', 'B', 'C', 'D'])
    assert.deepEqual(loop.map(card => card.title), ['A', 'B', 'C', 'D'])
  })

  test('la nature reste portée par la carte (pas de regroupement)', async () => {
    const html = await renderRail([
      { title: 'Diplôme', kind: 'diploma' },
      { title: 'Certification', kind: 'certification' },
      { title: 'Sans nature' }
    ])

    assert.deepEqual(cards(html).map(card => card.kind), ['diploma', 'certification', 'unset'])
    assert.doesNotMatch(html, /Diplômes &amp; autres formations/)
    assert.doesNotMatch(html, /Certifications &amp; formations/)
  })
})
