import * as assert from 'node:assert/strict'

import * as Vue from 'vue'

import { renderSfc } from './render-sfc'

/**
 * CPD.5 — harnais de rendu partagé pour les cartes d'éditeur.
 *
 * Les suites `cpd-2`, `cpd-3` et `cpd-4` portent chacune leur copie des stubs
 * et des collecteurs (dette tracée dans `deferred-work.md`). CPD.5 n'en ajoute
 * pas une quatrième : les morceaux génériques vivent ici. Les trois copies
 * existantes ne sont pas touchées (hors périmètre d'une revue de story).
 *
 * Les handlers du VNode rendu sont INVOLQUÉS, jamais lus en regex : une
 * assertion qui ne fait que chercher un mot dans le HTML reste verte quand le
 * `@click` disparaît.
 */

export interface Emitted {
  name: string
  args: unknown[]
}

/**
 * Couples `[prop du listener, nom de l'événement]` câblés sur chaque rendu.
 * Un événement émis sans listener ne prouve rien : c'est la liste qui rend
 * l'assertion possible.
 */
const LISTENERS: Array<[string, string]> = [
  ['onUpdate:modelValue', 'update:modelValue'],
  ['onUpdate:title', 'update:title'],
  ['onUpdate:item', 'update:item'],
  ['onUpdate:fit-field', 'update:fit-field'],
  ['onUpdate:paragraph', 'update:paragraph'],
  ['onUpdate:insight', 'update:insight'],
  ['onAdd', 'add'],
  ['onRemove', 'remove'],
  ['onAdd-paragraph', 'add-paragraph'],
  ['onRemove-paragraph', 'remove-paragraph']
]

export const UInput = Vue.defineComponent({
  name: 'UInputStub',
  props: {
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: '' },
    maxlength: { type: [String, Number], default: undefined }
  },
  emits: ['update:modelValue'],
  setup: (props, { attrs, emit }) => () =>
    Vue.h('input', {
      ...attrs,
      value: props.modelValue ?? '',
      placeholder: props.placeholder,
      maxlength: props.maxlength,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    })
})

export const UTextarea = Vue.defineComponent({
  name: 'UTextareaStub',
  props: {
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: '' },
    maxlength: { type: [String, Number], default: undefined }
  },
  emits: ['update:modelValue'],
  setup: (props, { attrs, emit }) => () =>
    Vue.h('textarea', {
      ...attrs,
      value: props.modelValue ?? '',
      placeholder: props.placeholder,
      maxlength: props.maxlength,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    })
})

export const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: {
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    icon: { type: String, default: '' }
  },
  emits: ['click'],
  // Un `<button disabled>` natif ne dispatche pas `click` : le stub fait
  // pareil, sinon une assertion « n'émet rien au plafond » est inécrivable.
  setup: (props, { slots, emit, attrs }) => () =>
    Vue.h(
      'button',
      {
        ...attrs,
        'disabled': props.disabled,
        'data-icon': props.icon,
        'onClick': () => { if (!props.disabled) emit('click') }
      },
      props.label || (slots.default ? slots.default() : [])
    )
})

export const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: () => () => Vue.h('i')
})

export const CARD_STUBS = { UInput, UTextarea, UButton, UIcon }

export function collect(
  vnode: Vue.VNode | Vue.VNode[] | null | undefined,
  out: Vue.VNode[] = []
): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const child of vnode) collect(child, out)
    return out
  }
  out.push(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) if (Vue.isVNode(child)) collect(child, out)
  }
  if (vnode.component?.subTree) collect(vnode.component.subTree as Vue.VNode, out)
  return out
}

export function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent du VNode`)
}

export function propValue(vnode: Vue.VNode, name: string): unknown {
  const props = (vnode.props ?? {}) as Record<string, unknown>
  return props[name] ?? props[name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)]
}

export function byId(all: Vue.VNode[], type: unknown, id: string): Vue.VNode {
  const found = all.filter(v => v.type === type).find(v => (v.props ?? {}).id === id)
  assert.ok(found, `champ #${id} attendu dans le rendu`)
  return found as Vue.VNode
}

export function byPlaceholder(all: Vue.VNode[], type: unknown, placeholder: string): Vue.VNode {
  const found = all.filter(v => v.type === type).find(v => (v.props ?? {}).placeholder === placeholder)
  assert.ok(found, `champ placeholder="${placeholder}" attendu dans le rendu`)
  return found as Vue.VNode
}

export function allByPlaceholder(all: Vue.VNode[], type: unknown, placeholder: string): Vue.VNode[] {
  return all.filter(v => v.type === type && (v.props ?? {}).placeholder === placeholder)
}

export function byButtonIcon(all: Vue.VNode[], icon: string): Vue.VNode {
  const found = all.filter(v => v.type === UButton).find(v => (v.props ?? {}).icon === icon)
  assert.ok(found, `bouton d'icône "${icon}" attendu dans le rendu`)
  return found as Vue.VNode
}

/** Boutons « supprimer » du markup déplacé (icône dans un `<button>` natif). */
export function removeButtons(all: Vue.VNode[], classFragment: string): Vue.VNode[] {
  return all.filter((v) => {
    const props = (v.props ?? {}) as Record<string, unknown>
    return v.type === 'button' && typeof props.class === 'string' && props.class.includes(classFragment)
  })
}

/**
 * Rend une carte d'éditeur et enregistre chaque émission déclarée. `inspect`
 * expose les VNodes pour invoquer les handlers (pas de regex sur le HTML).
 */
export async function renderCard(
  file: string,
  props: Record<string, unknown>
): Promise<{ html: string, events: Emitted[], all: Vue.VNode[] }> {
  const events: Emitted[] = []
  const handlers: Record<string, unknown> = {}
  for (const [prop, name] of LISTENERS) {
    handlers[prop] = (...args: unknown[]) => events.push({ name, args })
  }

  let collected: Vue.VNode[] = []
  const html = await renderSfc(file, {
    props: { ...props, ...handlers },
    globals: { ...Vue },
    stubs: { ...CARD_STUBS },
    inspect: (instance) => {
      collected = collect(instance.subTree as Vue.VNode)
    }
  })
  return { html, events, all: collected }
}

export function lastEvent(events: Emitted[], name: string): Emitted {
  const found = [...events].reverse().find(e => e.name === name)
  assert.ok(found, `émission « ${name} » attendue, reçues : ${events.map(e => e.name).join(', ') || 'aucune'}`)
  return found as Emitted
}
