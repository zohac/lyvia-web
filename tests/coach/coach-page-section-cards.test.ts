import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * TF.1 — exécution réelle des deux cartes extraites de `coach-page.vue`.
 *
 * Convention A32/KISS (motif de `provider-credentials-editor.test.ts`) : les
 * handlers du VNode rendu sont INVOLUQUÉS, jamais lus en regex. Une assertion
 * qui ne fait que chercher le mot « Enregistrer » dans le HTML reste verte
 * quand le `@click` disparaît — la revue TF.1 l'a mesuré (4 mutations à 0 test
 * tombé) et c'est la classe de défaut que cette story existe pour fermer.
 *
 * `FormControl` n'est VOLONTAIREMENT pas stubbé : c'est un composant de
 * l'application (`app/components/molecules/FormControl.vue`), pas un
 * auto-import Nuxt. Le stubber globalement masquait un import manquant : le
 * composant se rendait vide avec toute la suite verte (trouvé en revue).
 */

const PAGE_PATH = 'app/pages/provider/coach-page.vue'

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: { to: { type: String, default: '' }, loading: { type: Boolean, default: false } },
  setup: (_props, { slots }) => () => Vue.h('button', {}, slots.default ? slots.default() : [])
})
const USwitch = Vue.defineComponent({
  name: 'USwitchStub',
  props: { modelValue: { type: Boolean, default: false } },
  setup: () => () => Vue.h('button', { role: 'switch' })
})
const UInput = Vue.defineComponent({
  name: 'UInputStub',
  props: { modelValue: { type: String, default: '' } },
  setup: () => () => Vue.h('input')
})
/** Remplace l'éditeur de credentials par un marqueur inspectable. */
const ProviderCredentialsEditor = Vue.defineComponent({
  name: 'ProviderCredentialsEditorStub',
  props: { credentials: { type: Array, default: () => [] } },
  emits: ['update:credentials'],
  setup: () => () => Vue.h('div', { 'data-creds-editor': true })
})

interface Captured {
  name: string
  args: unknown[]
}

interface Tree {
  all: Vue.VNode[]
  inputs: Vue.VNode[]
  switches: Vue.VNode[]
  buttons: Vue.VNode[]
}

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const child of vnode) collect(child, out)
    return out
  }
  out.push(vnode)
  if (Array.isArray(vnode.children)) {
    for (const child of vnode.children) {
      if (Vue.isVNode(child)) collect(child, out)
    }
  }
  // Les champs de titres vivent dans le SLOT de `FormControl` : sans descendre
  // dans le sous-arbre des composants enfants, ils sont invisibles ici et le
  // test croit qu'aucun champ n'est rendu.
  if (vnode.component?.subTree) collect(vnode.component.subTree as Vue.VNode, out)
  return out
}

/** Un `v-model` + un `@update:model-value` explicite produisent un TABLEAU de handlers. */
function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (handler === undefined) throw new Error(`Handler ${event} absent du VNode`)
  if (Array.isArray(handler)) {
    let result: unknown
    for (const fn of handler) result = (fn as (...a: unknown[]) => unknown)(...args)
    return result
  }
  return (handler as (...a: unknown[]) => unknown)(...args)
}

function ofType(vnodes: Vue.VNode[], type: unknown): Vue.VNode[] {
  return vnodes.filter(vnode => vnode.type === type)
}

async function renderExternal(
  overrides: Record<string, unknown> = {},
  drive?: (tree: Tree) => void | Promise<void>
): Promise<{ html: string, events: Captured[] }> {
  const events: Captured[] = []
  const props: Record<string, unknown> = {
    section: 'pricing',
    label: 'Modifiable dans Mes tarifs',
    actionLabel: 'Gérer mes formules',
    to: '/provider/scheduling',
    isOn: true,
    saving: false,
    pricingEyebrow: '',
    pricingTitle: ''
  }
  // Les écouteurs portent le nom camelisé de l'émission ; deux d'entre eux
  // contiennent « : », d'où un objet construit par affectation (la règle de
  // citation d'ESLint refuse un littéral mixte).
  const listeners: Record<string, (...args: unknown[]) => void> = {}
  listeners.onToggle = (...args: unknown[]) => events.push({ name: 'toggle', args })
  listeners.onSavePricingTitles = (...args: unknown[]) => events.push({ name: 'save-pricing-titles', args })
  listeners['onUpdate:pricingEyebrow'] = (value: unknown) => events.push({ name: 'update:pricingEyebrow', args: [value] })
  listeners['onUpdate:pricingTitle'] = (value: unknown) => events.push({ name: 'update:pricingTitle', args: [value] })

  const html = await renderSfc('app/components/organisms/CoachPageExternalSectionCard.vue', {
    props: { ...props, ...listeners, ...overrides },
    globals: { ...Vue },
    stubs: { UButton, USwitch, UInput },
    inspect: async (instance) => {
      if (!drive) return
      const all = collect(instance.subTree as Vue.VNode)
      await drive({
        all,
        inputs: ofType(all, UInput),
        switches: ofType(all, USwitch),
        buttons: ofType(all, UButton)
      })
    }
  })
  return { html, events }
}

async function renderCerts(
  credentials: Array<Record<string, unknown>> = [],
  drive?: (tree: Tree) => void | Promise<void>
): Promise<{ html: string, events: Captured[] }> {
  const events: Captured[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {}
  listeners.onSave = () => events.push({ name: 'save', args: [] })
  listeners['onUpdate:credentials'] = (value: unknown) => events.push({ name: 'update:credentials', args: [value] })

  const html = await renderSfc('app/components/organisms/CoachPageCertificationsCard.vue', {
    props: { credentials, saving: false, ...listeners },
    globals: { ...Vue },
    stubs: { UButton },
    mocks: { '~/components/organisms/ProviderCredentialsEditor.vue': ProviderCredentialsEditor },
    inspect: async (instance) => {
      if (!drive) return
      const all = collect(instance.subTree as Vue.VNode)
      await drive({
        all,
        inputs: ofType(all, UInput),
        switches: ofType(all, USwitch),
        buttons: ofType(all, UButton)
      })
    }
  })
  return { html, events }
}

/** Le bouton Enregistrer est le seul qui porte un `@click` (l'autre est un lien). */
function saveButton(tree: Tree): Vue.VNode {
  const withClick = tree.buttons.filter(vnode => (vnode.props ?? {}).onClick)
  assert.equal(withClick.length, 1, 'un seul bouton d’enregistrement attendu')
  return withClick[0]!
}

describe('TF.1 — CoachPageExternalSectionCard', () => {
  test('rend le titre de la section, sa description et son toggle', async () => {
    const { html } = await renderExternal()
    assert.match(html, /Tarifs/)
    assert.match(html, /Modifiable dans Mes tarifs/)
    assert.match(html, /Visible sur ma page/)
    assert.match(html, /role="switch"/, 'l’interrupteur doit être rendu (pas seulement son libellé)')
  })

  test('le corps pricing n’apparaît que pour pricing', async () => {
    const pricing = await renderExternal({ section: 'pricing' })
    assert.match(pricing.html, /id="pricingEyebrow"/)
    assert.match(pricing.html, /id="pricingTitle"/)
    assert.match(pricing.html, /Surtitre de la section/)
    assert.match(pricing.html, /Titre principal de la section/)

    const other = await renderExternal({ section: 'branding' })
    assert.doesNotMatch(other.html, /id="pricingEyebrow"/)
    assert.doesNotMatch(other.html, /id="pricingTitle"/)
    assert.doesNotMatch(other.html, /Enregistrer/)
  })

  test('section éteinte : en-tête conservé, corps et pied repliés', async () => {
    const { html } = await renderExternal({ isOn: false })
    assert.match(html, /Visible sur ma page/)
    assert.match(html, /role="switch"/)
    assert.doesNotMatch(html, /id="pricingEyebrow"/, 'les champs de titres doivent disparaître')
    assert.doesNotMatch(html, /Enregistrer/, 'le bouton Enregistrer doit disparaître')
    assert.doesNotMatch(html, /Gérer mes formules/, 'le lien externe doit disparaître')
  })

  test('le toggle émet toggle(section, valeur)', async () => {
    const { events } = await renderExternal({}, ({ switches }) => {
      assert.equal(switches.length, 1, 'un interrupteur attendu')
      fire(switches[0]!, 'onUpdate:modelValue', false)
    })
    assert.deepEqual(events, [{ name: 'toggle', args: ['pricing', false] }])
  })

  test('le bouton Enregistrer émet save-pricing-titles', async () => {
    const { events } = await renderExternal({}, (tree) => {
      fire(saveButton(tree), 'onClick')
    })
    assert.deepEqual(events, [{ name: 'save-pricing-titles', args: [] }])
  })

  test('les champs de titres émettent leur mise à jour', async () => {
    const { events } = await renderExternal({}, ({ inputs }) => {
      assert.equal(inputs.length, 2, 'deux champs de titres attendus')
      fire(inputs[0]!, 'onUpdate:modelValue', 'Nouveau surtitre')
      fire(inputs[1]!, 'onUpdate:modelValue', 'Nouveau titre')
    })
    assert.deepEqual(events, [
      { name: 'update:pricingEyebrow', args: ['Nouveau surtitre'] },
      { name: 'update:pricingTitle', args: ['Nouveau titre'] }
    ])
  })
})

describe('TF.1 — CoachPageCertificationsCard', () => {
  test('rend l’éditeur de credentials et son bouton Enregistrer', async () => {
    const { html } = await renderCerts()
    assert.match(html, /data-creds-editor/)
    assert.match(html, /Vos formations et accréditations professionnelles/)
    assert.match(html, /Enregistrer/)
  })

  test('transmet les credentials à l’éditeur et relaie ses mises à jour', async () => {
    const credentials = [{ title: 'DU Naturopathie', institution: 'ISUPNAT' }]
    const next = [{ title: 'DU Naturopathie', institution: 'ISUPNAT' }, { title: 'Certification', institution: 'Ménopulse' }]

    const { events } = await renderCerts(credentials, ({ all }) => {
      const editors = all.filter(vnode => vnode.type === ProviderCredentialsEditor)
      assert.equal(editors.length, 1, 'un éditeur attendu')
      assert.deepEqual((editors[0]!.props ?? {}).credentials, credentials, 'la carte doit relayer les credentials vers le bas')
      fire(editors[0]!, 'onUpdate:credentials', next)
    })

    assert.deepEqual(events, [{ name: 'update:credentials', args: [next] }])
  })

  test('le bouton Enregistrer émet save', async () => {
    const { events } = await renderCerts([], (tree) => {
      fire(saveButton(tree), 'onClick')
    })
    assert.deepEqual(events, [{ name: 'save', args: [] }])
  })
})

describe('TF.1 — garde de câblage de la page', () => {
  function pageSource(): string {
    return fs.readFileSync(path.join(process.cwd(), PAGE_PATH), 'utf8')
  }

  test('la page importe et monte les deux composants', () => {
    const source = pageSource()
    assert.match(source, /import CoachPageExternalSectionCard from '~\/components\/organisms\/CoachPageExternalSectionCard\.vue'/)
    assert.match(source, /import CoachPageCertificationsCard from '~\/components\/organisms\/CoachPageCertificationsCard\.vue'/)
    assert.match(source, /<CoachPageExternalSectionCard/)
    assert.match(source, /<CoachPageCertificationsCard/)
  })

  test('la page ne porte plus le markup extrait', () => {
    const source = pageSource()
    assert.equal(source.includes('v-model:credentials="credentialsForm"'), false, 'l’éditeur ne doit plus être monté directement par la page')
    assert.equal(source.includes('export const SECTION_LABELS'), false, 'la table de libellés doit venir du module partagé')
  })

  test('la page câble les deux cartes (props, v-model, événements)', () => {
    // Un rendu de page n'est pas atteignable aujourd'hui (aucun test ne monte
    // `app/pages/**`, cf. deferred-work.md et tf-3) : ces assertions sont le
    // garde-fou minimal, elles ont remplacé des liaisons que rien ne couvrait.
    const source = pageSource()
    for (const binding of [
      'v-model:pricing-eyebrow="sectionTitlesForm.pricingEyebrow"',
      'v-model:pricing-title="sectionTitlesForm.pricingTitle"',
      ':section="section"',
      ':action-label="externalSection(section)?.actionLabel ?? \'\'"',
      ':to="externalSectionTo(section)"',
      ':is-on="isSectionOn(section)"',
      '@toggle="onToggleSection"',
      '@save-pricing-titles="onSavePricingSectionTitles"',
      ':credentials="credentialsForm"',
      '@update:credentials="credentialsForm = $event"',
      '@save="onSaveCredentials"'
    ]) {
      assert.ok(source.includes(binding), `liaison absente de la page : ${binding}`)
    }
  })
})
