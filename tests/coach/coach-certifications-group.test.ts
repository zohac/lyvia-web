import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * LAB.5 — le groupe diplômes ne doit jamais s'annoncer « certifications ».
 *
 * Compteur, `aria-label` et commandes sont dérivés du groupe reçu. Sans ce
 * test, une liste de diplômes affichait « 2 certifications » et un lecteur
 * d'écran annonçait « Certifications : 2 » au-dessus de diplômes — exactement
 * l'affirmation que la story interdit.
 */

interface Credential {
  title: string
  institution?: string
  year?: number
}

const CardStub = Vue.defineComponent({
  name: 'CoachCertificationCardStub',
  props: { credential: { type: Object, required: true } },
  setup: props => () => Vue.h('span', (props.credential as Credential).title)
})

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  setup: (_props, { attrs }) => () => Vue.h('button', attrs)
})

const mocks = {
  '~/components/molecules/CoachCertificationCard.vue': CardStub
}

function credentials(count: number): Credential[] {
  return Array.from({ length: count }, (_, index) => ({ title: `Entrée ${index + 1}` }))
}

async function renderGroup(count: number, credentialKind: 'certification' | 'diploma'): Promise<string> {
  return renderSfc('app/components/molecules/CoachCertificationsGroup.vue', {
    props: { credentials: credentials(count), credentialKind },
    mocks,
    globals: { ...Vue },
    stubs: { UButton }
  })
}

describe('LAB.5 — CoachCertificationsGroup : libellés du groupe', () => {
  test('le groupe diplômes dit « diplômes » partout, jamais « certifications »', async () => {
    const html = await renderGroup(4, 'diploma')

    assert.match(html, /4 diplômes/)
    assert.match(html, /aria-label="Diplômes : 4"/)
    assert.match(html, /aria-label="Diplômes précédents"/)
    assert.match(html, /aria-label="Diplômes suivants"/)
    // Les commentaires de template mentionnent « certifications » : on ne
    // juge que le HTML rendu, pas les commentaires.
    assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), /certification/i)
  })

  test('le groupe certifications conserve ses libellés', async () => {
    const html = await renderGroup(4, 'certification')

    assert.match(html, /4 certifications/)
    assert.match(html, /aria-label="Certifications : 4"/)
    assert.match(html, /aria-label="Certifications précédentes"/)
    assert.match(html, /aria-label="Certifications suivantes"/)
  })

  test('le singulier est correct', async () => {
    const html = await renderGroup(1, 'diploma')
    assert.match(html, /1 diplôme(?!s)/)
  })
})
