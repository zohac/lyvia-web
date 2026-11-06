import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * CPD.3 — preuve de RENDU des trois éditeurs de listes extraits de
 * `coach-page.vue` (bénéfices, piliers, déroulé).
 *
 * La page (~2 980 lignes) n'est pas montable par le harnais : la preuve porte
 * donc sur les cartes, et le montage est couvert par la garde de câblage bornée
 * de `coach-page-toggles-inline.test.ts` (AC-4). Les handlers du VNode rendu
 * sont invoqués pour de vrai (pattern `cpd-2-bio-problem-editors.test.ts`).
 *
 * `IconPicker` N'EST PAS stubé : c'est un composant de l'application, importé
 * explicitement par les cartes (le piège de résolution Nuxt de `tf-1`). Seul
 * `UModal`, auto-import Nuxt, est remplacé — sans lui le contenu de la modale
 * polluerait l'arbre et masquerait une balise non résolue.
 */

const BENEFITS = 'app/components/organisms/CoachPageBenefitsEditor.vue'
const PILLARS = 'app/components/organisms/CoachPagePillarsEditor.vue'
const HOW_IT_WORKS = 'app/components/organisms/CoachPageHowItWorksEditor.vue'

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
  setup: (props, { slots, emit, attrs }) => () =>
    Vue.h(
      'button',
      {
        ...attrs,
        'disabled': props.disabled,
        'data-icon': props.icon,
        'onClick': () => emit('click')
      },
      props.label || (slots.default ? slots.default() : [])
    )
})

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: () => () => Vue.h('i')
})

/** Auto-import Nuxt : rendu vide, pour ne pas injecter la modale de l'IconPicker. */
const UModal = Vue.defineComponent({
  name: 'UModalStub',
  props: { open: { type: Boolean, default: false }, title: { type: String, default: '' } },
  setup: () => () => Vue.h('div', { 'data-sfc-stub': 'UModal' })
})

interface Emitted {
  name: string
  args: unknown[]
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

/**
 * Boutons « supprimer » bruts du markup déplacé : `<button class="absolute right-2 …">`.
 * Les boutons `UButton` ont leur propre vnode et ne portent pas cette classe.
 */
function removeButtons(all: Vue.VNode[]): Vue.VNode[] {
  return all.filter((v) => {
    const props = (v.props ?? {}) as Record<string, unknown>
    return v.type === 'button' && typeof props.class === 'string' && props.class.includes('absolute right-2')
  })
}

function iconPicker(all: Vue.VNode[], label: string): Vue.VNode {
  const found = all.find(v => typeof v.type === 'object' && (v.props ?? {}).label === label)
  assert.ok(found, `IconPicker « ${label} » attendu dans le rendu (composant non stubé)`)
  return found as Vue.VNode
}

function pushEvent(events: Emitted[], name: string) {
  return (...args: unknown[]) => {
    events.push({ name, args })
  }
}

function listeners(events: Emitted[]): Record<string, (...args: unknown[]) => void> {
  return {
    'onUpdate:item': pushEvent(events, 'update:item'),
    'onAdd': pushEvent(events, 'add'),
    'onRemove': pushEvent(events, 'remove'),
    'onUpdate:vision-intro': pushEvent(events, 'update:vision-intro'),
    'onUpdate:vision-text': pushEvent(events, 'update:vision-text'),
    'onUpdate:benefits-eyebrow': pushEvent(events, 'update:benefits-eyebrow'),
    'onUpdate:benefits-title': pushEvent(events, 'update:benefits-title'),
    'onUpdate:emotional-support-title': pushEvent(events, 'update:emotional-support-title'),
    'onUpdate:emotional-support-description': pushEvent(events, 'update:emotional-support-description'),
    'onUpdate:pillars-eyebrow': pushEvent(events, 'update:pillars-eyebrow'),
    'onUpdate:pillars-title': pushEvent(events, 'update:pillars-title'),
    'onUpdate:how-it-works-eyebrow': pushEvent(events, 'update:how-it-works-eyebrow'),
    'onUpdate:how-it-works-title': pushEvent(events, 'update:how-it-works-title')
  }
}

interface Rendered {
  html: string
  events: Emitted[]
  all: Vue.VNode[]
}

async function renderCard(
  file: string,
  props: Record<string, unknown>,
  drive?: (all: Vue.VNode[]) => void
): Promise<Rendered> {
  const events: Emitted[] = []
  let collected: Vue.VNode[] = []
  const html = await renderSfc(file, {
    props: { ...listeners(events), ...props },
    globals: { ...Vue },
    stubs: { UInput, UTextarea, UButton, UIcon, UModal },
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

const BENEFIT_ITEMS = [
  { title: 'Sommeil retrouvé', description: 'Des nuits complètes', icon: 'moon-star' },
  { title: 'Énergie stable', description: 'Finies les journées', icon: 'sun' }
]

const PILLAR_ITEMS = [
  { title: 'Alimentation', description: 'Repères simples', icon: 'apple' },
  { title: 'Stress', description: 'Outils accessibles', icon: 'wind' }
]

const STEPS = (count: number) => Array.from({ length: count }, (_, i) => ({
  number: String(i + 1).padStart(2, '0'),
  title: `Étape ${i + 1}`,
  description: `Description ${i + 1}`,
  icon: 'calendar'
}))

describe('CPD.3 — les trois éditeurs de listes rendent leur liste réelle', () => {
  test('AC-1 : bénéfices — trois champs par ligne, vision et titres de section', async () => {
    const { html, all } = await renderCard(BENEFITS, {
      items: BENEFIT_ITEMS,
      visionIntro: 'Imaginez-vous dans 3 mois.',
      visionText: 'Vous dormez mieux.',
      benefitsEyebrow: 'Ce que cela apporte',
      benefitsTitle: 'Un parcours adapté'
    })

    assert.equal(allByPlaceholder(all, UInput, 'Titre du bénéfice').length, 2)
    assert.equal(allByPlaceholder(all, UTextarea, 'Description (max 300 caractères)').length, 2)
    assert.equal(iconPicker(all, 'Icône du bénéfice').props?.label, 'Icône du bénéfice')
    assert.ok(html.includes('aria-label="Icône du bénéfice : Sommeil / Nuit"'), 'l’IconPicker réel est rendu')
    assert.equal(propValue(byId(all, UInput, 'benefitsEyebrow'), 'modelValue'), 'Ce que cela apporte')
    assert.equal(propValue(byId(all, UInput, 'benefitsTitle'), 'modelValue'), 'Un parcours adapté')
    assert.equal(propValue(byPlaceholder(all, UInput, 'Introduction vision (optionnel)'), 'modelValue'), 'Imaginez-vous dans 3 mois.')
    assert.equal(propValue(byPlaceholder(all, UTextarea, 'Texte vision (optionnel)'), 'modelValue'), 'Vous dormez mieux.')
    assert.ok(!html.includes('Enregistrer'), 'la carte de corps ne porte pas le pied d’enregistrement (arbitrage CPD.2)')
  })

  test('AC-1 : piliers — champs par pilier et soutien émotionnel conditionnel', async () => {
    const without = await renderCard(PILLARS, { items: PILLAR_ITEMS, showEmotionalSupport: false })
    assert.equal(allByPlaceholder(without.all, UInput, 'Titre du pilier').length, 2)
    assert.equal(allByPlaceholder(without.all, UTextarea, 'Description (max 500 caractères)').length, 2)
    assert.ok(!without.html.includes('Soutien émotionnel'), 'pas de bloc émotionnel quand la prop est fausse')
    assert.equal(
      allByPlaceholder(without.all, UInput, 'Titre (ex: Un espace d\'écoute bienveillant)').length,
      0,
      'aucun champ émotionnel rendu quand la prop est fausse'
    )
    assert.ok(!without.html.includes('Enregistrer'), 'la carte de corps ne porte pas le pied d’enregistrement')

    const withSupport = await renderCard(PILLARS, {
      items: PILLAR_ITEMS,
      showEmotionalSupport: true,
      emotionalSupport: { title: 'Un espace d’écoute', description: 'Chaque accompagnement inclut…' }
    })
    assert.ok(withSupport.html.includes('Soutien émotionnel'))
    assert.equal(
      propValue(byPlaceholder(withSupport.all, UInput, 'Titre (ex: Un espace d\'écoute bienveillant)'), 'modelValue'),
      'Un espace d’écoute'
    )
    assert.equal(
      propValue(byPlaceholder(withSupport.all, UTextarea, 'Description (max 1000 caractères)'), 'modelValue'),
      'Chaque accompagnement inclut…'
    )
  })

  test('AC-1 : déroulé — plafond de 6 inchangé', async () => {
    const six = await renderCard(HOW_IT_WORKS, { items: STEPS(6) })
    assert.equal(byButtonIcon(six.all, 'i-lucide-plus').props?.disabled, true, '6 étapes : « Ajouter » désactivé')

    const five = await renderCard(HOW_IT_WORKS, { items: STEPS(5) })
    assert.equal(byButtonIcon(five.all, 'i-lucide-plus').props?.disabled, false, '5 étapes : « Ajouter » actif')

    assert.equal(allByPlaceholder(five.all, UInput, 'Titre de l\'étape').length, 5)
    assert.ok(five.html.includes('Étape 05'))
  })
})

describe('CPD.3 — ajouts, suppressions et saisies sont émis', () => {
  test('AC-2 : bénéfices — update:item, add, remove, vision, titres', async () => {
    const { all, events } = await renderCard(BENEFITS, {
      items: BENEFIT_ITEMS,
      visionIntro: '',
      visionText: '',
      benefitsEyebrow: '',
      benefitsTitle: ''
    })

    fire(byPlaceholder(all, UInput, 'Titre du bénéfice'), 'onUpdate:modelValue', 'Nouveau titre')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'title', value: 'Nouveau titre' })

    fire(allByPlaceholder(all, UTextarea, 'Description (max 300 caractères)')[1], 'onUpdate:modelValue', 'Nouvelle description')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 1, field: 'description', value: 'Nouvelle description' })

    fire(iconPicker(all, 'Icône du bénéfice'), 'onUpdate:modelValue', '')
    const iconPatch = lastEvent(events, 'update:item').args[0] as { index: number, field: string, value: unknown }
    assert.deepEqual(iconPatch, { index: 0, field: 'icon', value: undefined }, 'icône vidée ⇒ undefined, jamais une chaîne vide')

    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add').name, 'add')

    fire(removeButtons(all)[1], 'onClick')
    assert.deepEqual(lastEvent(events, 'remove').args[0], 1)

    fire(byPlaceholder(all, UInput, 'Introduction vision (optionnel)'), 'onUpdate:modelValue', 'Intro')
    assert.deepEqual(lastEvent(events, 'update:vision-intro').args[0], 'Intro')

    fire(byPlaceholder(all, UTextarea, 'Texte vision (optionnel)'), 'onUpdate:modelValue', 'Texte')
    assert.deepEqual(lastEvent(events, 'update:vision-text').args[0], 'Texte')

    fire(byId(all, UInput, 'benefitsEyebrow'), 'onUpdate:modelValue', 'Surtitre')
    assert.deepEqual(lastEvent(events, 'update:benefits-eyebrow').args[0], 'Surtitre')

    fire(byId(all, UInput, 'benefitsTitle'), 'onUpdate:modelValue', 'Titre')
    assert.deepEqual(lastEvent(events, 'update:benefits-title').args[0], 'Titre')
  })

  test('AC-2 : piliers — update:item, add, remove, soutien émotionnel', async () => {
    const { all, events } = await renderCard(PILLARS, {
      items: PILLAR_ITEMS,
      showEmotionalSupport: true,
      emotionalSupport: { title: 'Titre', description: 'Description' }
    })

    fire(byPlaceholder(all, UInput, 'Titre du pilier'), 'onUpdate:modelValue', 'Nouveau pilier')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'title', value: 'Nouveau pilier' })

    fire(iconPicker(all, 'Icône du pilier'), 'onUpdate:modelValue', '')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'icon', value: undefined })

    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add').name, 'add')

    fire(removeButtons(all)[0], 'onClick')
    assert.deepEqual(lastEvent(events, 'remove').args[0], 0)

    fire(byPlaceholder(all, UInput, 'Titre (ex: Un espace d\'écoute bienveillant)'), 'onUpdate:modelValue', 'Écoute')
    assert.deepEqual(lastEvent(events, 'update:emotional-support-title').args[0], 'Écoute')

    fire(byPlaceholder(all, UTextarea, 'Description (max 1000 caractères)'), 'onUpdate:modelValue', 'Bienveillant')
    assert.deepEqual(lastEvent(events, 'update:emotional-support-description').args[0], 'Bienveillant')
  })

  test('AC-2 : déroulé — update:item, add, remove, titres', async () => {
    const { all, events } = await renderCard(HOW_IT_WORKS, { items: STEPS(2) })

    fire(byPlaceholder(all, UInput, 'Titre de l\'étape'), 'onUpdate:modelValue', 'Nouvelle étape')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'title', value: 'Nouvelle étape' })

    fire(iconPicker(all, 'Icône de l\'étape'), 'onUpdate:modelValue', '')
    assert.deepEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'icon', value: undefined })

    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add').name, 'add')

    fire(removeButtons(all)[1], 'onClick')
    assert.deepEqual(lastEvent(events, 'remove').args[0], 1)

    fire(byId(all, UInput, 'howItWorksTitle'), 'onUpdate:modelValue', 'Titre déroulé')
    assert.deepEqual(lastEvent(events, 'update:how-it-works-title').args[0], 'Titre déroulé')
  })
})
