/**
 * Story diffusion-7 — the Diffusion block: two exclusive states (AC1).
 *
 * Mutations this file kills:
 * - render the checklist in both states (AC1 says `all` shows no name) → the
 *   first test sees a search field or a client name;
 * - render the checklist while the stored audience is still `all` → the third
 *   test sees one, and every tick would answer 422 `CONTENT_NOT_PRIVATE`;
 * - swap the two button labels of `interfaces.md` §6.
 */
import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import test from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/molecules/ContentDiffusionSection.vue'
const CHECKLIST = path.resolve(process.cwd(), 'app/components/molecules/ContentClientChecklist.vue')

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

/** The checklist is replaced by a marker: its own markup is proven elsewhere. */
const CHECKLIST_STUB = {
  name: 'ContentClientChecklist',
  props: ['contentId'],
  setup: () => () => Vue.h('div', { 'data-testid': 'checklist' }, 'checklist')
}

const STUBS = {
  ContentClientChecklist: CHECKLIST_STUB,
  UButton: {
    name: 'UButton',
    props: ['onClick', 'disabled'],
    setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
      Vue.h('div', { 'data-component': 'UButton' }, [
        Vue.h('button', { onClick: props.onClick as (() => void) | undefined }, slots.default?.() ?? [])
      ])
  }
}

function renderSection(props: { audience: 'all' | 'selected', canSelect?: boolean, disabled?: boolean }) {
  const emitted: Array<{ event: string, value: unknown }> = []
  return renderSfc(COMP, {
    props: {
      'contentId': 'content-1',
      'audience': props.audience,
      'canSelect': props.canSelect ?? true,
      'disabled': props.disabled ?? false,
      'onUpdate:audience': (value: unknown) => emitted.push({ event: 'update:audience', value })
    },
    stubs: STUBS,
    mocks: { [CHECKLIST]: CHECKLIST_STUB }
  }).then(html => ({ html, emitted }))
}

function walkVNodes(vnode: Vue.VNode | null | undefined, visit: (vnode: Vue.VNode) => void): void {
  if (!vnode) return
  visit(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) walkVNodes(child as Vue.VNode, visit)
    }
  }
  walkVNodes(vnode.component?.subTree, visit)
}

test('audience "all" states the rule, explains future clients, and shows no name (AC1)', async () => {
  const { html } = await renderSection({ audience: 'all', canSelect: false })

  assert.equal(html.includes('Partagé avec toutes vos clientes'), true)
  assert.equal(html.includes('Couvre aussi les clientes qui vous rejoindront plus tard.'), true)
  assert.equal(html.includes('Choisir des clientes'), true)
  assert.equal(html.includes('data-testid="checklist"'), false, 'no list in the global state')
  assert.equal(html.includes('Rechercher une cliente'), false)
})

test('audience "selected" renders the checklist and the way back to "all" (AC1)', async () => {
  const { html } = await renderSection({ audience: 'selected', canSelect: true })

  assert.equal(html.includes('data-testid="checklist"'), true)
  assert.equal(html.includes('Partager avec toutes mes clientes'), true)
  assert.equal(html.includes('Partagé avec toutes vos clientes'), false, 'the two states are exclusive')
})

test('the checklist is withheld while the stored audience is still "all"', async () => {
  // `POST /provider/content/:id/share` answers 422 CONTENT_NOT_PRIVATE on an
  // `all` content: showing the boxes before the switch is stored would make
  // every tick fail.
  const { html } = await renderSection({ audience: 'selected', canSelect: false })

  assert.equal(html.includes('data-testid="checklist"'), false)
  assert.equal(html.includes('Partager avec toutes mes clientes'), true)
})

test('each switch emits the audience it leads to', async () => {
  const fromAll = await renderSection({ audience: 'all', canSelect: false })
  let handler: (() => void) | undefined
  await renderSfc(COMP, {
    props: {
      'contentId': 'content-1',
      'audience': 'all',
      'canSelect': false,
      'onUpdate:audience': (value: unknown) => fromAll.emitted.push({ event: 'update:audience', value })
    },
    stubs: STUBS,
    mocks: { [CHECKLIST]: CHECKLIST_STUB },
    inspect: (instance) => {
      walkVNodes(instance.subTree, (vnode) => {
        const props = vnode.props as Record<string, unknown> | null
        if (typeof props?.onClick === 'function') handler = props.onClick as () => void
      })
    }
  })

  assert.equal(typeof handler, 'function')
  handler?.()
  assert.deepEqual(fromAll.emitted, [{ event: 'update:audience', value: 'selected' }])
})

test('a disabled block cannot be switched', async () => {
  const { html } = await renderSection({ audience: 'all', canSelect: false, disabled: true })
  assert.equal(html.includes('Partagé avec toutes vos clientes'), true)
})
