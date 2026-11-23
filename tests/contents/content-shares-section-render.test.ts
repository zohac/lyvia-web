/**
 * Story 5.6 — the "Partage" card, rendered by the real SFC harness.
 *
 * The harness renders under SSR, where `onMounted`/`onBeforeUnmount` never run
 * and file reads cannot see state changes. The component is therefore rendered
 * twice over: against a **fake `createContentShares`** for what it draws from
 * the state it is given, and against the real factory in
 * `create-content-shares.test.ts` for what that state machine does. The seam is
 * the composable module itself, keyed by its resolved path — the previous
 * version keyed `apiFetch` by `~/services/api/apiFetch`, which the SFC never
 * imports (its chain reaches `'../../../services/api/apiFetch'`), so the mock
 * was dead and the "shared list" test only ever asserted static markup.
 *
 * What this file proves, and the mutation that breaks it:
 *
 * 1. a public content draws no card at all (AC4) — mutation: drop the
 *    `visibility === 'private'` guard, and the public case renders `Partage`;
 * 2. the mount-time decision is delegated to `applyVisibility('public' |
 *    'private')`, so a content that becomes private after a save loads its
 *    shares — mutation: call `loadShares()` unconditionally instead;
 * 3. a populated list renders each client with its date and a "Retirer" whose
 *    accessible name names the client — mutation: drop the `v-for`, and the
 *    name disappears;
 * 4. the empty state says nothing is shared and points at the button;
 * 5. the load error state renders the message it is given;
 * 6. the selector's search field is named, autocompletes off and shows the
 *    client's e-mail next to the name (two "Marie Martin" must differ).
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/organisms/ContentSharesSection.vue'
const PAGE = 'app/pages/provider/content/[id].vue'
const COMPOSABLE = path.resolve(process.cwd(), 'app/features/contents/createContentShares.ts')

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

/** A wrapper that renders the named slots, so their markup reaches the HTML. */
function boxedStub(name: string, slotNames: string[]) {
  return {
    name,
    setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
      Vue.h('div', { 'data-stub': name }, slotNames.flatMap(slotName => slots[slotName]?.() ?? []))
  }
}

const STUBS = {
  UCard: boxedStub('UCard', ['header', 'default']),
  UButton: {
    name: 'UButton',
    setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
      Vue.h('button', {}, slots.default?.() ?? [])
  },
  UInput: { name: 'UInput', setup: () => () => Vue.h('input') },
  UModal: boxedStub('UModal', ['header', 'body', 'footer']),
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') }
}

interface ShareItem {
  clientProfileId: string
  firstname: string
  lastname: string
  sharedAt: string
}

interface FakeState {
  shared?: ShareItem[]
  error?: string | null
  selectorOpen?: boolean
  rosterError?: string | null
}

function fakeShares(state: FakeState, visited: string[] = [], searched: string[] = []) {
  return {
    shared: Vue.ref<ShareItem[]>(state.shared ?? []),
    pending: Vue.ref(false),
    error: Vue.ref<string | null>(state.error ?? null),
    sharingAll: Vue.ref(false),
    adding: Vue.ref(false),
    removing: Vue.ref<Set<string>>(new Set()),
    selectorOpen: Vue.ref(state.selectorOpen ?? false),
    selectorQuery: Vue.ref(''),
    selected: Vue.ref<Set<string>>(new Set()),
    roster: Vue.ref([]),
    rosterPending: Vue.ref(false),
    rosterError: Vue.ref<string | null>(state.rosterError ?? null),
    rosterNextCursor: Vue.ref<string | null>(null),
    selectableClients: Vue.computed(() => [
      { clientProfileId: 'c1', firstname: 'Marie', lastname: 'Martin', email: 'marie.martin@exemple.fr' },
      { clientProfileId: 'c2', firstname: 'Marie', lastname: 'Martin', email: 'marie.martin2@exemple.fr' }
    ]),
    loadShares: () => Promise.resolve(),
    applyVisibility: (visibility: string) => {
      visited.push(visibility)
      return Promise.resolve()
    },
    loadRoster: () => Promise.resolve(),
    scheduleRosterSearch: (query: string) => {
      searched.push(query)
    },
    openSelector: () => Promise.resolve(),
    closeSelector: () => {},
    toggleSelected: () => {},
    loadMoreRoster: () => Promise.resolve(),
    shareSelected: () => Promise.resolve(0),
    shareAll: () => Promise.resolve(0),
    remove: () => Promise.resolve(),
    dispose: () => {}
  }
}

function renderSection(
  props: { contentId: string, visibility: string },
  state: FakeState = {},
  visited: string[] = [],
  allowEmpty = false,
  searched: string[] = [],
  inspect?: (instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<string> {
  return renderSfc(COMP, {
    props,
    stubs: STUBS,
    globals: { useToast: () => ({ add: () => {} }) },
    mocks: { [COMPOSABLE]: { createContentShares: () => fakeShares(state, visited, searched) } },
    allowEmpty,
    inspect
  })
}

/** Every vnode of the rendered tree, component subtrees included. */
function walkVNodes(vnode: Vue.VNode | null | undefined, visit: (vnode: Vue.VNode) => void): void {
  if (!vnode) return
  visit(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) {
        walkVNodes(child as Vue.VNode, visit)
      }
    }
  }
  walkVNodes(vnode.component?.subTree, visit)
}

test('a public content renders no sharing card (AC4)', async () => {
  const visited: string[] = []
  // Rendering nothing is the expected outcome here, not a failed setup: the
  // `visited` assertion below proves setup actually ran.
  const html = await renderSection({ contentId: 'content-1', visibility: 'all' }, {}, visited, true)

  assert.equal(html.includes('Partage'), false)
  assert.equal(html.includes('Ajouter un client'), false)
  // The mount-time decision is delegated, not taken here: the composable is the
  // one place that decides to load (a public content must issue no request).
  assert.deepEqual(visited, ['all'])
})

test('a private content renders the empty state, the actions and the bulk scope', async () => {
  const visited: string[] = []
  const html = await renderSection({ contentId: 'content-1', visibility: 'selected' }, {}, visited)

  assert.deepEqual(visited, ['selected'])
  assert.equal(html.includes('Partage'), true)
  assert.equal(html.includes('Aucun partage pour l&#39;instant') || html.includes('Aucun partage pour l\'instant'), true)
  assert.equal(html.includes('Ajouter un client'), true)
  assert.equal(html.includes('Partager avec tous'), true)
  // `all: true` only covers clients with an appointment: the card must say so.
  assert.equal(html.includes('ayant déjà eu un rendez-vous'), true)
})

test('a populated list renders each client, its date and a named remove button', async () => {
  const html = await renderSection(
    { contentId: 'content-1', visibility: 'selected' },
    { shared: [{ clientProfileId: 'c1', firstname: 'Alice', lastname: 'Durand', sharedAt: '2026-01-01T00:00:00.000Z' }] }
  )

  assert.equal(html.includes('Alice Durand'), true)
  assert.equal(html.includes('Partagé le'), true)
  assert.equal(html.includes('2026-01-01T00:00:00.000Z'), false, 'the raw ISO must be formatted')
  assert.equal(html.includes('Retirer'), true)
  assert.equal(html.includes('aria-label="Retirer le partage avec Alice Durand"'), true)
  assert.equal(html.includes('Aucun partage pour l&#39;instant') || html.includes('Aucun partage pour l\'instant'), false)
})

test('the load error state renders the message it was given', async () => {
  const html = await renderSection(
    { contentId: 'content-1', visibility: 'selected' },
    { error: 'Impossible de charger les partages.' }
  )

  assert.equal(html.includes('Impossible de charger les partages.'), true)
  assert.equal(html.includes('Ajouter un client'), false, 'no blind share while the list is unknown')
})

test('the client selector names its search field, disables autocomplete and shows e-mails', async () => {
  const html = await renderSection(
    { contentId: 'content-1', visibility: 'selected' },
    { selectorOpen: true }
  )

  assert.equal(html.includes('aria-label="Rechercher une cliente"'), true)
  assert.equal(html.includes('autocomplete="off"'), true)
  assert.equal(html.includes('marie.martin@exemple.fr'), true)
  assert.equal(html.includes('marie.martin2@exemple.fr'), true, 'two homonyms must be tellable apart')
})

test('the roster error state renders inside the selector', async () => {
  const html = await renderSection(
    { contentId: 'content-1', visibility: 'selected' },
    { selectorOpen: true, rosterError: 'Impossible de charger la liste des clientes.' }
  )

  assert.equal(html.includes('Impossible de charger la liste des clientes.'), true)
})

test('the selector search field writes through to the debounced search', async () => {
  // SSR cannot type, so the model handler is invoked directly on the vnode that
  // carries the search field — the one piece of the search wiring the composable
  // tests cannot prove (they call `scheduleRosterSearch` directly).
  const searched: string[] = []
  let modelHandler: ((value: string) => void) | undefined

  await renderSection(
    { contentId: 'content-1', visibility: 'selected' },
    { selectorOpen: true },
    [],
    false,
    searched,
    (instance) => {
      walkVNodes(instance.subTree, (vnode) => {
        if ((vnode.props as Record<string, unknown> | null)?.['aria-label'] === 'Rechercher une cliente') {
          modelHandler = (vnode.props as Record<string, unknown>)['onUpdate:modelValue'] as (value: string) => void
        }
      })
    }
  )

  assert.equal(typeof modelHandler, 'function', 'the search field must be bound with v-model')
  modelHandler?.('marie')
  assert.deepEqual(searched, ['marie'])
})

test('the section is imported explicitly and keyed by content id in the edit page', () => {
  // AGENTS §11.6: an unresolvable tag renders nothing while lint, typecheck,
  // tests and the build stay green — the explicit import is the guard. The
  // harness never unmounts, so the `onUnmounted` wiring is read here too.
  const page = fs.readFileSync(path.resolve(process.cwd(), PAGE), 'utf-8')
  assert.match(page, /import\s+MoleculesContentDiffusionSection\s+from\s+'[^']*components\/molecules\/ContentDiffusionSection\.vue'/)

  const tag = page.match(/<MoleculesContentDiffusionSection[\s\S]*?\/>/)?.[0] ?? ''
  assert.ok(tag, 'the page must mount MoleculesContentDiffusionSection')
  assert.ok(tag.includes(':key="content.id"'), 'a route-parameter change must remount the card')

  const component = fs.readFileSync(path.resolve(process.cwd(), COMP), 'utf-8')
  assert.ok(
    /onUnmounted\(\(\)\s*=>\s*cs\.dispose\(\)\)/.test(component),
    'the debounce timer must be cleared when the card goes away'
  )
})
