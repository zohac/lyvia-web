import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import test, { before, describe } from 'node:test'

import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'

import {
  formatUploadError,
  validateBrandLogoFile
} from '../../app/features/assets/asset-validators'
import { renderSfc } from '../helpers/render-sfc'

/**
 * CPD.6 — preuve de RENDU de la carte « Identité de marque » et de l'éditeur de
 * palette extraits de `coach-page.vue`.
 *
 * La page (~3 100 lignes) n'est pas montable par le harnais : la preuve porte
 * donc sur les cartes, et le câblage page → cartes est couvert par la garde
 * bornée de `coach-page-toggles-inline.test.ts`.
 *
 * Les handlers du VNode rendu sont invoqués pour de vrai (patterns
 * `cpd-2-bio-problem-editors.test.ts` et `tf-3-certifications-card.test.ts`).
 * Le rendu SSR étant figé après `renderToString`, les états qui n'existent
 * qu'après une interaction (aperçu local, erreur de validation) sont prouvés en
 * rejouant la fonction `render` du composant sur son état courant — c'est le
 * seul moyen d'observer la branche réellement rendue.
 */

// Le harnais n'a pas de navigateur : les object URLs sont stubbées pour rester
// déterministes. `validateBrandLogoFile` ne lit que `size` et `type`.
const OBJECT_URL = 'blob:cpd6-logo-preview'
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
let uploadResult: () => Promise<{ url: string, assetId: string }> = async () => ({
  url: 'https://cdn.example/nouveau-logo.png',
  assetId: 'asset-logo-1'
})

const assetUploadMock = {
  formatUploadError,
  validateBrandLogoFile,
  uploadAsset: (type: string, file: File) => {
    uploadCalls.push({ type, file })
    return uploadResult()
  }
}

const ASSET_UPLOAD_MODULE = path.resolve(
  process.cwd(),
  'app/features/assets/use-asset-upload.ts'
)

const BRANDING_CARD = 'app/components/organisms/CoachPageBrandingCard.vue'
const PALETTE_EDITOR = 'app/components/organisms/CoachPagePaletteEditor.vue'

const toasts: { title?: string, description?: string, color?: string }[] = []
const toastMock = {
  add: (toast: { title?: string, description?: string, color?: string }) => {
    toasts.push(toast)
  }
}

before(() => {
  uploadCalls.length = 0
  toasts.length = 0
  uploadResult = async () => ({
    url: 'https://cdn.example/nouveau-logo.png',
    assetId: 'asset-logo-1'
  })
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
      {
        'disabled': props.disabled,
        'data-loading': props.loading ? 'true' : undefined,
        'data-icon': props.icon || undefined,
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

const stubs = { UInput, UButton, UIcon }

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

function vnodeText(vnode: Vue.VNode): string {
  const children = vnode.children
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children
      .map(child => (Vue.isVNode(child) ? vnodeText(child) : String(child ?? '')))
      .join('')
  }
  if (children && typeof children === 'object' && 'default' in children) {
    const nodes = (children as { default?: () => unknown }).default?.()
    const list = Array.isArray(nodes) ? nodes : [nodes]
    return list
      .map(node => (Vue.isVNode(node) ? vnodeText(node) : String(node ?? '')))
      .join('')
  }
  return ''
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

function byButtonText(all: Vue.VNode[], label: string): Vue.VNode {
  const found = all
    .filter(v => v.type === UButton)
    .find(v => vnodeText(v).trim() === label)
  assert.ok(found, `bouton "${label}" attendu dans le rendu`)
  return found as Vue.VNode
}

function byTestId(all: Vue.VNode[], testId: string): Vue.VNode | undefined {
  return all.find(v => (v.props ?? {})['data-testid'] === testId)
}

function setupState(instance: Vue.ComponentInternalInstance): Record<string, unknown> {
  return (instance as unknown as { setupState: Record<string, unknown> }).setupState
}

function fakeFile(size: number, type = 'image/png'): File {
  return { size, type, name: 'logo.png' } as unknown as File
}

function changeEvent(file: File): Event {
  return { target: { files: [file], value: '' } } as unknown as Event
}

function fileInput(all: Vue.VNode[]): Vue.VNode {
  const input = all.find(v => v.type === 'input' && (v.props ?? {}).type === 'file')
  assert.ok(input, 'input file attendu dans le rendu')
  return input as Vue.VNode
}

/**
 * Rejoue la fonction `render` du composant sur son état courant. Le rendu SSR
 * est figé après `renderToString` : sans cela, la branche « aperçu local » et
 * l'erreur de validation resteraient invérifiables (elles n'existent qu'après
 * une interaction). Le rendu est fait dans un contexte de composant pour que
 * `resolveComponent` retrouve les stubs enregistrés.
 */
async function rerender(instance: Vue.ComponentInternalInstance): Promise<{ html: string, all: Vue.VNode[] }> {
  const type = instance.type as unknown as { render: (...args: unknown[]) => Vue.VNode }
  let tree: Vue.VNode | undefined
  const holder = Vue.defineComponent({
    render() {
      tree = type.render(instance.proxy, [], instance.props, setupState(instance), {}, instance.proxy)
      return tree
    }
  })
  const app = Vue.createSSRApp(holder)
  for (const [name, stub] of Object.entries(stubs)) app.component(name, stub as Vue.Component)
  const failures: string[] = []
  app.config.errorHandler = (error, _instance, info) => {
    failures.push(`${info}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
  }
  app.config.warnHandler = (message) => {
    failures.push(`[Vue warn] ${message}`)
  }
  const html = await renderToString(app)
  if (failures.length > 0) throw new Error(failures.join('\n'))
  assert.ok(tree, 'arbre rendu attendu')
  return { html, all: collect(tree!) }
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

function decoded(html: string): string {
  return html.replace(/&#39;/g, String.fromCharCode(39))
}

interface RenderCardOptions {
  props?: Record<string, unknown>
  drive?: (all: Vue.VNode[], instance: Vue.ComponentInternalInstance) => void | Promise<void>
}

async function renderCard(options: RenderCardOptions = {}): Promise<{ html: string, events: Emitted[] }> {
  const events: Emitted[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {
    'onUpdate:brandName': value => events.push({ name: 'update:brand-name', args: [value] }),
    'onSave': () => events.push({ name: 'save', args: [] }),
    'onLogoUploaded': payload => events.push({ name: 'logo-uploaded', args: [payload] }),
    'onLogoRemoved': () => events.push({ name: 'logo-removed', args: [] })
  }

  const html = await renderSfc(BRANDING_CARD, {
    props: { ...listeners, ...options.props },
    globals: { ...Vue, useToast: () => toastMock },
    stubs,
    mocks: { [ASSET_UPLOAD_MODULE]: assetUploadMock },
    inspect: async (instance) => {
      if (options.drive) await options.drive(collect(instance.subTree as Vue.VNode), instance)
    }
  })
  return { html, events }
}

describe('CPD.6 — CoachPageBrandingCard : les trois états du logo sont RENDUS', () => {
  test('AC-1/AC-2 : sans logo, la carte rend le nom, le compteur n/100 et le CTA de téléversement', async () => {
    const { html } = await renderCard({
      props: { brandName: 'Ma marque' },
      drive: async (all) => {
        const input = fileInput(all)
        assert.equal(
          (input.props ?? {}).accept,
          'image/png,image/jpeg,image/webp',
          'l’input doit restreindre les formats (SVG exclu)'
        )
        assert.equal(
          (byId(all, 'brandName', UInput).props ?? {}).maxlength,
          100,
          'le nom de marque doit rester plafonné à 100 (API)'
        )
      }
    })

    assert.ok(html.includes('Ma marque'), 'le nom de marque doit être rendu dans les aperçus')
    assert.ok(html.includes('9/100'), 'le compteur doit refléter la longueur du nom')
    assert.ok(html.includes('Téléverser un logo'), 'le CTA de l’état vide doit être rendu')
    assert.ok(!html.includes('brand-logo-current-preview'), 'aucun aperçu persistant sans logo')
    assert.ok(!html.includes('brand-logo-local-preview'), 'aucun aperçu local sans fichier')
  })

  test('AC-1 : sans nom ni logo, l’encadré d’information invite à téléverser', async () => {
    const { html } = await renderCard()
    assert.ok(
      html.includes('Renseignez votre nom de marque et téléversez votre logo pour personnaliser votre identité.'),
      'l’encadré d’information doit mentionner le téléversement'
    )
  })

  test('AC-2 : logo persisté → aperçu depuis l’URL serveur, boutons Remplacer et Supprimer', async () => {
    const { html, events } = await renderCard({
      props: { brandName: 'Ma marque', logoServerUrl: 'https://cdn.example/ancien-logo.png' },
      drive: async (all) => {
        fire(byButtonText(all, 'Supprimer'), 'onClick')
      }
    })

    assert.ok(html.includes('https://cdn.example/ancien-logo.png'), 'l’aperçu doit utiliser l’URL serveur')
    assert.ok(html.includes('brand-logo-current-preview'), 'branche « logo persisté » attendue')
    assert.ok(html.includes('Remplacer'), 'action « Remplacer » attendue')
    assert.ok(!html.includes('Téléverser un logo'), 'l’état vide ne doit pas cohabiter avec un logo')
    assert.deepEqual(events, [{ name: 'logo-removed', args: [] }])
  })

  test('AC-2/AC-6 : fichier sélectionné → aperçu LOCAL prioritaire, Téléverser + Annuler', async () => {
    const { events } = await renderCard({
      props: { logoServerUrl: 'https://cdn.example/ancien-logo.png' },
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(fakeFile(1024)))
        assert.equal(setupState(instance).logoLocalPreview, OBJECT_URL)

        const after = await rerender(instance)
        assert.ok(after.html.includes('brand-logo-local-preview'), 'branche « aperçu local » attendue')
        assert.ok(after.html.includes(OBJECT_URL), 'l’aperçu local doit être rendu')
        assert.ok(
          !after.html.includes('https://cdn.example/ancien-logo.png'),
          'un aperçu local gagne sur l’ancien logo (priorité de logoPreviewSrc)'
        )
        assert.ok(after.html.includes('Téléverser'), 'action « Téléverser » attendue après sélection')
        assert.ok(after.html.includes('Annuler'), 'action « Annuler » attendue après sélection')

        // « Annuler » ne doit RIEN émettre et doit vider l’état local.
        fire(byButtonText(after.all, 'Annuler'), 'onClick')
        assert.equal(setupState(instance).logoLocalPreview, null)
        const cleared = await rerender(instance)
        assert.ok(!cleared.html.includes('brand-logo-local-preview'), 'l’aperçu local doit disparaître')
        assert.ok(cleared.html.includes('https://cdn.example/ancien-logo.png'), 'l’ancien logo reprend la main')
      }
    })

    assert.deepEqual(events, [], '« Annuler » est purement local et n’émet rien')
  })

  test('AC-2/AC-3 : un fichier refusé affiche l’erreur de validateBrandLogoFile SANS appel réseau', async () => {
    uploadCalls.length = 0
    const { events } = await renderCard({
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(fakeFile(2 * 1024 * 1024)))

        const expected = validateBrandLogoFile(fakeFile(2 * 1024 * 1024))
        assert.equal(expected, 'Le logo doit faire moins de 1 Mo.')
        assert.equal(setupState(instance).logoUploadError, expected)

        const after = await rerender(instance)
        const error = byTestId(after.all, 'brand-logo-error')
        assert.ok(error, 'l’erreur doit être RENDUE dans la carte')
        assert.ok(after.html.includes('Le logo doit faire moins de 1 Mo.'))
      }
    })

    assert.equal(uploadCalls.length, 0, 'aucun appel réseau sur fichier refusé')
    assert.deepEqual(events, [], 'un refus n’émet rien')
  })

  test('AC-3 : « Téléverser » appelle uploadAsset(brand_logo) et émet url + assetId', async () => {
    uploadCalls.length = 0
    const file = fakeFile(1024)

    const { events } = await renderCard({
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(file))
        const after = await rerender(instance)
        await fire(byButtonText(after.all, 'Téléverser'), 'onClick')
        assert.equal(setupState(instance).logoLocalPreview, null, 'l’aperçu local est nettoyé après upload')
      }
    })

    assert.equal(uploadCalls.length, 1)
    assert.equal(uploadCalls[0]?.type, 'brand_logo')
    assert.equal((uploadCalls[0]?.file as File).name, 'logo.png')
    assert.equal((uploadCalls[0]?.file as File).size, 1024)
    assert.deepEqual(events, [
      {
        name: 'logo-uploaded',
        args: [{ url: 'https://cdn.example/nouveau-logo.png', assetId: 'asset-logo-1' }]
      }
    ])
  })

  test('AC-3 : un upload en échec affiche l’erreur inline ET un toast', async () => {
    toasts.length = 0
    uploadResult = async () => {
      throw new Error('boom')
    }

    const { events } = await renderCard({
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(fakeFile(1024)))
        const after = await rerender(instance)
        await fire(byButtonText(after.all, 'Téléverser'), 'onClick')
        assert.ok(setupState(instance).logoUploadError)
      }
    })

    assert.deepEqual(events, [], 'un échec n’émet pas logo-uploaded')
    assert.equal(toasts.length, 1, 'parité avec l’ancien widget : un toast d’erreur')
    assert.equal(toasts[0]?.title, 'Erreur')
    uploadResult = async () => ({
      url: 'https://cdn.example/nouveau-logo.png',
      assetId: 'asset-logo-1'
    })
  })

  test('AC-1/AC-3 : le nom émet update:brand-name et « Enregistrer » émet save', async () => {
    const { events } = await renderCard({
      props: { brandName: 'Ma marque' },
      drive: async (all) => {
        fire(byId(all, 'brandName', UInput), 'onUpdate:modelValue', 'Autre marque')
        fire(byButtonText(all, 'Enregistrer'), 'onClick')
      }
    })

    assert.deepEqual(events, [
      { name: 'update:brand-name', args: ['Autre marque'] },
      { name: 'save', args: [] }
    ])
  })
})

describe('CPD.6 — CoachPagePaletteEditor : seuils et avertissements RENDUS', () => {
  async function renderPalette(
    props: Record<string, unknown>,
    drive?: (all: Vue.VNode[]) => void
  ): Promise<{ html: string, events: Emitted[] }> {
    const events: Emitted[] = []
    const listeners = {
      'onUpdate:brandColor': (value: unknown) => events.push({ name: 'update:brand-color', args: [value] }),
      'onUpdate:brandAccentColor': (value: unknown) => events.push({ name: 'update:brand-accent-color', args: [value] }),
      'onSave': () => events.push({ name: 'save', args: [] })
    }

    const html = await renderSfc(PALETTE_EDITOR, {
      props: { ...listeners, ...props },
      globals: { ...Vue },
      stubs,
      inspect: async (instance) => {
        if (drive) drive(collect(instance.subTree as Vue.VNode))
      }
    })
    return { html, events }
  }

  const PRIMARY = 'Attention : cette couleur est très claire sur fond blanc (contraste faible).'
  const ACCENT = 'Attention : cette couleur d\'accent est très claire (lisibilité réduite).'

  test('AC-4 : #F5F5F5 rend l’avertissement principal UNE seule fois, #5B4B6E aucune', async () => {
    const low = await renderPalette({ brandColor: '#F5F5F5' })
    assert.equal(countOccurrences(low.html, PRIMARY), 1, 'l’avertissement doit être rendu une seule fois')

    const ok = await renderPalette({ brandColor: '#5B4B6E' })
    assert.equal(countOccurrences(ok.html, PRIMARY), 0, 'aucun avertissement pour #5B4B6E')
  })

  test('AC-4 : l’accent a SON seuil (2,5) — clair avertit, sombre non', async () => {
    const low = await renderPalette({ brandColor: '#5B4B6E', brandAccentColor: '#F5F5F5' })
    assert.ok(decoded(low.html).includes(ACCENT), 'un accent clair doit déclencher l’avertissement accent')
    assert.ok(!low.html.includes(PRIMARY), 'la couleur principale correcte ne doit rien déclencher')

    const ok = await renderPalette({ brandColor: '#5B4B6E', brandAccentColor: '#D4956A' })
    assert.ok(!decoded(ok.html).includes(ACCENT), 'un accent correct ne doit rien déclencher')
  })

  test('AC-4 : modifier une couleur émet update:*, « Enregistrer » émet save', async () => {
    const { events } = await renderPalette(
      { brandColor: '#5B4B6E', brandAccentColor: '#D4956A' },
      (all) => {
        fire(byId(all, 'brandColor', UInput), 'onUpdate:modelValue', '#123456')
        fire(byId(all, 'brandAccentColor', UInput), 'onUpdate:modelValue', '#ABCDEF')

        const colorInputs = all.filter(v => v.type === 'input' && (v.props ?? {}).type === 'color')
        assert.equal(colorInputs.length, 2, 'deux sélecteurs couleur attendus')
        fire(colorInputs[0] as Vue.VNode, 'onInput', { target: { value: '#654321' } })

        fire(byButtonText(all, 'Enregistrer'), 'onClick')
      }
    )

    assert.deepEqual(events, [
      { name: 'update:brand-color', args: ['#123456'] },
      { name: 'update:brand-accent-color', args: ['#ABCDEF'] },
      { name: 'update:brand-color', args: ['#654321'] },
      { name: 'save', args: [] }
    ])
  })
})
