import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * TF.3 — rendu réel de `CoachPageCertificationsCard` avec l'éditeur partagé.
 *
 * La page `coach-page.vue` (≈ 3 700 lignes) n'est pas montable par le harnais :
 * la preuve de rendu porte donc sur la carte, qui est le morceau qui porte le
 * comportement (import explicite + montage gardés côté page, cf.
 * `lab-4-credentials-page.test.ts` — garde de câblage, pas preuve de rendu).
 *
 * Convention A32/KISS : les handlers du VNode rendu sont invoqués pour de vrai,
 * jamais lus en regex.
 */

const UInput = Vue.defineComponent({
  name: 'UInputStub',
  props: { modelValue: { type: [String, Number, null], default: '' } },
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    Vue.h('input', {
      value: props.modelValue ?? '',
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    })
})
const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: { loading: { type: Boolean, default: false } },
  setup: (_props, { slots }) => () => Vue.h('button', {}, slots.default ? slots.default() : [])
})
const USwitch = Vue.defineComponent({
  name: 'USwitchStub',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup: () => () => Vue.h('button', { role: 'switch' })
})
const USelect = Vue.defineComponent({
  name: 'USelectStub',
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    Vue.h('select', {
      value: props.modelValue ?? '',
      onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value)
    })
})
const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  setup: () => () => Vue.h('i')
})

interface Credential {
  title: string
  institution?: string
  year?: number | null
  logoAssetId?: string
  logoUrl?: string | null
  featured?: boolean
  kind?: 'diploma' | 'certification'
}

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const child of vnode) collect(child, out)
    return out
  }
  out.push(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (Vue.isVNode(child)) collect(child, out)
    }
  }
  if (vnode.component?.subTree) collect(vnode.component.subTree as Vue.VNode, out)
  return out
}

function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (Array.isArray(handler)) {
    let result: unknown
    for (const fn of handler) result = (fn as (...a: unknown[]) => unknown)(...args)
    return result
  }
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent du VNode`)
}

function ofType(vnodes: Vue.VNode[], type: unknown): Vue.VNode[] {
  return vnodes.filter(vnode => vnode.type === type)
}

interface Emitted {
  name: string
  args: unknown[]
}

async function renderCard(
  credentials: Credential[],
  drive?: (tree: { all: Vue.VNode[]; buttons: Vue.VNode[] }) => void | Promise<void>
): Promise<{ html: string; events: Emitted[] }> {
  const events: Emitted[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {}
  listeners.onSave = () => events.push({ name: 'save', args: [] })
  listeners['onUpdate:credentials'] = (value: unknown) => events.push({ name: 'update:credentials', args: [value] })

  const html = await renderSfc('app/components/organisms/CoachPageCertificationsCard.vue', {
    props: { credentials, saving: false, ...listeners },
    globals: {
      ...Vue,
      useToast: () => ({ add: () => {} })
    },
    stubs: { UInput, UButton, USwitch, USelect, UIcon },
    inspect: async (instance) => {
      if (!drive) return
      const all = collect(instance.subTree as Vue.VNode)
      await drive({ all, buttons: ofType(all, UButton) })
    }
  })
  return { html, events }
}

function saveButton(tree: { buttons: Vue.VNode[] }): Vue.VNode {
  const candidates = tree.buttons.filter(vnode => (vnode.props ?? {}).color === 'primary' && (vnode.props ?? {}).onClick)
  assert.equal(candidates.length, 1, 'un seul bouton d’enregistrement attendu')
  return candidates[0]!
}

describe('TF.3 — CoachPageCertificationsCard : rendu réel de l’éditeur', () => {
  test('rend le texte de section, l’éditeur réel (un champ par entrée) et le bouton Enregistrer', async () => {
    const credentials: Credential[] = [
      { title: 'DU Naturopathie', institution: 'ISUPNAT' },
      { title: 'Certification Ménopulse', institution: 'Ménopulse' }
    ]
    const { html } = await renderCard(credentials)
    assert.match(html, /Vos formations et accréditations professionnelles/)
    assert.match(html, /Enregistrer/)
    // L'éditeur réel rend un champ par entrée × 3 (titre, établissement, année) :
    // 2 entrées ⇒ 2 occurrences de l'aria-label « Intitulé (obligatoire) ».
    const titleFieldCount = (html.match(/Intitulé \(obligatoire\)/g) ?? []).length
    assert.equal(titleFieldCount, 2, `2 champs titre attendus (trouvé ${titleFieldCount})`)
  })

  test('le bouton Enregistrer émet save', async () => {
    const { events } = await renderCard([], (tree) => {
      fire(saveButton(tree), 'onClick')
    })
    assert.deepEqual(events, [{ name: 'save', args: [] }])
  })

  test('modifier une entrée émet update:credentials avec la liste complète (pas d’état propre)', async () => {
    const credentials: Credential[] = [
      { title: 'DU Naturopathie', institution: 'ISUPNAT' },
      { title: 'Certification Ménopulse', institution: 'Ménopulse' }
    ]
    const next = [{ title: 'DU Naturopathie modifié', institution: 'ISUPNAT' }, { title: 'Certification Ménopulse', institution: 'Ménopulse' }]

    const { events } = await renderCard(credentials, ({ all }) => {
      // L'éditeur réel est monté dans la carte : on le retrouve par son champ titre.
      // On déclenche la mise à jour sur le premier UInput (titre de la première entrée).
      const inputs = ofType(all, UInput)
      assert.equal(inputs.length, 6, '6 champs attendus')
      fire(inputs[0]!, 'onUpdate:modelValue', 'DU Naturopathie modifié')
    })

    assert.equal(events.length, 1, 'une seule émission attendue')
    assert.equal(events[0]!.name, 'update:credentials')
    assert.deepEqual(events[0]!.args[0], next.map(c => ({ ...c, year: null })))
  })
})