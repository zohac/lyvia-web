import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, test } from 'node:test'

import * as Vue from 'vue'

import {
  applyFaqPatchAt,
  applyTestimonialPatchAt
} from '../../app/features/coach/domain/social-item-patch'
import { FAQ_MAX, TESTIMONIALS_MAX } from '../../app/features/coach/domain/social-editor-limits'
import { renderSfc } from '../helpers/render-sfc'

const TESTIMONIALS = 'app/components/organisms/CoachPageTestimonialsEditor.vue'
const FAQ = 'app/components/organisms/CoachPageFaqEditor.vue'

const UInput = Vue.defineComponent({
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

const UTextarea = Vue.defineComponent({
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

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: {
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    icon: { type: String, default: '' }
  },
  emits: ['click'],
  // Un `<button disabled>` natif ne dispatche pas `click` : le stub doit faire
  // pareil, sinon une assertion « n'émet rien au plafond » est inécrivable
  // (revue CPD.4).
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

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: () => () => Vue.h('i')
})

const USelectMenu = Vue.defineComponent({
  name: 'USelectMenuStub',
  props: {
    modelValue: { type: [String, Number], default: undefined },
    items: { type: Array, default: () => [] },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup: (props, { attrs, emit }) => () =>
    Vue.h('select', {
      ...attrs,
      value: props.modelValue ?? '',
      onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value)
    }, (props.items as unknown[]).map(v => Vue.h('option', { value: v }, String(v))))
})

// FormControl n'est pas stubé : le vrai composant est utilisé (comme cpd-3).

interface Emitted { name: string, args: unknown[] }

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
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

function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent du VNode`)
}

function propValue(vnode: Vue.VNode, name: string): unknown {
  const props = (vnode.props ?? {}) as Record<string, unknown>
  return props[name] ?? props[name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)]
}

function byPlaceholder(all: Vue.VNode[], type: unknown, placeholder: string): Vue.VNode {
  const found = all.filter(v => v.type === type).find(v => (v.props ?? {}).placeholder === placeholder)
  assert.ok(found, `champ placeholder="${placeholder}" attendu dans le rendu`)
  return found as Vue.VNode
}

function allByPlaceholder(all: Vue.VNode[], type: unknown, placeholder: string): Vue.VNode[] {
  return all.filter(v => v.type === type && (v.props ?? {}).placeholder === placeholder)
}

function byId(all: Vue.VNode[], type: unknown, id: string): Vue.VNode {
  const found = all.filter(v => v.type === type).find(v => (v.props ?? {}).id === id)
  assert.ok(found, `champ #${id} attendu dans le rendu`)
  return found as Vue.VNode
}

function byButtonIcon(all: Vue.VNode[], icon: string): Vue.VNode {
  const found = all.filter(v => v.type === UButton).find(v => (v.props ?? {}).icon === icon)
  assert.ok(found, `bouton d'icône "${icon}" attendu dans le rendu`)
  return found as Vue.VNode
}

function removeButtons(all: Vue.VNode[]): Vue.VNode[] {
  return all.filter((v) => {
    const props = (v.props ?? {}) as Record<string, unknown>
    return v.type === 'button' && typeof props.class === 'string' && props.class.includes('absolute right-2')
  })
}

async function renderCard(file: string, props: Record<string, unknown>, drive?: (all: Vue.VNode[]) => void): Promise<{ html: string, events: Emitted[], all: Vue.VNode[] }> {
  const events: Emitted[] = []
  let collected: Vue.VNode[] = []
  const html = await renderSfc(file, {
    props: { ...props, 'onUpdate:item': (...a: unknown[]) => events.push({ name: 'update:item', args: a }), 'onAdd': () => events.push({ name: 'add', args: [] }), 'onRemove': (...a: unknown[]) => events.push({ name: 'remove', args: a }), 'onUpdate:testimonials-eyebrow': (...a: unknown[]) => events.push({ name: 'update:testimonials-eyebrow', args: a }), 'onUpdate:testimonials-title': (...a: unknown[]) => events.push({ name: 'update:testimonials-title', args: a }), 'onUpdate:faq-eyebrow': (...a: unknown[]) => events.push({ name: 'update:faq-eyebrow', args: a }), 'onUpdate:faq-title': (...a: unknown[]) => events.push({ name: 'update:faq-title', args: a }) },
    globals: { ...Vue },
    stubs: { UInput, UTextarea, UButton, UIcon, USelectMenu },
    inspect: (instance) => {
      collected = collect(instance.subTree as Vue.VNode)
      if (drive) drive(collected)
    }
  })
  return { html, events, all: collected }
}

function lastEvent(events: Emitted[], name: string): Emitted {
  const found = [...events].reverse().find(e => e.name === name)
  assert.ok(found, `émission « ${name} » attendue, reçues : ${events.map(e => e.name).join(', ') || 'aucune'}`)
  return found as Emitted
}

const TWO_TESTIMONIALS = [
  { quote: 'Super accompagnement', firstName: 'Marie', age: 52, location: 'Paris', rating: 5, result: 'Plus d\'énergie' },
  { quote: 'Très professionnelle', firstName: 'Claire', age: 48, location: 'Lyon', rating: 4, result: 'Sommeil retrouvé' }
]

const TWO_FAQ = [
  { label: 'Combien de séances ?', content: 'Cela dépend de vos besoins.' },
  { label: 'Remboursement ?', content: 'Non remboursé par la Sécu.' }
]

describe('CPD.4 — les éditeurs sociaux rendent leur liste réelle', () => {
  test('AC-1 : témoignages — six champs par témoignage et deux champs de titre', async () => {
    const { html, all } = await renderCard(TESTIMONIALS, {
      items: TWO_TESTIMONIALS,
      testimonialsEyebrow: 'Témoignages',
      testimonialsTitle: 'Ce qu\'elles en disent'
    })
    assert.equal(allByPlaceholder(all, UInput, 'Prénom *').length, 2)
    assert.equal(allByPlaceholder(all, UInput, 'Âge').length, 2)
    assert.equal(allByPlaceholder(all, UInput, 'Localisation').length, 2)
    assert.equal(allByPlaceholder(all, UTextarea, 'Citation du témoignage *').length, 2)
    assert.equal(allByPlaceholder(all, UInput, 'Résultat après X mois...').length, 2)
    // rating est un USelectMenu → 2 selects
    assert.equal(all.filter(v => v.type === USelectMenu).length, 2)
    assert.equal(propValue(byId(all, UInput, 'testimonialsEyebrow'), 'modelValue'), 'Témoignages')
    assert.equal(propValue(byId(all, UInput, 'testimonialsTitle'), 'modelValue'), 'Ce qu\'elles en disent')
    assert.ok(!html.includes('Enregistrer'), 'la carte de corps ne porte pas le pied d’enregistrement')
  })

  test('AC-1 : FAQ — deux champs par entrée et deux champs de titre', async () => {
    const { html, all } = await renderCard(FAQ, {
      items: TWO_FAQ,
      faqEyebrow: 'Questions fréquentes',
      faqTitle: 'Questions fréquentes sur l\'accompagnement'
    })
    assert.equal(allByPlaceholder(all, UInput, 'Question').length, 2)
    assert.equal(allByPlaceholder(all, UTextarea, 'Réponse (max 2000 caractères)').length, 2)
    assert.equal(propValue(byId(all, UInput, 'faqEyebrow'), 'modelValue'), 'Questions fréquentes')
    assert.equal(propValue(byId(all, UInput, 'faqTitle'), 'modelValue'), 'Questions fréquentes sur l\'accompagnement')
    assert.ok(!html.includes('Enregistrer'), 'la carte de corps ne porte pas le pied d’enregistrement')
  })

  test('AC-1 : FAQ — bouton désactivé à 20, actif à 19', async () => {
    const twenty = Array.from({ length: 20 }, () => ({ label: 'Q', content: 'R' }))
    const r20 = await renderCard(FAQ, { items: twenty })
    assert.equal(byButtonIcon(r20.all, 'i-lucide-plus').props?.disabled, true, '20 questions : « Ajouter » désactivé')

    const nineteen = Array.from({ length: 19 }, () => ({ label: 'Q', content: 'R' }))
    const r19 = await renderCard(FAQ, { items: nineteen })
    assert.equal(byButtonIcon(r19.all, 'i-lucide-plus').props?.disabled, false, '19 questions : « Ajouter » actif')
  })
})

describe('CPD.4 — saisies et suppressions sont émises', () => {
  test('AC-3 : témoignages — update:item, add (sous le plafond), remove, titres', async () => {
    const { all, events } = await renderCard(TESTIMONIALS, {
      items: TWO_TESTIMONIALS,
      testimonialsEyebrow: '',
      testimonialsTitle: ''
    })

    // quote
    fire(byPlaceholder(all, UTextarea, 'Citation du témoignage *'), 'onUpdate:modelValue', 'Nouvelle citation')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'quote', value: 'Nouvelle citation' })

    // firstName
    fire(byPlaceholder(all, UInput, 'Prénom *'), 'onUpdate:modelValue', 'Sophie')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'firstName', value: 'Sophie' })

    // location
    fire(allByPlaceholder(all, UInput, 'Localisation')[1], 'onUpdate:modelValue', 'Nantes')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 1, field: 'location', value: 'Nantes' })

    // age : nombre quand saisi, `undefined` quand vidé (jamais `null`)
    fire(byPlaceholder(all, UInput, 'Âge'), 'onUpdate:modelValue', '52')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'age', value: 52 })
    fire(byPlaceholder(all, UInput, 'Âge'), 'onUpdate:modelValue', '')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'age', value: undefined })

    // result
    fire(byPlaceholder(all, UInput, 'Résultat après X mois...'), 'onUpdate:modelValue', 'Mieux dormir')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'result', value: 'Mieux dormir' })

    // rating reste un nombre
    const select = all.filter(v => v.type === USelectMenu)[0]
    fire(select, 'onUpdate:modelValue', '3')
    const ratingPatch = lastEvent(events, 'update:item').args[0] as { index: number, field: string, value: unknown }
    assert.equal(ratingPatch.field, 'rating')
    assert.equal(typeof ratingPatch.value, 'number', 'la note est émise comme nombre')
    assert.equal(ratingPatch.value, 3)

    // add sous le plafond
    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add').name, 'add')

    // remove
    fire(removeButtons(all)[1], 'onClick')
    assert.deepEqual(lastEvent(events, 'remove').args[0], 1)

    // titres
    fire(byId(all, UInput, 'testimonialsEyebrow'), 'onUpdate:modelValue', 'Surtitre')
    assert.deepEqual(lastEvent(events, 'update:testimonials-eyebrow').args[0], 'Surtitre')
    fire(byId(all, UInput, 'testimonialsTitle'), 'onUpdate:modelValue', 'Titre')
    assert.deepEqual(lastEvent(events, 'update:testimonials-title').args[0], 'Titre')
  })

  test('AC-3 : FAQ — update:item, add, remove, titres', async () => {
    const { all, events } = await renderCard(FAQ, {
      items: TWO_FAQ,
      faqEyebrow: '',
      faqTitle: ''
    })

    fire(byPlaceholder(all, UInput, 'Question'), 'onUpdate:modelValue', 'Nouvelle question')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'label', value: 'Nouvelle question' })

    fire(allByPlaceholder(all, UTextarea, 'Réponse (max 2000 caractères)')[1], 'onUpdate:modelValue', 'Nouvelle réponse')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 1, field: 'content', value: 'Nouvelle réponse' })

    // add (19 < 20)
    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add').name, 'add')

    // remove
    fire(removeButtons(all)[0], 'onClick')
    assert.deepEqual(lastEvent(events, 'remove').args[0], 0)

    // titres
    fire(byId(all, UInput, 'faqEyebrow'), 'onUpdate:modelValue', 'Surtitre')
    assert.deepEqual(lastEvent(events, 'update:faq-eyebrow').args[0], 'Surtitre')
    fire(byId(all, UInput, 'faqTitle'), 'onUpdate:modelValue', 'Titre')
    assert.deepEqual(lastEvent(events, 'update:faq-title').args[0], 'Titre')
  })
})

describe('CPD.4 — plafonds asymétriques', () => {
  test('AC-2 : témoignages — bouton ABSENT à 10, présent et actif à 9 (comportement d’origine)', async () => {
    const ten = Array.from({ length: 10 }, () => ({ quote: 'q', firstName: 'n' }))
    const r10 = await renderCard(TESTIMONIALS, { items: ten })
    const addButtons = r10.all.filter(v => v.type === UButton && (v.props ?? {}).icon === 'i-lucide-plus')
    assert.equal(addButtons.length, 0, 'à 10 témoignages le bouton « Ajouter » disparaît (v-if, comportement d’origine)')
    assert.ok(r10.events.every(e => e.name !== 'add'), 'aucune émission « add » à 10')

    const nine = Array.from({ length: 9 }, () => ({ quote: 'q', firstName: 'n' }))
    const r9 = await renderCard(TESTIMONIALS, { items: nine })
    const btn = byButtonIcon(r9.all, 'i-lucide-plus')
    assert.notEqual(btn.props?.disabled, true, 'à 9 le bouton est actif')
    fire(btn, 'onClick')
    assert.equal(lastEvent(r9.events, 'add').name, 'add', 'à 9 un clic émet « add »')
  })

  test('AC-2 : FAQ — bouton désactivé à 20, un clic n’émet rien', async () => {
    const twenty = Array.from({ length: 20 }, () => ({ label: 'Q', content: 'R' }))
    const { all, events } = await renderCard(FAQ, { items: twenty })
    const btn = byButtonIcon(all, 'i-lucide-plus')
    assert.equal(btn.props?.disabled, true, 'le bouton est désactivé à 20 (garde sur le bouton)')

    // On clique le <button> natif rendu par le stub, pas le listener passé par
    // la carte : c'est le DOM qui empêche l'événement sur `disabled`.
    const native = all.filter(v => v.type === 'button' && (v.props ?? {})['data-icon'] === 'i-lucide-plus')[0]
    assert.ok(native, 'le bouton natif du stub doit être dans l’arbre')
    const before = events.length
    fire(native as Vue.VNode, 'onClick')
    assert.equal(events.length, before, 'un clic sur le bouton désactivé n’émet rien')
  })
})

describe('CPD.4 — contrat partagé et plafonds uniques', () => {
  test('les plafonds vivent dans une source unique, importée par la page et par les cartes', () => {
    assert.equal(TESTIMONIALS_MAX, 10)
    assert.equal(FAQ_MAX, 20)

    for (const [file, constant] of [[TESTIMONIALS, 'TESTIMONIALS_MAX'], [FAQ, 'FAQ_MAX']] as const) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8')
      assert.match(
        source,
        new RegExp(`import \\{ ${constant} \\} from '~/features/coach/domain/social-editor-limits'`),
        `${constant} doit être importé de la source unique`
      )
      assert.ok(
        !new RegExp(`const ${constant} =`).test(source),
        `${constant} ne doit pas être redéclaré dans la carte (deux gardes dériveraient en silence)`
      )
    }

    const page = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/provider/coach-page.vue'), 'utf-8')
    assert.match(page, /import \{ TESTIMONIALS_MAX \} from '~\/features\/coach\/domain\/social-editor-limits'/)
    assert.ok(!/const TESTIMONIALS_MAX =/.test(page), 'la page ne redéclare pas le plafond')
  })

  test('AC-3 : le patch s’applique à la bonne entrée, un index hors bornes est un no-op', () => {
    const items = [{ quote: 'a', firstName: 'A' }, { quote: 'b', firstName: 'B' }]
    applyTestimonialPatchAt(items, { index: 1, field: 'quote', value: 'modifié' })
    assert.equal(items[1]?.quote, 'modifié')
    assert.equal(items[0]?.quote, 'a')

    applyTestimonialPatchAt(items, { index: 5, field: 'quote', value: 'hors bornes' })
    assert.deepEqual(items.map(i => i.quote), ['a', 'modifié'])
  })

  test('AC-3 : `age` vidé vaut `undefined` après application, et n’est pas sérialisé', () => {
    const items: { quote: string, firstName: string, age?: number }[] = [{ quote: 'a', firstName: 'A', age: 52 }]
    applyTestimonialPatchAt(items, { index: 0, field: 'age', value: undefined })
    assert.equal(items[0]?.age, undefined)
    assert.equal(JSON.stringify(items[0]), '{"quote":"a","firstName":"A"}', 'aucune clé `age: null` dans le payload')
  })

  test('AC-3 : FAQ — label et content, index hors bornes no-op', () => {
    const items = [{ label: 'Q1', content: 'R1' }, { label: 'Q2', content: 'R2' }]
    applyFaqPatchAt(items, { index: 0, field: 'label', value: 'Nouvelle question' })
    applyFaqPatchAt(items, { index: 1, field: 'content', value: 'Nouvelle réponse' })
    assert.deepEqual(items, [
      { label: 'Nouvelle question', content: 'R1' },
      { label: 'Q2', content: 'Nouvelle réponse' }
    ])

    applyFaqPatchAt(items, { index: 9, field: 'label', value: 'hors bornes' })
    assert.equal(items.length, 2)
    assert.equal(items[1]?.label, 'Q2')
  })
})
