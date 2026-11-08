import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { before, describe } from 'node:test'

import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'

import { buildHeroHeadlineHint } from '../../app/features/coach/domain/hero-headline-hint'
import { formatUploadError, validateFileUpload } from '../../app/features/assets/asset-validators'
import { renderSfc } from '../helpers/render-sfc'

/**
 * CPD.7 — preuve de RENDU de l'éditeur du hero extrait de `coach-page.vue`.
 *
 * La page (~3 200 lignes) n'est pas montable par le harnais : la preuve porte
 * donc sur la carte, et le câblage page → carte est couvert par la garde
 * bornée de `coach-page-toggles-inline.test.ts` (AC-5).
 *
 * Les handlers du VNode rendu sont invoqués pour de vrai (patterns
 * `cpd-2-bio-problem-editors.test.ts`, `cpd-5-content-editors.test.ts`). Le
 * rendu SSR est figé après `renderToString` : les états qui n'existent qu'après
 * une interaction (aperçu local, erreur) sont prouvés en rejouant la fonction
 * `render` du composant sur son état courant.
 */

const HERO_CARD = 'app/components/organisms/CoachPageHeroEditor.vue'
const OBJECT_URL = 'blob:cpd7-hero-preview'

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
  url: 'https://cdn.example/hero-nouvelle.png',
  assetId: 'asset-hero-1'
})

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

const toasts: { title?: string, description?: string, color?: string }[] = []

before(() => {
  uploadCalls.length = 0
  toasts.length = 0
  uploadResult = async () => ({
    url: 'https://cdn.example/hero-nouvelle.png',
    assetId: 'asset-hero-1'
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

const NuxtLink = Vue.defineComponent({
  name: 'NuxtLinkStub',
  props: { to: { type: String, default: '' } },
  setup: (props, { slots }) => () =>
    Vue.h('a', { href: props.to }, slots.default ? slots.default() : [])
})

const stubs = { UInput, UTextarea, UButton, UIcon, NuxtLink }

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

function setupState(instance: Vue.ComponentInternalInstance): Record<string, unknown> {
  return (instance as unknown as { setupState: Record<string, unknown> }).setupState
}

function fakeFile(size: number, type = 'image/png'): File {
  return { size, type, name: 'hero.png' } as unknown as File
}

function changeEvent(file: File): Event {
  return { target: { files: [file], value: '' } } as unknown as Event
}

function fileInput(all: Vue.VNode[]): Vue.VNode {
  const input = all.find(v => v.type === 'input' && (v.props ?? {}).type === 'file')
  assert.ok(input, 'input file attendu dans le rendu')
  return input as Vue.VNode
}

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

interface RenderCardOptions {
  props?: Record<string, unknown>
  drive?: (all: Vue.VNode[], instance: Vue.ComponentInternalInstance) => void | Promise<void>
}

async function renderCard(options: RenderCardOptions = {}): Promise<{ html: string, events: Emitted[] }> {
  const events: Emitted[] = []
  const listeners: Record<string, (...args: unknown[]) => void> = {
    'onUpdate:headline': value => events.push({ name: 'update:headline', args: [value] }),
    'onUpdate:description': value => events.push({ name: 'update:description', args: [value] }),
    'onUpdate:urgency': value => events.push({ name: 'update:urgency', args: [value] }),
    'onPhotoSelected': value => events.push({ name: 'photo-selected', args: [value] }),
    'onPhotoCleared': () => events.push({ name: 'photo-cleared', args: [] }),
    'onPhotoUploaded': value => events.push({ name: 'photo-uploaded', args: [value] }),
    'onPhotoError': value => events.push({ name: 'photo-error', args: [value] }),
    'onPhotoDisable': () => events.push({ name: 'photo-disable', args: [] }),
    'onPhotoEnableDefault': () => events.push({ name: 'photo-enable-default', args: [] }),
    'onSave': () => events.push({ name: 'save', args: [] })
  }

  const html = await renderSfc(HERO_CARD, {
    props: { ...listeners, ...options.props },
    globals: { ...Vue },
    stubs,
    mocks: { [ASSET_UPLOAD_MODULE]: assetUploadMock },
    inspect: async (instance) => {
      if (options.drive) await options.drive(collect(instance.subTree as Vue.VNode), instance)
    }
  })
  return { html, events }
}

/**
 * CPD.7 (revue) — une garde de source doit ignorer les commentaires : la
 * première version affirmait « la carte ne contient pas `heroForm` » en le
 * nommant dans son propre docblock (même faux positif que cpd-6/lab-3).
 */
function withoutComments(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('CPD.7 — CoachPageHeroEditor : les trois champs et leurs compteurs RENDUS', () => {
  test('AC-1 : 181 caractères → compteur 181/200 AVEC la classe d’avertissement', async () => {
    const headline = 'a'.repeat(181)
    const { html } = await renderCard({ props: { headline } })

    assert.match(
      html,
      /<span class="text-xs text-\[color:var\(--color-warning\)\]">\s*181\/200\s*<\/span>/,
      'au-delà de 180, le compteur doit porter la classe d’avertissement'
    )
  })

  test('AC-1 : 180 caractères ne déclenchent PAS l’avertissement (seuil, pas plafond)', async () => {
    const { html } = await renderCard({ props: { headline: 'a'.repeat(180) } })

    assert.match(
      html,
      /<span class="text-xs text-\[color:var\(--color-brand-muted\)\]">\s*180\/200\s*<\/span>/,
      'le seuil est strictement supérieur à 180 : à 180 le compteur reste neutre'
    )
    assert.equal(
      html.includes('text-[color:var(--color-warning)]'),
      false,
      'aucune classe d’avertissement ne doit être rendue à 180'
    )
  })

  test('AC-1 : description plafonnée à 1000 et urgence à 200, labels accessibles rendus', async () => {
    const { html } = await renderCard({
      props: { description: 'b'.repeat(30), urgency: 'c'.repeat(10) }
    })

    // FormControl est rendu POUR DE VRAI : le label est un <label for="...">.
    assert.ok(html.includes('for="heroHeadline"'), 'le label de l’accroche doit viser son champ')
    assert.ok(html.includes('Accroche / Sous-titre principal'))
    assert.ok(html.includes('for="heroDescription"'))
    assert.ok(html.includes('Description détaillée du Hero'))
    assert.ok(html.includes('for="urgencyText"'))
    assert.ok(html.includes('Message de réassurance sous le bouton CTA'))

    assert.ok(html.includes('30/1000'), 'le compteur de description doit refléter la valeur')
    assert.ok(html.includes('10/200'), 'le compteur d’urgence doit refléter la valeur')
  })

  test('AC-1 : chaque champ porte son maxlength (accroche 200, description 1000, urgence 200)', async () => {
    await renderCard({
      drive: (all) => {
        assert.equal((byId(all, 'heroHeadline', UInput).props ?? {}).maxlength, 200)
        assert.equal((byId(all, 'heroDescription', UTextarea).props ?? {}).maxlength, 1000)
        assert.equal((byId(all, 'urgencyText', UInput).props ?? {}).maxlength, 200)
      }
    })
  })
})

describe('CPD.7 — AC-2 : l’aide de l’accroche vient de la page, le panneau suit le template', () => {
  test('AC-2 : le texte reçu est RENDU tel quel, et diffère selon le template', async () => {
    const visuel = buildHeroHeadlineHint('visuel')
    const signature = buildHeroHeadlineHint('signature')
    assert.notEqual(visuel, signature, 'les deux templates ne doivent pas produire la même aide')

    const visuelRender = await renderCard({ props: { headlineHint: visuel } })
    assert.ok(visuelRender.html.includes(visuel), 'l’aide Visuel exacte doit être rendue')

    const signatureRender = await renderCard({ props: { headlineHint: signature } })
    assert.ok(signatureRender.html.includes(signature), 'l’aide Signature exacte doit être rendue')
    assert.equal(
      signatureRender.html.includes(visuel),
      false,
      'l’aide du template ne doit pas être figée sur une autre valeur'
    )
  })

  test('AC-2 : la carte n’importe ni le registre de templates ni le helper d’aide', () => {
    const source = fs.readFileSync(HERO_CARD, 'utf8')
    assert.equal(source.includes('buildHeroHeadlineHint'), false)
    assert.equal(source.includes('template-lock'), false)
    assert.equal(source.includes('ALBA_TEMPLATE_CODE'), false)
    assert.equal(source.includes('isHeroBackgroundTemplate'), false)
  })

  test('AC-2 : hero-is-background=false rend la consigne Alba avec son lien, true rend les contrôles photo', async () => {
    const alba = await renderCard({
      props: { heroIsBackground: false, templateCode: 'visuel-portrait' }
    })
    assert.ok(alba.html.includes('Le template Alba affiche votre portrait'))
    assert.ok(
      alba.html.includes('href="/provider/account"'),
      'l’instruction doit rester un vrai lien (NuxtLink), pas un span inerte'
    )
    assert.equal(alba.html.includes('Ajouter une photo'), false, 'Alba ne pilote pas de fond')
    assert.equal(alba.html.includes('type="file"'), false, 'aucune entrée fichier hors des templates à fond')

    const background = await renderCard({ props: { heroIsBackground: true, templateCode: 'signature' } })
    assert.equal(background.html.includes('Le template Alba affiche votre portrait'), false)
    assert.ok(background.html.includes('Photo d’en-tête') || background.html.includes('Photo d\'en-tête'))
    assert.ok(background.html.includes('type="file"'))
  })
})

describe('CPD.7 — AC-3 : la photo de hero rend ses états et ses actions', () => {
  test('AC-3 : sans photo → action de téléversement', async () => {
    const { html } = await renderCard({ props: { templateCode: 'signature' } })
    assert.ok(html.includes('Ajouter une photo'), 'l’état vide doit proposer d’ajouter une photo')
    assert.equal(html.includes('Remplacer'), false)
    assert.equal(html.includes('Retirer'), false)
  })

  test('AC-3 : fichier sélectionné → aperçu, Téléverser et Annuler ; Annuler émet photo-cleared', async () => {
    const { events } = await renderCard({
      props: { templateCode: 'signature' },
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(fakeFile(1024)))
        assert.equal(setupState(instance).preview, OBJECT_URL)

        const after = await rerender(instance)
        assert.ok(after.html.includes(OBJECT_URL), 'l’aperçu local doit être rendu')
        assert.ok(after.html.includes('Téléverser'))
        assert.ok(after.html.includes('Annuler'))

        fire(byButtonText(after.all, 'Annuler'), 'onClick')
        assert.equal(setupState(instance).preview, null, 'Annuler vide l’aperçu local')
        const cleared = await rerender(instance)
        assert.ok(cleared.html.includes('Ajouter une photo'))
      }
    })

    assert.deepEqual(events, [
      { name: 'photo-selected', args: [OBJECT_URL] },
      { name: 'photo-cleared', args: [] }
    ])
  })

  test('AC-3 : photo téléversée → aperçu depuis l’URL, Remplacer et Retirer ; Retirer émet photo-disable', async () => {
    const { html, events } = await renderCard({
      props: {
        templateCode: 'signature',
        photoUrl: 'https://cdn.example/hero-actuelle.png'
      },
      drive: (all) => {
        fire(byButtonText(all, 'Retirer'), 'onClick')
      }
    })

    assert.ok(html.includes('https://cdn.example/hero-actuelle.png'), 'l’aperçu doit utiliser l’URL serveur')
    assert.ok(html.includes('Remplacer'))
    assert.ok(html.includes('Retirer'))
    assert.equal(html.includes('Ajouter une photo'), false)
    assert.deepEqual(events, [{ name: 'photo-disable', args: [] }])
  })

  test('AC-3 : photo désactivée → libellé dépendant du template et « Remettre la photo par défaut »', async () => {
    const visuel = await renderCard({
      props: { templateCode: 'visuel', photoDisabled: true },
      drive: (all) => {
        fire(byButtonText(all, 'Remettre la photo par défaut'), 'onClick')
      }
    })
    assert.ok(visuel.html.includes('Fond sombre'), 'Visuel retombe sur un fond sombre, pas sur « Sans photo »')
    assert.deepEqual(visuel.events, [{ name: 'photo-enable-default', args: [] }])

    const signature = await renderCard({ props: { templateCode: 'signature', photoDisabled: true } })
    assert.ok(signature.html.includes('Sans photo'))
    assert.equal(signature.html.includes('Fond sombre'), false)
  })

  test('AC-3/D2 : Visuel sans photo montre le fond par défaut du template', async () => {
    const { html } = await renderCard({ props: { templateCode: 'visuel' } })
    assert.ok(
      html.includes('/images/templates/visuel/hero-default.webp'),
      'l’éditeur doit montrer le fond que le hero Visuel rend par défaut'
    )
  })

  test('AC-3/D2 : Alba montre le portrait de la coach, pas le fond Visuel', async () => {
    const { html } = await renderCard({
      props: {
        heroIsBackground: false,
        templateCode: 'visuel-portrait',
        profilePhotoUrl: 'https://cdn.example/portrait.png'
      }
    })
    assert.ok(html.includes('https://cdn.example/portrait.png'), 'le portrait doit être rendu dans la vignette')
    assert.equal(html.includes('/images/templates/visuel/hero-default.webp'), false)
  })

  test('AC-3/D2 : le rappel de format et de taille est rendu', async () => {
    const { html } = await renderCard({ props: { templateCode: 'signature' } })
    assert.ok(html.includes('JPEG, PNG ou WebP, max 2 Mo'), 'la limite de 2 Mo doit être annoncée avant l’échec')
  })
})

describe('CPD.7 — AC-4 : les émissions sont explicites', () => {
  test('AC-4 : chaque champ émet son update:*', async () => {
    const { events } = await renderCard({
      drive: (all) => {
        fire(byId(all, 'heroHeadline', UInput), 'onUpdate:modelValue', 'Nouvelle accroche')
        fire(byId(all, 'heroDescription', UTextarea), 'onUpdate:modelValue', 'Nouvelle description')
        fire(byId(all, 'urgencyText', UInput), 'onUpdate:modelValue', 'Nouvelle urgence')
      }
    })

    assert.deepEqual(events, [
      { name: 'update:headline', args: ['Nouvelle accroche'] },
      { name: 'update:description', args: ['Nouvelle description'] },
      { name: 'update:urgency', args: ['Nouvelle urgence'] }
    ])
  })

  test('AC-4 : un téléversement réussi émet photo-uploaded avec l’URL', async () => {
    uploadCalls.length = 0
    const file = fakeFile(1024)

    const { events } = await renderCard({
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(file))
        const after = await rerender(instance)
        await fire(byButtonText(after.all, 'Téléverser'), 'onClick')
        assert.equal(setupState(instance).preview, 'https://cdn.example/hero-nouvelle.png')
      }
    })

    assert.equal(uploadCalls.length, 1)
    assert.equal(uploadCalls[0]?.type, 'profile_photo')
    assert.equal((uploadCalls[0]?.file as File).name, 'hero.png')
    assert.deepEqual(events, [
      { name: 'photo-selected', args: [OBJECT_URL] },
      { name: 'photo-uploaded', args: ['https://cdn.example/hero-nouvelle.png'] }
    ])
  })

  test('AC-4 : un échec émet photo-error avec le message de formatUploadError et garde la sélection', async () => {
    uploadResult = async () => {
      throw new Error('TOO_LARGE')
    }

    const { events } = await renderCard({
      drive: async (all, instance) => {
        fire(fileInput(all), 'onChange', changeEvent(fakeFile(1024)))
        const after = await rerender(instance)
        await fire(byButtonText(after.all, 'Téléverser'), 'onClick')
        assert.equal(
          setupState(instance).hasSelection,
          true,
          'la sélection doit rester intacte après un échec'
        )
      }
    })

    assert.deepEqual(events, [
      { name: 'photo-selected', args: [OBJECT_URL] },
      { name: 'photo-error', args: [formatUploadError(new Error('TOO_LARGE'))] }
    ])
    uploadResult = async () => ({
      url: 'https://cdn.example/hero-nouvelle.png',
      assetId: 'asset-hero-1'
    })
  })

  test('AC-4/D2 : « Enregistrer » émet save, et la carte n’appelle jamais updateAccount', async () => {
    const { events } = await renderCard({
      drive: (all) => {
        fire(byButtonText(all, 'Enregistrer'), 'onClick')
      }
    })

    assert.deepEqual(events, [{ name: 'save', args: [] }])

    const source = fs.readFileSync(HERO_CARD, 'utf8')
    assert.equal(source.includes('updateAccount'), false, 'la carte ne doit pas porter l’écriture')
    assert.equal(source.includes('useCoachPageEditor'), false)
    assert.equal(source.includes('fetchAccount'), false)
  })
})

describe('CPD.7 — AC-5 : l’aperçu live n’est pas cassé (contrat de la carte)', () => {
  test('la carte ne détient aucun état de formulaire : elle rend la prop et émet la saisie', async () => {
    const source = withoutComments(fs.readFileSync(HERO_CARD, 'utf8'))
    assert.equal(source.includes('heroForm'), false, 'heroForm reste dans la page (l’aperçu le lit)')
    assert.equal(source.includes('reactive('), false)

    const { events } = await renderCard({
      props: { headline: 'Valeur serveur' },
      drive: (all) => {
        fire(byId(all, 'heroHeadline', UInput), 'onUpdate:modelValue', 'Valeur saisie')
      }
    })
    assert.deepEqual(events, [{ name: 'update:headline', args: ['Valeur saisie'] }])
  })

  test('la carte est montée par la page, une seule fois, avec un import explicite', () => {
    const page = fs.readFileSync('app/pages/provider/coach-page.vue', 'utf8')

    assert.match(
      page,
      /^import CoachPageHeroEditor from '~\/components\/organisms\/CoachPageHeroEditor\.vue'$/m,
      'la carte doit être importée explicitement (une balise non résolue ne rend rien)'
    )
    assert.equal(countOccurrences(page, '<CoachPageHeroEditor'), 1, 'un seul montage de la carte')
    assert.match(page, /heroForm\.heroHeadline = \$event/, 'la saisie doit revenir dans heroForm (aperçu live)')

    // La garde exhaustive des 22 liaisons vit dans la garde canonique des
    // cartes extraites (`coach-page-toggles-inline.test.ts`, CPD.7).
  })
})
