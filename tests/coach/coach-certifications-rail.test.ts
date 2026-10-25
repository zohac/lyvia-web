import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * LAB.5 — rendu réel du regroupement diplômes / certifications.
 *
 * Avant ce fichier, aucun test n'exécutait `CoachCertificationsRail` : inverser
 * les deux filtres, échanger les deux titres ou retirer la garde « un seul
 * groupe → pas de titre » laissait la suite verte. Le composant enfant est
 * remplacé par un stub qui expose le groupe et l'ordre reçu, ce qui permet
 * d'asserter le regroupement, l'ordre, et la mise en avant sans navigateur.
 */

interface Credential {
  title: string
  kind?: 'diploma' | 'certification'
  featured?: boolean
}

const GroupStub = Vue.defineComponent({
  name: 'CoachCertificationsGroupStub',
  props: {
    credentials: { type: Array, required: true },
    credentialKind: { type: String, default: 'certification' }
  },
  setup: props => () => Vue.h('div', {
    'data-kind': props.credentialKind,
    'data-titles': (props.credentials as Credential[]).map(cred => cred.title).join('|')
  })
})

const mocks = {
  '~/components/molecules/CoachCertificationsGroup.vue': GroupStub
}

async function renderRail(credentials: Credential[]): Promise<string> {
  return renderSfc('app/components/molecules/CoachCertificationsRail.vue', {
    props: { credentials },
    mocks,
    globals: { ...Vue }
  })
}

function groups(html: string): Array<{ kind: string, titles: string[] }> {
  return [...html.matchAll(/data-kind="([^"]+)" data-titles="([^"]*)"/g)]
    .map(match => ({ kind: match[1]!, titles: match[2]!.split('|') }))
}

describe('LAB.5 — CoachCertificationsRail : regroupement public', () => {
  test('deux groupes non vides → deux titres, certifications d’abord sans mise en avant', async () => {
    const html = await renderRail([
      { title: 'Diplôme d’État', kind: 'diploma' },
      { title: 'Ménopulse', kind: 'certification' }
    ])

    assert.match(html, />\s*Certifications &amp; formations\s*</)
    assert.match(html, />\s*Diplômes &amp; autres formations\s*</)
    assert.ok(
      html.indexOf('Certifications &amp; formations') < html.indexOf('Diplômes &amp; autres formations'),
      'sans mise en avant, le groupe certifications reste en tête'
    )

    assert.deepEqual(groups(html), [
      { kind: 'certification', titles: ['Ménopulse'] },
      { kind: 'diploma', titles: ['Diplôme d’État'] }
    ])
  })

  test('une entrée sans `kind` est rendue dans le groupe diplômes, jamais dans certifications (AC3)', async () => {
    const html = await renderRail([
      { title: 'Entrée historique' },
      { title: 'Certification', kind: 'certification' }
    ])

    const rendered = groups(html)
    const diplomas = rendered.find(group => group.kind === 'diploma')
    const certifications = rendered.find(group => group.kind === 'certification')

    assert.deepEqual(diplomas?.titles, ['Entrée historique'])
    assert.deepEqual(certifications?.titles, ['Certification'])
  })

  test('un seul groupe → aucun titre de groupe (AC4)', async () => {
    const html = await renderRail([
      { title: 'Diplôme A', kind: 'diploma' },
      { title: 'Entrée non qualifiée' }
    ])

    assert.doesNotMatch(html, /<h3/)
    assert.deepEqual(groups(html), [
      { kind: 'diploma', titles: ['Diplôme A', 'Entrée non qualifiée'] }
    ])
  })

  test('un diplôme mis en avant remonte son groupe en premier (AC5, DESIGN.md:183)', async () => {
    const html = await renderRail([
      { title: 'Certification secondaire', kind: 'certification' },
      { title: 'Diplôme mis en avant', kind: 'diploma', featured: true },
      { title: 'Certification principale', kind: 'certification', featured: false }
    ])

    const rendered = groups(html)
    assert.equal(rendered[0]?.kind, 'diploma', 'le groupe de la mise en avant passe devant')
    assert.equal(rendered[0]?.titles[0], 'Diplôme mis en avant', 'la mise en avant est la première entrée')
    assert.deepEqual(rendered[1]?.titles, ['Certification secondaire', 'Certification principale'])
  })

  test('la mise en avant reste première dans son propre groupe', async () => {
    const html = await renderRail([
      { title: 'Certification A', kind: 'certification' },
      { title: 'Certification B', kind: 'certification', featured: true }
    ])

    assert.deepEqual(groups(html), [
      { kind: 'certification', titles: ['Certification B', 'Certification A'] }
    ])
  })
})
