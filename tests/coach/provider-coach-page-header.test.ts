import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

/**
 * CPD.10 — preuve de RENDU de l'en-tête extrait de `coach-page.vue`.
 *
 * La version livrée ne s'exécutait pas : elle rendait `CoachPageHeader` sans
 * stub pour `UBadge` / `UButton` / `UTooltip` / `AtomsDsPageHeader`, et le
 * harnais lève alors bruyamment. Le seul test vert était un grep de source sur
 * `publish:`, satisfait par la déclaration `defineEmits` même si le bouton est
 * débranché — il ne prouvait donc rien.
 *
 * Ici : rendu réel, handlers du VNode invoqués, et les trois émissions
 * d'AC-2 vérifiées par clic.
 */

const HEADER_PATH = 'app/components/organisms/CoachPageHeader.vue'

const UBadge = Vue.defineComponent({
  name: 'UBadgeStub',
  props: { color: { type: String, default: '' }, variant: { type: String, default: '' }, icon: { type: String, default: '' } },
  setup: (props, { slots }) => () => Vue.h('span', { 'data-badge': props.color }, slots.default?.())
})

const UTooltip = Vue.defineComponent({
  name: 'UTooltipStub',
  props: { text: { type: String, default: '' } },
  setup: (_, { slots }) => () => Vue.h('span', { 'data-tooltip': '' }, slots.default?.())
})

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: {
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    to: { type: [String, Object], default: undefined },
    external: { type: Boolean, default: false },
    target: { type: String, default: undefined },
    rel: { type: String, default: undefined }
  },
  setup: (props, { attrs, slots }) => () => Vue.h('button', {
    ...attrs,
    'type': 'button',
    'disabled': props.disabled,
    'data-to': typeof props.to === 'string' ? props.to : undefined,
    'data-external': props.external ? 'true' : undefined,
    'target': props.target,
    'rel': props.rel
  }, slots.default?.())
})

const AtomsDsPageHeader = Vue.defineComponent({
  name: 'AtomsDsPageHeaderStub',
  setup: (_, { slots }) => () => Vue.h('header', { 'data-page-header': '' }, [
    Vue.h('div', { 'data-slot': 'default' }, slots.default?.()),
    Vue.h('div', { 'data-slot': 'subtitle' }, slots.subtitle?.()),
    Vue.h('div', { 'data-slot': 'actions' }, slots.actions?.())
  ])
})

const stubs = { UBadge, UTooltip, UButton, AtomsDsPageHeader }

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
  return ''
}

function byButtonText(all: Vue.VNode[], label: string): Vue.VNode {
  const found = all
    .filter(v => v.type === 'button')
    .find(v => vnodeText(v).trim() === label)
  assert.ok(found, `bouton "${label}" attendu dans le rendu`)
  return found as Vue.VNode
}

function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): void {
  const handler = (vnode.props ?? {})[event] as unknown
  assert.equal(typeof handler, 'function', `handler ${event} attendu sur le bouton`)
  ;(handler as (...a: unknown[]) => unknown)(...args)
}

interface RenderHeaderOptions {
  account: Record<string, unknown> | null
  previewLink?: string | null
  publishing?: boolean
  publicLink?: { site?: string } | null
  drive?: (all: Vue.VNode[]) => void
}

async function renderHeader(options: RenderHeaderOptions): Promise<{ html: string, events: Emitted[], all: Vue.VNode[] }> {
  const events: Emitted[] = []
  const listeners = {
    onPreview: () => events.push({ name: 'preview', args: [] }),
    onPublish: () => events.push({ name: 'publish', args: [] }),
    onUnpublish: () => events.push({ name: 'unpublish', args: [] })
  }

  let collected: Vue.VNode[] = []

  const html = await renderSfc(HEADER_PATH, {
    props: {
      account: options.account,
      previewLink: options.previewLink ?? '/coach/sophie?preview=true',
      publishing: options.publishing ?? false,
      publicLink: options.publicLink ?? null,
      ...listeners
    },
    globals: { ...Vue },
    stubs,
    inspect: (instance) => {
      collected = collect(instance.subTree as Vue.VNode)
      options.drive?.(collected)
    }
  })
  return { html, events, all: collected }
}

describe('CPD.10 — CoachPageHeader (AC-2)', () => {
  test('la priorité des badges est exacte : un compte de test publié reste « Compte de test »', async () => {
    const { html } = await renderHeader({ account: { isTest: true, isPublished: true } })

    assert.match(html, /Compte de test/)
    assert.doesNotMatch(html, /En ligne/)
    assert.doesNotMatch(html, /Brouillon/)
  })

  test('un compte publié non-test est badgé « En ligne »', async () => {
    const { html } = await renderHeader({ account: { isTest: false, isPublished: true } })

    assert.match(html, /En ligne/)
    assert.doesNotMatch(html, /Compte de test/)
    assert.doesNotMatch(html, /Brouillon/)
  })

  test('un compte ni test ni publié est badgé « Brouillon »', async () => {
    const { html } = await renderHeader({ account: { isTest: false, isPublished: false } })

    assert.match(html, /Brouillon/)
    assert.doesNotMatch(html, /En ligne/)
    assert.doesNotMatch(html, /Compte de test/)
  })

  test('le lien Aperçu est externe, cible un nouvel onglet et porte rel="noopener noreferrer"', async () => {
    const { html } = await renderHeader({ account: { isTest: false, isPublished: false } })

    assert.match(html, /data-to="\/coach\/sophie\?preview=true"/)
    assert.match(html, /target="_blank"/)
    assert.match(html, /rel="noopener noreferrer"/)
  })

  test('le bouton « Mettre en ligne » émet publish', async () => {
    const { events, all } = await renderHeader({ account: { isTest: false, isPublished: false } })

    fire(byButtonText(all, 'Mettre en ligne'), 'onClick')
    assert.deepEqual(events.map(e => e.name), ['publish'])
  })

  test('le bouton « Dépublier » émet unpublish', async () => {
    const { events, all } = await renderHeader({ account: { isTest: false, isPublished: true } })

    fire(byButtonText(all, 'Dépublier'), 'onClick')
    assert.deepEqual(events.map(e => e.name), ['unpublish'])
  })

  test('le bouton « Aperçu » émet preview', async () => {
    const { events, all } = await renderHeader({ account: { isTest: false, isPublished: false } })

    fire(byButtonText(all, 'Aperçu'), 'onClick')
    assert.deepEqual(events.map(e => e.name), ['preview'])
  })

  test('un compte de test ne peut pas publier : le bouton est désactivé', async () => {
    const { html } = await renderHeader({ account: { isTest: true, isPublished: false } })

    assert.match(html, /<button[^>]*disabled[^>]*>\s*Mettre en ligne/)
  })

  test('l\'en-tête utilise AtomsDsPageHeader (nommage auto-import Nuxt)', () => {
    const source = fs.readFileSync(HEADER_PATH, 'utf8')

    assert.ok(source.includes('<AtomsDsPageHeader'))
    assert.equal(source.includes('<DsPageHeader>'), false)
  })
})
