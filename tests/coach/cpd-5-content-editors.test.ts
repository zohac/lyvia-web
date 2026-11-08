import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type * as Vue from 'vue'

import {
  UInput,
  UTextarea,
  allByPlaceholder,
  byButtonIcon,
  byId,
  byPlaceholder,
  fire,
  lastEvent,
  propValue,
  removeButtons,
  renderCard
} from '../helpers/sfc-vnode-harness'

/**
 * CPD.5 — preuve de rendu et d'émission des trois éditeurs de contenu.
 *
 * Les handlers du VNode sont invoqués (`fire`), jamais lus en regex : c'est la
 * différence entre « le texte existe dans le fichier » et « la carte réagit ».
 * `FormControl` n'est pas stubé — c'est un composant de l'application, et le
 * stubber masquerait l'association label/hint que `yb-1-1` protège.
 */

const FIT = 'app/components/organisms/CoachPageFitEditor.vue'
const EDUCATIONAL = 'app/components/organisms/CoachPageEducationalContentEditor.vue'
const FREE_TEXT = 'app/components/organisms/CoachPageFreeTextEditor.vue'

const FIT_FORM = {
  eyebrow: 'Adéquation',
  title: 'Cet accompagnement est-il fait pour vous ?',
  items: [
    { type: 'for', text: 'Vous traversez une périménopause' },
    { type: 'not_for', text: 'Vous cherchez un traitement médicamenteux' }
  ]
}

const THREE_PARAGRAPHS = ['Premier paragraphe', 'Deuxième paragraphe', 'Troisième paragraphe']

const EDU_FORM = {
  paragraphs: THREE_PARAGRAPHS,
  insightBox: { title: 'Le saviez-vous', content: 'La ménopause n\'est pas une maladie.' }
}

const FREE_FORM = {
  title: 'Comment je travaille avec vous',
  paragraphs: ['Un premier temps d\'écoute', 'Un second temps de pratique']
}

function tenParagraphs(): string[] {
  return Array.from({ length: 10 }, (_, i) => `Paragraphe ${i + 1}`)
}

/** Bouton natif rendu par le stub — seul chemin qui honore `disabled`. */
function nativeButton(all: Vue.VNode[], icon: string): Vue.VNode {
  const found = all.find(v => v.type === 'button' && (v.props ?? {})['data-icon'] === icon)
  assert.ok(found, `bouton natif d'icône "${icon}" attendu`)
  return found as Vue.VNode
}

describe('CPD.5 — les trois éditeurs rendent leurs champs réels', () => {
  test('AC-1 : « Pour qui » — surtitre, titre, et pour chaque entrée son texte ET son type', async () => {
    const { html, all } = await renderCard(FIT, { fitForm: FIT_FORM })

    assert.equal(propValue(byId(all, UInput, 'fitEyebrow'), 'modelValue'), 'Adéquation')
    assert.equal(propValue(byId(all, UInput, 'fitTitle'), 'modelValue'), 'Cet accompagnement est-il fait pour vous ?')

    const texts = allByPlaceholder(all, UInput, 'Décrivez un critère...')
    assert.equal(texts.length, 2, 'un champ texte par entrée')
    assert.equal(propValue(texts[0] as Vue.VNode, 'modelValue'), 'Vous traversez une périménopause')
    assert.equal(propValue(texts[1] as Vue.VNode, 'modelValue'), 'Vous cherchez un traitement médicamenteux')

    const selects = all.filter(v => v.type === 'select')
    assert.equal(selects.length, 2, 'un sélecteur de type par entrée')
    assert.equal(propValue(selects[0] as Vue.VNode, 'value'), 'for')
    assert.equal(propValue(selects[1] as Vue.VNode, 'value'), 'not_for')
    const options = all.filter(v => v.type === 'option').map(option => propValue(option, 'value'))
    assert.deepStrictEqual(options, ['for', 'not_for', 'for', 'not_for'], 'chaque entrée offre les deux types')
    assert.ok(html.includes('Pour vous si'), 'le libellé du type « pour » est rendu')

    assert.ok(!html.includes('Enregistrer'), 'la carte de corps ne porte pas le pied d\'enregistrement')
  })

  test('AC-1 : contenu éducatif — un champ par paragraphe, les deux champs de l\'encadré, ajout et suppression', async () => {
    const { all } = await renderCard(EDUCATIONAL, { educationalContentForm: EDU_FORM })

    for (const [idx, value] of THREE_PARAGRAPHS.entries()) {
      const field = byPlaceholder(all, UTextarea, `Paragraphe ${idx + 1} (max 2000 caractères)`)
      assert.equal(propValue(field, 'modelValue'), value, `paragraphe ${idx + 1} rendu`)
      assert.equal(propValue(field, 'maxlength'), 2000, `paragraphe ${idx + 1} borné`)
    }

    assert.equal(propValue(byPlaceholder(all, UInput, 'Titre de l\'encadré'), 'modelValue'), 'Le saviez-vous')
    assert.equal(
      propValue(byPlaceholder(all, UTextarea, 'Contenu de l\'encadré'), 'modelValue'),
      'La ménopause n\'est pas une maladie.'
    )

    assert.equal(byButtonIcon(all, 'i-lucide-plus') !== undefined, true, 'bouton « Ajouter » rendu')
    const removes = removeButtons(all, 'absolute -right-1 -top-1')
    assert.equal(removes.length, 3, 'un bouton de suppression par paragraphe')
    assert.equal(propValue(removes[0] as Vue.VNode, 'aria-label'), 'Supprimer le paragraphe 1')
    assert.equal(propValue(removes[2] as Vue.VNode, 'aria-label'), 'Supprimer le paragraphe 3')
  })

  test('AC-1 : texte libre — titre borné à 200 et un champ borné à 2000 par paragraphe', async () => {
    const { all } = await renderCard(FREE_TEXT, { freeTextForm: FREE_FORM })

    const title = byId(all, UInput, 'freeTextTitle')
    assert.equal(propValue(title, 'modelValue'), 'Comment je travaille avec vous')
    assert.equal(propValue(title, 'maxlength'), 200)

    const paragraphs = all.filter(
      v => v.type === UTextarea && String((v.props ?? {}).placeholder ?? '').startsWith('Paragraphe ')
    )
    assert.equal(paragraphs.length, 2, 'un textarea par paragraphe')
    assert.equal(propValue(paragraphs[0] as Vue.VNode, 'modelValue'), 'Un premier temps d\'écoute')
    for (const paragraph of paragraphs) {
      assert.equal(propValue(paragraph, 'maxlength'), 2000)
      assert.match(String((paragraph.props ?? {}).class ?? ''), /\bw-full\b/, 'textarea pleine largeur')
    }

    // Le label et le hint du FormControl pointent sur le PREMIER textarea —
    // garantie du CR round 2 de `yb-1-1`, désormais prouvée par le rendu.
    assert.equal(propValue(paragraphs[0] as Vue.VNode, 'id'), 'freeTextParagraph')
    assert.match(
      String(propValue(paragraphs[0] as Vue.VNode, 'aria-describedby') ?? ''),
      /freeTextParagraph-hint/
    )
    assert.equal(propValue(paragraphs[1] as Vue.VNode, 'id'), undefined, 'un seul élément porte l\'id du FormControl')
  })
})

describe('CPD.5 — `fitForm = null` est géré par la carte, pas par la page', () => {
  test('AC-2 : une section vide s\'affiche et la saisie émet sans lever', async () => {
    const { html, all, events } = await renderCard(FIT, { fitForm: null })

    assert.equal(propValue(byId(all, UInput, 'fitEyebrow'), 'modelValue'), '', 'surtitre rendu vide, pas absent')
    assert.equal(propValue(byId(all, UInput, 'fitTitle'), 'modelValue'), '')
    assert.equal(allByPlaceholder(all, UInput, 'Décrivez un critère...').length, 0, 'aucune entrée à rendre')
    assert.ok(html.includes('Ajouter un critère « Pour vous »'), 'les actions d\'ajout restent offertes')
    assert.ok(html.includes('Ajouter un critère « Pas adapté »'))

    // La carte n'écrit rien : elle émet, la page applique.
    fire(byId(all, UInput, 'fitEyebrow'), 'onUpdate:modelValue', 'Adéquation saisie')
    const eyebrow = lastEvent(events, 'update:fit-field')
    assert.deepStrictEqual(eyebrow.args[0], { field: 'eyebrow', value: 'Adéquation saisie' })

    fire(byId(all, UInput, 'fitTitle'), 'onUpdate:modelValue', 'Titre saisi')
    const title = lastEvent(events, 'update:fit-field')
    assert.deepStrictEqual(title.args[0], { field: 'title', value: 'Titre saisi' })
  })
})

describe('CPD.5 — ajouts, suppressions et saisies sont émis', () => {
  test('AC-3 : « Pour qui » — update:fit-field, update:item, add, remove (un seul événement par geste)', async () => {
    const { all, events } = await renderCard(FIT, { fitForm: FIT_FORM })

    fire(byId(all, UInput, 'fitEyebrow'), 'onUpdate:modelValue', 'Nouveau surtitre')
    assert.equal(events.length, 1, 'un geste = un événement (pas de canal doublé)')
    assert.deepStrictEqual(events[0]?.args[0], { field: 'eyebrow', value: 'Nouveau surtitre' })

    fire(byId(all, UInput, 'fitTitle'), 'onUpdate:modelValue', 'Nouveau titre')
    assert.deepStrictEqual(lastEvent(events, 'update:fit-field').args[0], { field: 'title', value: 'Nouveau titre' })

    const texts = allByPlaceholder(all, UInput, 'Décrivez un critère...')
    fire(texts[1] as Vue.VNode, 'onUpdate:modelValue', 'Critère modifié')
    assert.deepStrictEqual(lastEvent(events, 'update:item').args[0], { index: 1, field: 'text', value: 'Critère modifié' })

    const selects = all.filter(v => v.type === 'select')
    fire(selects[0] as Vue.VNode, 'onChange', { target: { value: 'not_for' } })
    assert.deepStrictEqual(lastEvent(events, 'update:item').args[0], { index: 0, field: 'type', value: 'not_for' })

    fire(byButtonIcon(all, 'i-lucide-check'), 'onClick')
    assert.deepStrictEqual(lastEvent(events, 'add').args[0], 'for')

    fire(byButtonIcon(all, 'i-lucide-x'), 'onClick')
    assert.deepStrictEqual(lastEvent(events, 'add').args[0], 'not_for')

    const removes = removeButtons(all, 'mt-1 text-')
    assert.equal(removes.length, 2)
    fire(removes[1] as Vue.VNode, 'onClick')
    assert.deepStrictEqual(lastEvent(events, 'remove').args[0], 1)
  })

  test('AC-3 : contenu éducatif — update:paragraph, add-paragraph, remove-paragraph, update:insight', async () => {
    const { all, events } = await renderCard(EDUCATIONAL, { educationalContentForm: EDU_FORM })

    fire(byPlaceholder(all, UTextarea, 'Paragraphe 2 (max 2000 caractères)'), 'onUpdate:modelValue', 'Modifié')
    assert.equal(events.length, 1, 'un geste = un événement')
    assert.deepStrictEqual(events[0]?.args[0], { index: 1, value: 'Modifié' })

    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add-paragraph').name, 'add-paragraph')

    fire((removeButtons(all, 'absolute -right-1 -top-1')[1] as Vue.VNode), 'onClick')
    assert.deepStrictEqual(lastEvent(events, 'remove-paragraph').args[0], 1)

    fire(byPlaceholder(all, UInput, 'Titre de l\'encadré'), 'onUpdate:modelValue', 'Nouveau titre d\'encadré')
    assert.deepStrictEqual(lastEvent(events, 'update:insight').args[0], { field: 'title', value: 'Nouveau titre d\'encadré' })

    fire(byPlaceholder(all, UTextarea, 'Contenu de l\'encadré'), 'onUpdate:modelValue', 'Nouveau contenu')
    assert.deepStrictEqual(lastEvent(events, 'update:insight').args[0], { field: 'content', value: 'Nouveau contenu' })
  })

  test('AC-3 : texte libre — update:title, update:paragraph, add-paragraph, remove-paragraph', async () => {
    const { all, events } = await renderCard(FREE_TEXT, { freeTextForm: FREE_FORM })

    fire(byId(all, UInput, 'freeTextTitle'), 'onUpdate:modelValue', 'Nouveau titre')
    assert.equal(events.length, 1, 'un geste = un événement')
    assert.deepStrictEqual(events[0]?.args[0], 'Nouveau titre')

    const paragraphs = all.filter(
      v => v.type === UTextarea && String((v.props ?? {}).placeholder ?? '').startsWith('Paragraphe ')
    )
    fire(paragraphs[1] as Vue.VNode, 'onUpdate:modelValue', 'Second paragraphe modifié')
    assert.deepStrictEqual(lastEvent(events, 'update:paragraph').args[0], { index: 1, value: 'Second paragraphe modifié' })

    fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(events, 'add-paragraph').name, 'add-paragraph')

    fire((removeButtons(all, 'absolute -right-1 -top-1')[0] as Vue.VNode), 'onClick')
    assert.deepStrictEqual(lastEvent(events, 'remove-paragraph').args[0], 0)
  })
})

describe('CPD.5 — le plafond de 10 désactive « Ajouter », et un clic n\'émet rien', () => {
  test('AC-3 : contenu éducatif — 10 paragraphes', async () => {
    const ten = await renderCard(EDUCATIONAL, { educationalContentForm: { paragraphs: tenParagraphs() } })
    assert.equal(byButtonIcon(ten.all, 'i-lucide-plus').props?.disabled, true, 'désactivé à 10')

    const before = ten.events.length
    fire(nativeButton(ten.all, 'i-lucide-plus'), 'onClick')
    assert.equal(ten.events.length, before, 'un clic au plafond n\'émet rien')

    const nine = await renderCard(EDUCATIONAL, {
      educationalContentForm: { paragraphs: tenParagraphs().slice(0, 9) }
    })
    assert.notEqual(byButtonIcon(nine.all, 'i-lucide-plus').props?.disabled, true, 'actif à 9')
    fire(nativeButton(nine.all, 'i-lucide-plus'), 'onClick')
    assert.equal(lastEvent(nine.events, 'add-paragraph').name, 'add-paragraph')
  })

  test('AC-3 : texte libre — 10 paragraphes, et la raison du plafond reste lisible', async () => {
    const ten = await renderCard(FREE_TEXT, {
      freeTextForm: { title: '', paragraphs: tenParagraphs() }
    })
    assert.equal(byButtonIcon(ten.all, 'i-lucide-plus').props?.disabled, true, 'désactivé à 10')

    const before = ten.events.length
    fire(nativeButton(ten.all, 'i-lucide-plus'), 'onClick')
    assert.equal(ten.events.length, before, 'un clic au plafond n\'émet rien')

    const reason = ten.all.find(v => (v.props ?? {})['data-testid'] === 'free-text-paragraph-limit-reason')
    assert.ok(reason, 'la raison du plafond est rendue — `disabled` sort le bouton de la tabulation')
    assert.equal(propValue(reason as Vue.VNode, 'role'), 'note')

    const nine = await renderCard(FREE_TEXT, {
      freeTextForm: { title: '', paragraphs: tenParagraphs().slice(0, 9) }
    })
    assert.notEqual(byButtonIcon(nine.all, 'i-lucide-plus').props?.disabled, true, 'actif à 9')
    assert.equal(
      nine.all.some(v => (v.props ?? {})['data-testid'] === 'free-text-paragraph-limit-reason'),
      false,
      'aucune raison affichée sous le plafond'
    )
  })
})

describe('CPD.5 — I3 : la carte ne se replie jamais (l\'enveloppe décide)', () => {
  test('AC-4 : formulaire libre vide et section éteinte — les champs restent montés', async () => {
    const { html, all } = await renderCard(FREE_TEXT, { freeTextForm: null })

    assert.equal(propValue(byId(all, UInput, 'freeTextTitle'), 'modelValue'), '', 'le titre reste saisissable')
    assert.equal(allByPlaceholder(all, UTextarea, 'Paragraphe 1 (max 2000 caractères)').length, 0)
    assert.ok(html.includes('Ajouter un paragraphe'), 'l\'action d\'ajout reste montée sur un bloc vide')
    assert.ok(!html.includes('data-testid="free-text-lock-reason"'), 'le verrou appartient à l\'enveloppe, pas à la carte')
  })
})
