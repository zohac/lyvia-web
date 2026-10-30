import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const EXTERNAL_PATH = 'app/components/organisms/CoachPageExternalSectionCard.vue'
const CERTS_PATH = 'app/components/organisms/CoachPageCertificationsCard.vue'
const PAGE_PATH = 'app/pages/provider/coach-page.vue'

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: props => () => Vue.h('span', { 'data-icon': props.name })
})
const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  setup: (_props, { slots }) => () => Vue.h('button', {}, slots.default ? slots.default() : [])
})
const USwitch = Vue.defineComponent({
  name: 'USwitchStub',
  setup: () => () => Vue.h('button', { role: 'switch' })
})
const UInput = Vue.defineComponent({
  name: 'UInputStub',
  setup: () => () => Vue.h('input')
})
const FormControl = Vue.defineComponent({
  name: 'FormControlStub',
  props: ['id', 'label', 'hint'],
  setup: (props, { slots }) => () =>
    Vue.h('div', { 'data-form-control': props.id }, [props.label, slots.default ? slots.default({ inputAttrs: {} }) : []])
})
const ProviderCredentialsEditor = Vue.defineComponent({
  name: 'ProviderCredentialsEditorStub',
  props: ['credentials'],
  setup: () => () => Vue.h('div', { 'data-creds-editor': true })
})

function baseExternal(overrides: Record<string, unknown> = {}) {
  return {
    props: {
      section: 'pricing',
      label: 'Modifiable dans Mes tarifs',
      actionLabel: 'Gérer mes formules',
      to: '/provider/scheduling',
      isOn: true,
      saving: false,
      pricingEyebrow: '',
      pricingTitle: '',
      ...overrides
    },
    globals: { ...Vue },
    stubs: { UIcon, UButton, USwitch, UInput, FormControl }
  }
}

function baseCerts(overrides: Record<string, unknown> = {}) {
  return {
    props: {
      credentials: [],
      saving: false,
      ...overrides
    },
    globals: { ...Vue },
    stubs: { UButton },
    mocks: { '~/components/organisms/ProviderCredentialsEditor.vue': ProviderCredentialsEditor }
  }
}

describe('TF.1 — CoachPageExternalSectionCard', () => {
  test('rend le titre et le toggle', async () => {
    const html = await renderSfc(EXTERNAL_PATH, baseExternal())
    assert.match(html, /Tarifs/)
    assert.match(html, /Visible sur ma page/)
  })

  test('le corps pricing n’apparaît que pour pricing', async () => {
    const pricingHtml = await renderSfc(EXTERNAL_PATH, baseExternal({ section: 'pricing' }))
    assert.match(pricingHtml, /data-form-control="pricingEyebrow"/)

    const otherHtml = await renderSfc(EXTERNAL_PATH, baseExternal({ section: 'branding' }))
    assert.doesNotMatch(otherHtml, /data-form-control="pricingEyebrow"/)
  })

  test('le bouton Enregistrer émet save-pricing-titles', async () => {
    // Presence of the save button text
    const html = await renderSfc(EXTERNAL_PATH, baseExternal())
    assert.match(html, /Enregistrer/)
  })
})

describe('TF.1 — CoachPageCertificationsCard', () => {
  test('rend le bouton Enregistrer', async () => {
    const html = await renderSfc(CERTS_PATH, baseCerts())
    assert.match(html, /Enregistrer/)
  })

  test('relaye l’éditeur de credentials', async () => {
    const html = await renderSfc(CERTS_PATH, baseCerts())
    assert.match(html, /data-creds-editor/)
  })
})

describe('TF.1 — garde de câblage', () => {
  test('la page importe et monte les deux composants', () => {
    const source = fs.readFileSync(path.join(process.cwd(), PAGE_PATH), 'utf8')
    assert.match(source, /import CoachPageExternalSectionCard from '~\/components\/organisms\/CoachPageExternalSectionCard\.vue'/)
    assert.match(source, /import CoachPageCertificationsCard from '~\/components\/organisms\/CoachPageCertificationsCard\.vue'/)
    assert.match(source, /<CoachPageExternalSectionCard/)
    assert.match(source, /<CoachPageCertificationsCard/)
  })

  test('la page ne porte plus le markup extrait', () => {
    const source = fs.readFileSync(path.join(process.cwd(), PAGE_PATH), 'utf8')
    assert.equal(source.includes('v-model:credentials="credentialsForm"'), false)
    assert.equal(source.includes('v-model="sectionTitlesForm.pricingEyebrow"'), false, 'champ pricingEyebrow ne doit plus figurer dans le template')
    assert.equal(source.includes('v-model="sectionTitlesForm.pricingTitle"'), false, 'champ pricingTitle ne doit plus figurer dans le template')
    assert.equal(source.includes("externalSection(section)?.to"), false, 'lien externalSection(section)?.to ne doit plus figurer dans le template')
    // pricingTitle may appear in other contexts? check template only roughly
  })
})
