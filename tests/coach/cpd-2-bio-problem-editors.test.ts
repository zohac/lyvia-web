import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import { before, describe, test } from 'node:test'

import * as Vue from 'vue'

import {
  formatUploadError,
  validateFileUpload
} from '../../app/features/assets/asset-validators'
import { renderSfc } from '../helpers/render-sfc'

/**
 * CPD.2 — preuve de RENDU des deux éditeurs extraits de `coach-page.vue`.
 *
 * La page (~3 500 lignes) n'est pas montable par le harnais : la preuve porte
 * donc sur les cartes, et le montage est couvert par la garde de câblage
 * bornée de `coach-page-toggles-inline.test.ts`. Les handlers du VNode rendu
 * sont invoqués pour de vrai (pattern `tf-3-certifications-card.test.ts`).
 */

// Le harnais n'a pas de navigateur : les object URLs sont stubbées pour rester
// déterministes. `validateFileUpload` ne lit que `size` et `type`, donc une
// enveloppe `File` suffit.
const OBJECT_URL = 'blob:cpd2-preview'
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => OBJECT_URL
})
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: () => {}
})

interface UploadCall {
  type: string
  file: File
}

const uploadCalls: UploadCall[] = []
let uploadResult: () => Promise<{ url: string }> = async () => ({ url: 'https://cdn.example/photo.webp' })

const assetUploadMock = {
  formatUploadError,
  validateFileUpload,
  uploadAsset: (type: string, file: File) => {
    uploadCalls.push({ type, file })
    return uploadResult()
  }
}

const ASSET_UPLOAD_MODULE = path.resolve(
  process.cwd(),
  'app/features/assets/use-asset-upload.ts'
)

before(() => {
  uploadCalls.length = 0
  uploadResult = async () => ({ url: 'https://cdn.example/photo.webp' })
})

const UInput = Vue.defineComponent({
  name: 'UInputStub',
  props: {
    modelValue: { type: [String, Number], default: '' },
    maxlength: { type: [String, Number], default: undefined }
  },
  emits: ['update:modelValue'],
  setup: (props, { attrs, emit }) => () =>
    Vue.h('input', {
      ...attrs,
      value: props.modelValue ?? '',
      maxlength: props.maxlength,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    })
})

const UTextarea = Vue.defineComponent({
  name: 'UTextareaStub',
  props: {
    modelValue: { type: [String, Number], default: '' },
    maxlength: { type: [String, Number], default: undefined }
  },
  emits: ['update:modelValue'],
  setup: (props, { attrs, emit }) => () =>
    Vue.h('textarea', {
      ...attrs,
      value: props.modelValue ?? '',
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
    icon: { type: String, default: '' },
    variant: { type: String, default: '' },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    type: { type: String, default: 'button' }
  },
  emits: ['click'],
  setup: (props, { slots, emit }) => () =>
    Vue.h(
      'button',
      { 'disabled': props.disabled, 'data-loading': props.loading ? 'true' : undefined, 'onClick': () => emit('click') },
      props.label || (slots.default ? slots.default() : [])
    )
})

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: () => () => Vue.h('i')
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
  if (Array.isArray(handler)) {
    let result: unknown
    for (const fn of handler) result = (fn as (...a: unknown[]) => unknown)(...args)
    return result
  }
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent du VNode`)
}

function byId(all: Vue.VNode[], id: string, type: unknown): Vue.VNode {
  const found = all.find(v => v.type === type && (v.props ?? {}).id === id)
  assert.ok(found, `champ #${id} attendu dans le rendu`)
  return found as Vue.VNode
}

function byAriaLabel(all: Vue.VNode[], label: string, type: unknown): Vue.VNode {
  const found = all.find(v => v.type === type && (v.props ?? {})['aria-label'] === label)
  assert.ok(found, `élément aria-label="${label}" attendu dans le rendu`)
  return found as Vue.VNode
}

function byButtonLabel(all: Vue.VNode[], label: string): Vue.VNode {
  const found = all.filter(v => v.type === UButton).find(v => (v.props ?? {}).label === label)
  assert.ok(found, `bouton "${label}" attendu dans le rendu`)
  return found as Vue.VNode
}

function byButtonIcon(all: Vue.VNode[], icon: string): Vue.VNode {
  const found = all.filter(v => v.type === UButton).find(v => (v.props ?? {}).icon === icon)
  assert.ok(found, `bouton d'icône "${icon}" attendu dans le rendu`)
  return found as Vue.VNode
}

function decoded(html: string): string {
  return html.replace(/&#39;/g, String.fromCharCode(39))
}

function setupState(instance: Vue.ComponentInternalInstance): Record<string, unknown> {
  return (instance as unknown as { setupState: Record<string, unknown> }).setupState
}

async function callHandler(instance: Vue.ComponentInternalInstance, name: string): Promise<void> {
  const handler = setupState(instance)[name]
  assert.equal(typeof handler, 'function', `${name} doit être exposé par le composant`)
  await (handler as () => Promise<void>)()
}

function fakeFile(size: number, type = 'image/jpeg'): File {
  return { size, type, name: 'photo.jpg' } as unknown as File
}

function changeEvent(file: File): Event {
  return { target: { files: [file] } } as unknown as Event
}

const BIO = 'app/components/organisms/CoachPageBioEditor.vue'
const PROBLEM = 'app/components/organisms/CoachPageProblemStatementEditor.vue'

async function renderBio(
  props: Record<string, unknown> = {},
  drive?: (all: Vue.VNode[], instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<{ html: string, events: Emitted[] }> {
  const events: Emitted[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {
    'onUpdate:longBio': value => events.push({ name: 'update:longBio', args: [value] }),
    'onUpdate:city': value => events.push({ name: 'update:city', args: [value] }),
    'onUpdate:region': value => events.push({ name: 'update:region', args: [value] }),
    'onUpdate:bioEyebrow': value => events.push({ name: 'update:bioEyebrow', args: [value] }),
    'onUpdate:bioTitle': value => events.push({ name: 'update:bioTitle', args: [value] }),
    'onPhoto-selected': url => events.push({ name: 'photo-selected', args: [url] }),
    'onPhoto-uploaded': url => events.push({ name: 'photo-uploaded', args: [url] }),
    'onPhoto-error': message => events.push({ name: 'photo-error', args: [message] })
  }

  const html = await renderSfc(BIO, {
    props: {
      bioForm: { longBio: '', city: '', region: '' },
      bioEyebrow: 'Qui suis-je',
      bioTitle: 'Mon titre',
      ...listeners,
      ...props
    },
    globals: { ...Vue },
    stubs: { UInput, UTextarea, UButton, UIcon },
    mocks: { [ASSET_UPLOAD_MODULE]: assetUploadMock },
    inspect: async (instance) => {
      if (!drive) return
      await drive(collect(instance.subTree as Vue.VNode), instance)
    }
  })
  return { html, events }
}

async function renderProblem(
  props: Record<string, unknown> = {},
  drive?: (all: Vue.VNode[], instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<{ html: string, events: Emitted[] }> {
  const events: Emitted[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {
    'onUpdate:blockquote': value => events.push({ name: 'update:blockquote', args: [value] }),
    'onUpdate:paragraph': value => events.push({ name: 'update:paragraph', args: [value] }),
    'onUpdate:problemStatementEyebrow': value => events.push({ name: 'update:problemStatementEyebrow', args: [value] }),
    'onUpdate:problemStatementTitle': value => events.push({ name: 'update:problemStatementTitle', args: [value] }),
    'onAdd-paragraph': () => events.push({ name: 'add-paragraph', args: [] }),
    'onRemove-paragraph': index => events.push({ name: 'remove-paragraph', args: [index] }),
    'onPhoto-selected': url => events.push({ name: 'photo-selected', args: [url] }),
    'onPhoto-uploaded': url => events.push({ name: 'photo-uploaded', args: [url] }),
    'onPhoto-error': message => events.push({ name: 'photo-error', args: [message] }),
    'onPhoto-removed': () => events.push({ name: 'photo-removed', args: [] })
  }

  const html = await renderSfc(PROBLEM, {
    props: {
      problemStatementForm: { blockquote: '', paragraphs: [] },
      problemStatementEyebrow: 'Comprendre',
      problemStatementTitle: 'Mon titre',
      ...listeners,
      ...props
    },
    globals: { ...Vue },
    stubs: { UInput, UTextarea, UButton, UIcon },
    mocks: { [ASSET_UPLOAD_MODULE]: assetUploadMock },
    inspect: async (instance) => {
      if (!drive) return
      await drive(collect(instance.subTree as Vue.VNode), instance)
    }
  })
  return { html, events }
}

describe('CPD.2 — CoachPageBioEditor : rendu et émissions', () => {
  test('AC-1 : rend les deux titres, longBio (maxlength 5000), city, region, compteur et upload', async () => {
    const { html } = await renderBio({
      bioForm: { longBio: 'Bonjour', city: 'Paris', region: 'Île-de-France' }
    })
    assert.match(html, /Surtitre de la section/)
    assert.match(html, /Titre principal de la section/)
    assert.match(html, /Bio détaillée/)
    assert.match(html, /Ville/)
    assert.match(html, /Région/)
    assert.match(html, /id="longBio"/)
    assert.match(html, /maxlength="5000"/)
    assert.match(html, /7\/5000/, 'le compteur doit refléter longBio, et non bio')
    assert.match(html, /Modifier la photo/)
    assert.match(html, /max 2 Mo/)
  })

  test('AC-2 : modifier longBio / city / region / titres émet update:* avec la valeur saisie', async () => {
    const { events } = await renderBio({}, async (all) => {
      fire(byId(all, 'longBio', UTextarea), 'onUpdate:modelValue', 'Nouvelle bio')
      fire(byId(all, 'city', UInput), 'onUpdate:modelValue', 'Lyon')
      fire(byId(all, 'region', UInput), 'onUpdate:modelValue', 'Rhône')
      fire(byId(all, 'bioEyebrow', UInput), 'onUpdate:modelValue', 'Surtitre')
      fire(byId(all, 'bioTitle', UInput), 'onUpdate:modelValue', 'Titre')
    })

    assert.deepEqual(events, [
      { name: 'update:longBio', args: ['Nouvelle bio'] },
      { name: 'update:city', args: ['Lyon'] },
      { name: 'update:region', args: ['Rhône'] },
      { name: 'update:bioEyebrow', args: ['Surtitre'] },
      { name: 'update:bioTitle', args: ['Titre'] }
    ])
  })

  test('AC-3 : un fichier refusé affiche l’erreur de validateFileUpload SANS appel réseau', async () => {
    uploadCalls.length = 0
    const { events } = await renderBio({}, async (all, instance) => {
      const input = all.find(v => (v.props ?? {}).type === 'file')
      assert.ok(input, 'input file attendu')
      fire(input!, 'onChange', changeEvent(fakeFile(3 * 1024 * 1024)))
      // Le rendu SSR est figé après `renderToString` : l'erreur réactive est lue
      // sur l'état du composant, pas dans le HTML déjà produit.
      assert.equal(setupState(instance).uploadError, 'La taille maximale est de 2 Mo.')
    })

    assert.equal(uploadCalls.length, 0, 'aucun appel réseau sur fichier refusé')
    assert.deepEqual(events, [], 'aucun aperçu ni échec d’upload ne doit être émis')
  })

  test('AC-3 : sélection valide → aperçu + photo-selected ; upload → photo-uploaded, sélection vidée', async () => {
    uploadCalls.length = 0
    uploadResult = async () => ({ url: 'https://cdn.example/bio.webp' })

    const { events } = await renderBio({}, async (all, instance) => {
      const input = all.find(v => (v.props ?? {}).type === 'file')
      fire(input!, 'onChange', changeEvent(fakeFile(1024)))
      // Le bouton « Enregistrer la photo » n'existe qu'après sélection, donc après
      // le rendu SSR : on invoque le handler réel du composant, comme le prévoit
      // le harnais (« invocation directe du handler capturé »).
      await callHandler(instance, 'onUploadClick')
    })

    assert.deepEqual(events, [
      { name: 'photo-selected', args: [OBJECT_URL] },
      { name: 'photo-uploaded', args: ['https://cdn.example/bio.webp'] }
    ])
    assert.equal(uploadCalls.length, 1)
    assert.equal(uploadCalls[0]!.type, 'secondary_photo')
  })

  test('AC-3 : un échec d’upload émet photo-error et laisse la sélection intacte', async () => {
    uploadResult = async () => {
      throw new Error('TOO_LARGE')
    }

    const { events } = await renderBio({}, async (all, instance) => {
      const input = all.find(v => (v.props ?? {}).type === 'file')
      fire(input!, 'onChange', changeEvent(fakeFile(1024)))
      await callHandler(instance, 'onUploadClick')
      // La sélection doit rester : le fichier n'est pas vidé sur échec.
      assert.equal(setupState(instance).hasSelection, true, 'la sélection doit être conservée après échec')
    })

    assert.deepEqual(events[events.length - 1], { name: 'photo-error', args: ['Le fichier est trop volumineux.'] })
  })
})

describe('CPD.2 — CoachPageProblemStatementEditor : rendu et émissions', () => {
  test('AC-1 : rend les titres, la citation (2000), un champ par paragraphe (500) et les actions photo', async () => {
    const { html } = await renderProblem({
      problemStatementForm: { blockquote: 'Citation', paragraphs: ['Premier', 'Second'] },
      photoUrl: 'https://cdn.example/fond.webp'
    })

    assert.match(html, /Surtitre de la section/)
    assert.match(html, /Titre principal de la section/)
    assert.match(html, /maxlength="2000"/)
    assert.equal((html.match(/aria-label="Paragraphe \d"/g) ?? []).length, 2)
    assert.equal((html.match(/maxlength="500"/g) ?? []).length, 2)
    const text = decoded(html)
    assert.match(text, /Ajouter un paragraphe/)
    assert.match(text, /Supprimer l'image/)
    assert.match(text, /Modifier l'image/)
  })

  test('AC-1 : formulaire null → aucun champ de paragraphe fantôme', async () => {
    const { html } = await renderProblem({ problemStatementForm: null })
    assert.doesNotMatch(html, /aria-label="Paragraphe \d"/)
    assert.doesNotMatch(html, /Supprimer le paragraphe \d/)
  })

  test('AC-2 : citation, paragraphe, ajout et suppression émettent les bons événements', async () => {
    const { events } = await renderProblem({
      problemStatementForm: { blockquote: 'Citation', paragraphs: ['Premier', 'Second'] }
    }, async (all) => {
      fire(byAriaLabel(all, 'Citation principale', UTextarea), 'onUpdate:modelValue', 'Nouvelle citation')
      fire(byAriaLabel(all, 'Paragraphe 2', UTextarea), 'onUpdate:modelValue', 'Deuxième modifié')
      fire(byButtonIcon(all, 'i-lucide-plus'), 'onClick')
      const remove = all.find(v => v.type === 'button' && (v.props ?? {})['aria-label'] === 'Supprimer le paragraphe 1')
      assert.ok(remove, 'bouton de suppression attendu')
      fire(remove!, 'onClick')
    })

    assert.deepEqual(events, [
      { name: 'update:blockquote', args: ['Nouvelle citation'] },
      { name: 'update:paragraph', args: [{ index: 1, value: 'Deuxième modifié' }] },
      { name: 'add-paragraph', args: [] },
      { name: 'remove-paragraph', args: [0] }
    ])
  })

  test('AC-1 : « Ajouter un paragraphe » est désactivé au plafond de 10', async () => {
    await renderProblem({
      problemStatementForm: { blockquote: '', paragraphs: Array.from({ length: 10 }, (_, i) => `p${i}`) }
    }, async (all) => {
      assert.equal((byButtonIcon(all, 'i-lucide-plus').props ?? {}).disabled, true)
    })
  })

  test('AC-3 : supprimer la photo émet photo-removed, sans appel réseau ni updateAccount', async () => {
    uploadCalls.length = 0
    const { events } = await renderProblem({
      photoUrl: 'https://cdn.example/fond.webp'
    }, async (all) => {
      fire(byButtonLabel(all, 'Supprimer l\'image'), 'onClick')
    })

    assert.deepEqual(events, [{ name: 'photo-removed', args: [] }])
    assert.equal(uploadCalls.length, 0)
  })

  test('AC-3 : la suppression reflète `photoBusy` (bouton désactivé pendant le PATCH)', async () => {
    await renderProblem({
      photoUrl: 'https://cdn.example/fond.webp',
      photoBusy: true
    }, async (all) => {
      const button = byButtonLabel(all, 'Supprimer l\'image')
      assert.equal((button.props ?? {}).disabled, true)
    })
  })

  test('AC-3 : refus de fichier sans appel réseau, upload réussi → photo-uploaded', async () => {
    uploadCalls.length = 0
    uploadResult = async () => ({ url: 'https://cdn.example/enonce.webp' })

    const { events } = await renderProblem({}, async (all, instance) => {
      const input = all.find(v => (v.props ?? {}).type === 'file')
      assert.ok(input, 'input file attendu')
      fire(input!, 'onChange', changeEvent(fakeFile(6 * 1024 * 1024)))
      assert.equal(uploadCalls.length, 0, 'aucun appel réseau sur fichier refusé')

      fire(input!, 'onChange', changeEvent(fakeFile(1024)))
      await callHandler(instance, 'onUploadClick')
    })

    assert.deepEqual(events, [
      { name: 'photo-selected', args: [OBJECT_URL] },
      { name: 'photo-uploaded', args: ['https://cdn.example/enonce.webp'] }
    ])
    assert.equal(uploadCalls[0]!.type, 'problem_statement_photo')
  })
})
