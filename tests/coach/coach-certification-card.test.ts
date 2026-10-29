import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * LAB.5 (révision PO du 2026-10-29) — la nature se lit dans l'icône.
 *
 * `award` pour une certification / formation, `graduation-cap` pour un diplôme
 * ou une entrée non qualifiée. Le logo officiel, quand il existe, remplace
 * l'icône — c'est le seul cas où la distinction n'est plus visible.
 */

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: props => () => Vue.h('span', { 'data-icon': props.name })
})

interface Credential {
  title: string
  kind?: 'diploma' | 'certification'
  logoUrl?: string | null
  institution?: string
}

async function renderCard(credential: Credential): Promise<string> {
  return renderSfc('app/components/molecules/CoachCertificationCard.vue', {
    props: { credential },
    globals: { ...Vue },
    stubs: { UIcon }
  })
}

function icon(html: string): string | null {
  return html.match(/data-icon="([^"]*)"/)?.[1] ?? null
}

describe('LAB.5 — CoachCertificationCard : icône de nature', () => {
  test('certification / formation → icône award', async () => {
    assert.equal(icon(await renderCard({ title: 'Ménopulse', kind: 'certification' })), 'i-lucide-award')
  })

  test('diplôme → icône graduation-cap', async () => {
    assert.equal(icon(await renderCard({ title: 'Infirmière', kind: 'diploma' })), 'i-lucide-graduation-cap')
  })

  test('entrée non qualifiée → graduation-cap (groupe neutre historique)', async () => {
    assert.equal(icon(await renderCard({ title: 'Entrée historique' })), 'i-lucide-graduation-cap')
  })

  test('un logo renseigné remplace l\'icône', async () => {
    const html = await renderCard({
      title: 'Ménopulse',
      kind: 'certification',
      logoUrl: 'https://cdn.test/logo.png'
    })
    assert.match(html, /<img[^>]+src="https:\/\/cdn\.test\/logo\.png"/)
    assert.equal(icon(html), null)
  })
})
