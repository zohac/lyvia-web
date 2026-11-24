/**
 * Story diffusion-7 — the client checklist, rendered by the real SFC harness.
 *
 * Split of proof, same seam as `create-content-client-checklist.test.ts`:
 * - the *behaviour* (debounce, pagination, optimistic tick, rollback) is
 *   executed against `createContentClientChecklist` with a fake transport;
 * - the *markup* is rendered here against a fake instance of that factory, so
 *   each state AC2 names — chargement, erreur avec « Réessayer », aucun
 *   résultat — is proven to reach the DOM as text.
 *
 * Mutations this file kills: dropping the `v-if` on the skeleton (loading state
 * disappears), dropping the `v-else-if="error"` branch (the retry affordance
 * disappears), swapping the two empty-state sentences, dropping the e-mail line
 * (two homonyms become indistinguishable), dropping the "Charger plus" button.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/molecules/ContentClientChecklist.vue'
const FACTORY = path.resolve(process.cwd(), 'app/features/contents/createContentClientChecklist.ts')
const CLIENTS_SERVICE = path.resolve(process.cwd(), 'app/features/clients/services/provider-clients.service.ts')
const SHARES_SERVICE = path.resolve(process.cwd(), 'app/features/contents/services/content-shares.service.ts')

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

function buttonStub(name: string) {
  return {
    name,
    props: ['onClick', 'loading', 'disabled'],
    setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
      Vue.h('button', {
        'onClick': props.onClick as (() => void) | undefined,
        'data-component': name,
        'data-loading': String(props.loading ?? false)
      }, slots.default?.() ?? [])
  }
}

const STUBS = {
  UInput: {
    name: 'UInput',
    props: ['modelValue', 'onUpdate:modelValue', 'aria-label', 'autocomplete', 'placeholder'],
    setup: (props: Record<string, unknown>) => () =>
      Vue.h('input', {
        'aria-label': props['aria-label'] as string,
        'autocomplete': props.autocomplete as string,
        'placeholder': props.placeholder as string,
        'value': props.modelValue as string
      })
  },
  UButton: buttonStub('UButton'),
  /**
   * diffusion-14 AC1: the row is a `UCheckbox` now, not a native input.
   *
   * The stub mirrors the contract the page depends on — `modelValue` drives the
   * checked state, `disabled` and `aria-busy` reach the control, and the
   * `#label` slot is what carries the accessible name (the real component
   * renders it inside `<Label :for="id">`). `data-checked` is readable in the
   * HTML; a native `<input type="checkbox">` would produce no `UCheckbox` node
   * at all, so the count assertion below fails on the old markup.
   */
  UCheckbox: {
    name: 'UCheckbox',
    props: ['modelValue', 'disabled', 'onUpdate:modelValue', 'aria-busy'],
    setup: (props: Record<string, unknown>, { slots, attrs }: { slots: SlotMap, attrs: Record<string, unknown> }) => () =>
      Vue.h('label', {
        'data-component': 'UCheckbox',
        'data-checked': props.modelValue === true ? 'true' : 'false',
        'data-disabled': props.disabled === true ? 'true' : 'false',
        'aria-busy': (props.ariaBusy ?? attrs['aria-busy']) as string | undefined,
        'onClick': props.onUpdate
          ? () => (props['onUpdate:modelValue'] as (value: boolean) => void)(!props.modelValue)
          : undefined
      }, [
        Vue.h('input', { type: 'checkbox', checked: props.modelValue === true, disabled: props.disabled === true }),
        ...(slots.label?.() ?? [])
      ])
  },
  USkeleton: {
    name: 'USkeleton',
    setup: () => () => Vue.h('div', { 'data-testid': 'skeleton' })
  },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') }
}

interface FakeState {
  query?: string
  items?: Array<{ clientProfileId: string, firstname: string, lastname: string, email: string }>
  pending?: boolean
  loadingMore?: boolean
  error?: string | null
  loadMoreError?: string | null
  nextCursor?: string | null
  checked?: string[]
  toggling?: string[]
}

function fakeChecklist(state: FakeState, visited: string[] = []) {
  return {
    query: Vue.ref(state.query ?? ''),
    items: Vue.ref(state.items ?? []),
    pending: Vue.ref(state.pending ?? false),
    loadingMore: Vue.ref(state.loadingMore ?? false),
    error: Vue.ref(state.error ?? null),
    loadMoreError: Vue.ref(state.loadMoreError ?? null),
    nextCursor: Vue.ref(state.nextCursor ?? null),
    checked: Vue.ref(new Set(state.checked ?? [])),
    toggling: Vue.ref(new Set(state.toggling ?? [])),
    load: () => {
      visited.push('load')
      return Promise.resolve()
    },
    loadMore: () => {
      visited.push('loadMore')
      return Promise.resolve()
    },
    toggle: (client: { clientProfileId: string }) => {
      visited.push(`toggle:${client.clientProfileId}`)
      return Promise.resolve()
    },
    dispose: () => {}
  }
}

function renderChecklist(
  state: FakeState = {},
  visited: string[] = [],
  inspect?: (instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<string> {
  return renderSfc(COMP, {
    props: { contentId: 'content-1' },
    stubs: STUBS,
    globals: { useToast: () => ({ add: () => {} }) },
    mocks: {
      [FACTORY]: { createContentClientChecklist: () => fakeChecklist(state, visited) },
      [CLIENTS_SERVICE]: { listProviderClients: async () => ({ items: [], page: { nextCursor: null } }) },
      [SHARES_SERVICE]: {
        listContentShares: async () => ({ items: [] }),
        shareContent: async () => ({ count: 0 }),
        unshareContent: async () => undefined
      }
    },
    inspect
  })
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

test('the loading state renders skeletons and no empty-state sentence', async () => {
  const html = await renderChecklist({ pending: true })

  assert.equal(html.includes('data-testid="skeleton"'), true)
  assert.equal(html.includes('Aucune cliente'), false)
})

test('the error state renders the message as text and a "Réessayer" affordance', async () => {
  const visited: string[] = []
  const html = await renderChecklist({ error: 'Impossible de charger les clientes.' }, visited)

  assert.equal(html.includes('Impossible de charger les clientes.'), true)
  assert.equal(html.includes('Réessayer'), true, 'the retry label must be real text')
  assert.equal(html.includes('data-testid="skeleton"'), false)
})

test('an empty roster says nobody is there, and a search with no hit says so differently', async () => {
  const emptyRoster = await renderChecklist({ items: [] })
  assert.equal(emptyRoster.includes('Aucune cliente à afficher.'), true)
  assert.equal(emptyRoster.includes('Aucune cliente ne correspond à cette recherche.'), false)

  const emptySearch = await renderChecklist({ items: [], query: 'zzz' })
  assert.equal(emptySearch.includes('Aucune cliente ne correspond à cette recherche.'), true)
})

test('each row is a design-system checkbox labelled with the name and the e-mail (AC1)', async () => {
  const html = await renderChecklist({
    items: [
      { clientProfileId: 'c1', firstname: 'Marie', lastname: 'Martin', email: 'marie.martin@exemple.fr' },
      { clientProfileId: 'c2', firstname: 'Marie', lastname: 'Martin', email: 'marie.martin2@exemple.fr' }
    ],
    checked: ['c1']
  })

  assert.equal(html.includes('Marie Martin'), true)
  assert.equal(html.includes('marie.martin@exemple.fr'), true)
  assert.equal(html.includes('marie.martin2@exemple.fr'), true, 'two homonyms must be tellable apart')

  // One design-system checkbox per client, the shared one pre-checked.
  const boxes = html.match(/data-component="UCheckbox"[^>]*/g) ?? []
  assert.equal(boxes.length, 2, 'the native input is gone: the row is a UCheckbox')
  assert.equal(boxes.filter(box => box.includes('data-checked="true"')).length, 1)

  // The label carries prénom, nom and e-mail (interfaces.md §7): each box's
  // own label is followed by both lines, never a shared one.
  const rows = html.split('data-component="UCheckbox"').slice(1)
  assert.equal(rows[0]?.includes('marie.martin@exemple.fr'), true)
  assert.equal(rows[1]?.includes('marie.martin2@exemple.fr'), true)
})

test('an in-flight share disables its own row and marks it busy (AC1)', async () => {
  const html = await renderChecklist({
    items: [
      { clientProfileId: 'c1', firstname: 'A', lastname: 'B', email: 'a@b.fr' },
      { clientProfileId: 'c2', firstname: 'C', lastname: 'D', email: 'c@d.fr' }
    ],
    toggling: ['c2']
  })

  const boxes = html.match(/data-component="UCheckbox"[^>]*/g) ?? []
  assert.equal(boxes.length, 2)
  const busy = boxes.filter(box => box.includes('data-disabled="true"'))
  assert.equal(busy.length, 1, 'only the row whose call is in flight is refused')
  assert.equal(busy[0]?.includes('aria-busy="true"'), true)
})

test('the checklist no longer renders a native checkbox (AC1)', () => {
  const source = fs.readFileSync(COMP, 'utf-8')
  assert.equal(/<input\s[^>]*type="checkbox"/.test(source), false, '`<input type="checkbox">` must be gone')
  assert.equal(source.includes('<UCheckbox'), true)
})

test('the search field is named, autocompletes off and writes through to the query', async () => {
  let modelHandler: ((value: string) => void) | undefined
  let searchLabel: string | undefined

  await renderChecklist({ items: [] }, [], (instance) => {
    walkVNodes(instance.subTree, (vnode) => {
      const props = vnode.props as Record<string, unknown> | null
      if (props?.['aria-label'] === 'Rechercher une cliente') {
        searchLabel = props['aria-label'] as string
        modelHandler = props['onUpdate:modelValue'] as (value: string) => void
      }
    })
  })

  const html = await renderChecklist({ items: [] })
  assert.equal(html.includes('autocomplete="off"'), true)
  assert.equal(searchLabel, 'Rechercher une cliente')
  assert.equal(typeof modelHandler, 'function', 'the field must be bound with v-model')
})

test('"Charger plus" appears only when a cursor exists, and clicking it asks for the page', async () => {
  const visited: string[] = []
  let loadMoreHandler: (() => void) | undefined

  const withCursor = await renderChecklist({ items: [{ clientProfileId: 'c1', firstname: 'A', lastname: 'B', email: 'a@b.fr' }], nextCursor: 'cursor-1' }, visited, (instance) => {
    walkVNodes(instance.subTree, (vnode) => {
      const props = vnode.props as Record<string, unknown> | null
      if (props?.['data-component'] === 'UButton' && typeof props.onClick === 'function') {
        loadMoreHandler = props.onClick as () => void
      }
    })
  })

  assert.equal(withCursor.includes('Charger plus'), true)
  assert.equal(typeof loadMoreHandler, 'function')
  loadMoreHandler?.()
  assert.deepEqual(visited, ['loadMore'])

  const withoutCursor = await renderChecklist({ items: [{ clientProfileId: 'c1', firstname: 'A', lastname: 'B', email: 'a@b.fr' }] })
  assert.equal(withoutCursor.includes('Charger plus'), false)
})

test('a page-2 failure renders its own message instead of replacing the list', async () => {
  const html = await renderChecklist({
    items: [{ clientProfileId: 'c1', firstname: 'A', lastname: 'B', email: 'a@b.fr' }],
    nextCursor: 'cursor-1',
    loadMoreError: 'Impossible de charger plus de clientes.'
  })

  assert.equal(html.includes('Impossible de charger plus de clientes.'), true)
  assert.equal(html.includes('A B'), true, 'the rows already loaded stay on screen')
})
