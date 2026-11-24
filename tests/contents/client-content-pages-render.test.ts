/**
 * Story 5.7 — the two client « Ressources » pages, rendered by the real SFC
 * harness.
 *
 * Why this file exists: `/client/**` is `ssr: false`, so nothing in the app
 * ever server-renders these pages, and AGENTS §11.6 records the failure mode —
 * a component tag Nuxt cannot resolve renders NOTHING while lint, typecheck,
 * unit tests and the build all stay green. The browser gate (A35) proves the
 * pages once; these tests keep proving their branches afterwards.
 *
 * What is proven, and the mutation that breaks it:
 *
 * 1. the list draws one link per content with its title, type badge, provider
 *    and a formatted date — mutation: drop the `v-for`, the links disappear;
 * 2. the empty state says « Aucun contenu disponible » only when no filter is
 *    active — mutation: use one empty state for both, and a search that matches
 *    nothing claims the catalogue is empty;
 * 3. a filtered empty result offers a reset — mutation: drop the action slot;
 * 4. a first-load error renders the retry surface, never an empty screen;
 * 5. « Charger plus » exists only when a cursor is present;
 * 6. the type filter is fed by the shared vocabulary, not a copy;
 * 7. the reading page's 404 state is its own surface, with a way back, and is
 *    not the retryable error surface — mutation: map both to `errorMessage`;
 * 8. the reading page draws the title, the provider, the date and the body,
 *    and falls back on a null body / null date without a dangling separator;
 * 9. a platform card and a platform article read « Keova », never a
 *    practitioner — mutation: drop the `source` branch and they read the name
 *    of whichever provider is left;
 * 10. the « Document » badge and the « Télécharger le document » button appear
 *     only when a PDF is attached — mutation: drop the `v-if` and every card
 *     advertises a document nobody can open;
 * 11. neither surface puts a storage URL in the DOM — mutation: render
 *     `document.url` and the assertion fails;
 * 12. an `http(s)` URL in the body is an `<a target="_blank"
 *     rel="noopener noreferrer">` carrying « (nouvel onglet) », and the
 *     sentence punctuation after it stays outside the link — mutation: render
 *     the body as one text run and there is no anchor at all;
 * 13. a `javascript:`/`data:` payload or raw markup in the body is escaped
 *     text, never an element — mutation: render the body with `v-html`;
 * 14. clicking the download button **executes** the handler: it calls the
 *     authenticated route with the content slug and hands the blob to the
 *     saver — mutation: go back to a plain `<a href>` and nothing is fetched;
 *     drop the `v-if="content.document"` and the handler downloads a document
 *     that does not exist.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'
import { CONTENT_TYPE_FILTER_OPTIONS } from '../../app/features/contents/domain/content-options'
import { CLIENT_CONTENTS_SEARCH_MAX_LENGTH } from '../../app/features/contents/createClientContents'
import type { ClientContentListItem } from '../../app/features/contents/api/contents.contract'

const LIST_PAGE = 'app/pages/client/content/index.vue'
const READING_PAGE = 'app/pages/client/content/[slug].vue'

const LIST_COMPOSABLE = '../../../features/contents/useClientContents'
const READING_FACTORY = '../../../features/contents/createClientContent'
const READING_SERVICE = '../../../features/contents/services/client-contents.service'
const READING_SAVER = '../../../features/contents/services/document-download.browser'

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

const UButton = {
  name: 'UButton',
  props: ['to', 'variant', 'color', 'size', 'loading', 'leadingIcon', 'type', 'href', 'disabled', 'onClick'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('button', {
      'data-to': props.to ?? undefined,
      'data-href': props.href ?? undefined,
      'data-loading': props.loading === true ? 'true' : undefined,
      'disabled': props.disabled === true,
      'onClick': props.onClick
    }, slots.default?.() ?? [])
}

const NuxtLink = {
  name: 'NuxtLink',
  props: ['to'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('a', { href: String(props.to ?? '') }, slots.default?.() ?? [])
}

const UCard = {
  name: 'UCard',
  setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
    Vue.h('div', { 'data-stub': 'UCard' }, [...(slots.header?.() ?? []), ...(slots.default?.() ?? [])])
}

const UInput = {
  name: 'UInput',
  props: ['modelValue', 'maxlength', 'placeholder', 'autocomplete', 'icon'],
  setup: (props: Record<string, unknown>, { attrs }: { attrs: Record<string, unknown> }) => () =>
    Vue.h('input', {
      'value': props.modelValue ?? '',
      'maxlength': props.maxlength,
      'placeholder': props.placeholder,
      'autocomplete': props.autocomplete,
      'aria-label': attrs['aria-label']
    })
}

const USelect = {
  name: 'USelect',
  props: ['modelValue', 'items', 'aria-label'],
  setup: (props: Record<string, unknown>) => () =>
    Vue.h('div', { 'data-stub': 'USelect', 'aria-label': props['aria-label'] })
}

const UAlert = {
  name: 'UAlert',
  props: ['title', 'description', 'color', 'variant', 'icon'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('div', { 'data-stub': 'UAlert' }, [
      Vue.h('strong', {}, String(props.title ?? '')),
      Vue.h('p', {}, String(props.description ?? '')),
      ...(slots.actions?.() ?? [])
    ])
}

const UBadge = {
  name: 'UBadge',
  props: ['color', 'variant', 'size'],
  setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
    Vue.h('span', { 'data-stub': 'UBadge' }, slots.default?.() ?? [])
}

const AtomsDsPageHeader = {
  name: 'AtomsDsPageHeader',
  props: ['title', 'subtitle'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('header', {}, [
      Vue.h('h1', {}, String(props.title ?? '')),
      Vue.h('p', {}, String(props.subtitle ?? '')),
      ...(slots.default?.() ?? [])
    ])
}

const AtomsDsErrorState = {
  name: 'AtomsDsErrorState',
  props: ['message', 'retryLabel'],
  emits: ['retry'],
  setup: (props: Record<string, unknown>) => () =>
    Vue.h('div', { 'data-stub': 'AtomsDsErrorState' }, [
      Vue.h('p', {}, String(props.message ?? '')),
      Vue.h('button', { class: 'retry' }, String(props.retryLabel ?? 'Réessayer'))
    ])
}

const AtomsDsEmptyState = {
  name: 'AtomsDsEmptyState',
  props: ['icon', 'title', 'description'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('div', { 'data-stub': 'AtomsDsEmptyState' }, [
      Vue.h('h3', {}, String(props.title ?? '')),
      Vue.h('p', {}, String(props.description ?? '')),
      ...(slots.action?.() ?? [])
    ])
}

const STUBS = {
  AtomsDsPageHeader,
  AtomsDsErrorState,
  AtomsDsEmptyState,
  UButton,
  NuxtLink,
  UCard,
  UInput,
  USelect,
  UAlert,
  UBadge,
  UCard2: UCard,
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div', { 'data-stub': 'USkeleton' }) },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i', { 'data-stub': 'UIcon' }) }
}

function item(overrides: Partial<ClientContentListItem> = {}): ClientContentListItem {
  return {
    id: 'c1',
    title: 'Respirer pendant la périménopause',
    type: 'article',
    slug: 'respirer-pendant-la-perimenopause',
    coverImageUrl: null,
    publishedAt: '2026-02-05T10:00:00.000Z',
    providerName: 'Sophie Jouan',
    providerSlug: 'sophie-jouan',
    source: 'provider',
    document: null,
    ...overrides
  }
}

function readingContent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'c1',
    title: 'Respirer pendant la périménopause',
    type: 'article',
    slug: 'respirer-pendant-la-perimenopause',
    body: 'Premier paragraphe.\n\nSecond paragraphe.',
    coverImageUrl: null,
    publishedAt: '2026-02-05T10:00:00.000Z',
    providerName: 'Sophie Jouan',
    providerSlug: 'sophie-jouan',
    source: 'provider',
    document: null,
    ...overrides
  }
}

interface FakeListState {
  pending?: boolean
  errorMessage?: string | null
  items?: ClientContentListItem[]
  nextCursor?: string | null
  searchQuery?: string
  typeFilter?: string
  hasActiveFilters?: boolean
  loadMorePending?: boolean
  loadMoreErrorMessage?: string | null
}

function fakeContents(state: FakeListState) {
  return {
    pending: Vue.ref(state.pending ?? false),
    errorMessage: Vue.ref<string | null>(state.errorMessage ?? null),
    items: Vue.ref(state.items ?? []),
    nextCursor: Vue.ref<string | null>(state.nextCursor ?? null),
    searchQuery: Vue.ref(state.searchQuery ?? ''),
    typeFilter: Vue.ref(state.typeFilter ?? 'all'),
    hasActiveFilters: Vue.ref(state.hasActiveFilters ?? false),
    loadMorePending: Vue.ref(state.loadMorePending ?? false),
    loadMoreErrorMessage: Vue.ref<string | null>(state.loadMoreErrorMessage ?? null),
    refresh: () => Promise.resolve(),
    loadMore: () => Promise.resolve(),
    resetFilters: () => {},
    dispose: () => {}
  }
}

function renderList(
  state: FakeListState,
  inspect?: (instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<string> {
  return renderSfc(LIST_PAGE, {
    stubs: STUBS,
    globals: { definePageMeta: () => {} },
    mocks: { [LIST_COMPOSABLE]: { useClientContents: () => fakeContents(state) } },
    allowEmpty: true,
    inspect
  })
}

interface FakeReaderState {
  pending?: boolean
  notFound?: boolean
  errorMessage?: string | null
  content?: Record<string, unknown> | null
}

/** Records what the download handler did, without touching the DOM. */
interface DownloadRecorder {
  fetched: string[]
  saved: { filename: string, size: number }[]
  /** When true, the authenticated route rejects, as an expired session would. */
  fail?: boolean
}

function renderReading(
  state: FakeReaderState,
  inspect?: (instance: Vue.ComponentInternalInstance) => void | Promise<void>,
  downloads?: DownloadRecorder
): Promise<string> {
  return renderSfc(READING_PAGE, {
    stubs: STUBS,
    globals: {
      definePageMeta: () => {},
      useRoute: () => ({ params: { slug: 'respirer-pendant-la-perimenopause' } }),
      computed: Vue.computed,
      onMounted: Vue.onMounted,
      watch: Vue.watch
    },
    mocks: {
      [READING_FACTORY]: {
        createClientContent: () => ({
          pending: Vue.ref(state.pending ?? false),
          notFound: Vue.ref(state.notFound ?? false),
          errorMessage: Vue.ref<string | null>(state.errorMessage ?? null),
          content: Vue.ref(state.content ?? null),
          load: () => Promise.resolve()
        })
      },
      [READING_SERVICE]: {
        getClientContentBySlug: () => Promise.resolve({}),
        getClientContentDocument: (slug: string) => {
          downloads?.fetched.push(slug)
          if (downloads?.fail === true) return Promise.reject(new Error('network down'))
          return Promise.resolve(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))
        }
      },
      [READING_SAVER]: {
        saveDocumentBlob: (blob: Blob, filename: string) => {
          downloads?.saved.push({ filename, size: blob.size })
        }
      }
    },
    allowEmpty: true,
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

/** The click handler bound to the download control (its own leading icon). */
function findDownloadHandler(instance: Vue.ComponentInternalInstance): (() => Promise<void>) | null {
  let handler: (() => Promise<void>) | null = null
  walkVNodes(instance.subTree, (vnode) => {
    const props = vnode.props as Record<string, unknown> | null
    if (!props) return
    // A component resolved at runtime keeps the attribute name as written, so
    // the page's vnode carries `leading-icon`, not `leadingIcon`.
    const icon = props.leadingIcon ?? props['leading-icon']
    if (icon === 'i-lucide-download' && typeof props.onClick === 'function') {
      handler = props.onClick as () => Promise<void>
    }
  })
  return handler
}

describe('5.7 — /client/content renders its four states', () => {
  test('each accessible content is a real link carrying title, type, provider and a formatted date', async () => {
    const html = await renderList({
      items: [
        item(),
        item({ id: 'c2', title: 'Infusion de sauge', type: 'recette', slug: 'infusion-de-sauge', publishedAt: null })
      ]
    })

    assert.equal(html.includes('href="/client/content/respirer-pendant-la-perimenopause"'), true)
    assert.equal(html.includes('href="/client/content/infusion-de-sauge"'), true)
    assert.equal(html.includes('Respirer pendant la périménopause'), true)
    assert.equal(html.includes('Infusion de sauge'), true)
    assert.equal(html.includes('Article'), true)
    assert.equal(html.includes('Recette'), true)
    assert.equal(html.includes('Sophie Jouan'), true)
    assert.equal(html.includes('2026-02-05T10:00:00.000Z'), false, 'the raw ISO must be formatted')
    assert.equal(html.includes('2026'), true)
    assert.equal(html.includes('Aucun contenu disponible'), false)
  })

  test('a platform card is attributed to « Keova », never to a practitioner (AC1, AC7)', async () => {
    const html = await renderList({
      items: [item({ source: 'keova', providerName: null, providerSlug: null })]
    })

    assert.equal(html.includes('Keova'), true)
    assert.equal(html.includes('Sophie Jouan'), false, 'a platform article has no practitioner')
  })

  test('a practitioner card carries her name, and « Document » appears only with an attached PDF (AC1)', async () => {
    const withDocument = await renderList({
      items: [item({ document: { filename: 'guide.pdf', sizeBytes: 2048 } })]
    })
    const withoutDocument = await renderList({ items: [item()] })

    assert.equal(withDocument.includes('Sophie Jouan'), true)
    assert.equal(withDocument.includes('Document'), true)
    assert.equal(withoutDocument.includes('Document'), false, 'no document means no badge')
    assert.equal(
      withDocument.includes('guide.pdf'),
      false,
      'the card only signals a PDF; its detail belongs to the reading page'
    )
  })

  test('an empty catalogue says « Aucun contenu disponible » (AC3)', async () => {
    const html = await renderList({ items: [], hasActiveFilters: false })

    assert.equal(html.includes('Aucun contenu disponible'), true)
    assert.equal(html.includes('Aucun résultat'), false)
    assert.equal(html.includes('Réinitialiser les filtres'), false, 'nothing to reset when no filter is active')
  })

  test('a search that matches nothing says so and offers to reset the filters', async () => {
    const html = await renderList({ items: [], hasActiveFilters: true, searchQuery: 'zzz' })

    assert.equal(html.includes('Aucun résultat'), true)
    assert.equal(html.includes('Aucun contenu ne correspond à votre recherche.'), true)
    assert.equal(html.includes('Réinitialiser les filtres'), true)
    assert.equal(
      html.includes('Aucun contenu disponible'),
      false,
      'a filtered miss must not claim the whole catalogue is empty'
    )
  })

  test('a first-load failure renders the retry surface, never a blank screen', async () => {
    const html = await renderList({
      items: [],
      errorMessage: 'Impossible de charger les contenus. Veuillez réessayer.'
    })

    assert.equal(html.includes('data-stub="AtomsDsErrorState"'), true)
    assert.equal(html.includes('Impossible de charger les contenus. Veuillez réessayer.'), true)
    assert.equal(html.includes('Réessayer'), true)
    assert.equal(html.includes('Aucun contenu disponible'), false)
  })

  test('a refresh failure over an existing list keeps the list and warns instead of replacing it', async () => {
    const html = await renderList({
      items: [item()],
      errorMessage: 'Impossible de charger les contenus. Veuillez réessayer.'
    })

    assert.equal(html.includes('href="/client/content/respirer-pendant-la-perimenopause"'), true)
    assert.equal(html.includes('Actualisation impossible'), true)
    assert.equal(html.includes('data-stub="AtomsDsErrorState"'), false)
  })

  test('« Charger plus » appears only when a cursor is present', async () => {
    const withCursor = await renderList({ items: [item()], nextCursor: 'cursor-1' })
    const withoutCursor = await renderList({ items: [item()], nextCursor: null })

    assert.equal(withCursor.includes('Charger plus'), true)
    assert.equal(withoutCursor.includes('Charger plus'), false)
  })

  test('the type filter is fed by the shared vocabulary and the search is bounded', async () => {
    let selectItems: unknown
    const html = await renderList({ items: [] }, (instance) => {
      walkVNodes(instance.subTree, (vnode) => {
        const props = vnode.props as Record<string, unknown> | null
        if (props && props['aria-label'] === 'Filtrer par type') selectItems = props.items
      })
    })

    assert.deepEqual(selectItems, CONTENT_TYPE_FILTER_OPTIONS, 'the select must not carry its own copy')
    assert.equal(html.includes('aria-label="Rechercher par titre"'), true)
    assert.equal(html.includes('autocomplete="off"'), true)
    assert.equal(html.includes(`maxlength="${CLIENT_CONTENTS_SEARCH_MAX_LENGTH}"`), true)
  })
})

describe('5.7 — /client/content/:slug renders its four states', () => {
  test('a masked 404 is a dedicated surface with a way back, not a retry loop', async () => {
    const html = await renderReading({ notFound: true })

    assert.equal(html.includes('Contenu introuvable'), true)
    assert.equal(html.includes('Ce contenu n&#39;existe pas ou n&#39;est plus accessible.')
      || html.includes('Ce contenu n\'existe pas ou n\'est plus accessible.'), true)
    assert.equal(html.includes('data-stub="AtomsDsErrorState"'), false, 'a permanent 404 must not offer a retry')
    assert.equal(html.includes('data-to="/client/content"'), true)
  })

  test('a retryable failure renders the error surface with its message', async () => {
    const html = await renderReading({ errorMessage: 'Impossible de charger le contenu.' })

    assert.equal(html.includes('data-stub="AtomsDsErrorState"'), true)
    assert.equal(html.includes('Impossible de charger le contenu.'), true)
    assert.equal(html.includes('Contenu introuvable'), false)
  })

  test('the content draws its title, provider, date and body', async () => {
    const html = await renderReading({
      content: {
        id: 'c1',
        title: 'Respirer pendant la périménopause',
        type: 'article',
        slug: 'respirer-pendant-la-perimenopause',
        body: 'Premier paragraphe.\n\nSecond paragraphe.',
        coverImageUrl: null,
        publishedAt: '2026-02-05T10:00:00.000Z',
        providerName: 'Sophie Jouan',
        providerSlug: 'sophie-jouan'
      }
    })

    assert.equal(html.includes('<h1'), true)
    assert.equal(html.includes('Respirer pendant la périménopause'), true)
    assert.equal(html.includes('Par Sophie Jouan'), true)
    assert.equal(html.includes('2026-02-05T10:00:00.000Z'), false, 'the raw ISO must be formatted')
    assert.equal(html.includes('Premier paragraphe.'), true)
    assert.equal(html.includes('Second paragraphe.'), true)
    assert.equal(html.includes('Article'), true)
  })

  test('a null body and a null publication date render without a dangling separator', async () => {
    const html = await renderReading({
      content: {
        id: 'c1',
        title: 'Brouillon partagé',
        type: 'actualite',
        slug: 'brouillon-partage',
        body: null,
        coverImageUrl: null,
        publishedAt: null,
        providerName: 'Sophie Jouan',
        providerSlug: 'sophie-jouan'
      }
    })

    assert.equal(html.includes('Aucun contenu.'), true)
    assert.equal(html.includes('Par Sophie Jouan'), true)
    assert.equal(html.includes('·'), false, 'no separator without a date')
  })

  test('a platform content is attributed to Keova, never to a practitioner (AC7)', async () => {
    const html = await renderReading({
      content: readingContent({ source: 'keova', providerName: null, providerSlug: null })
    })

    assert.equal(html.includes('Par Keova'), true)
    assert.equal(html.includes('Sophie Jouan'), false, 'a platform article has no practitioner')
  })

  test('the document button exists only with a document, and the DOM carries no storage URL (AC2)', async () => {
    const withDocument = await renderReading({
      content: readingContent({ document: { filename: 'guide.pdf', sizeBytes: 2048 } })
    })
    const withoutDocument = await renderReading({ content: readingContent() })

    assert.equal(withDocument.includes('Télécharger le document'), true)
    assert.equal(withoutDocument.includes('Télécharger le document'), false, 'no document, no button')
    for (const html of [withDocument, withoutDocument]) {
      assert.equal(/https?:\/\//.test(html), false, 'no storage URL may reach the DOM')
      assert.equal(html.includes('guide.pdf'), false, 'the stored filename is not rendered as a URL')
    }
  })

  test('a URL in the body is a link opened in a new tab, with rel and screen-reader text (AC3)', async () => {
    const html = await renderReading({
      content: readingContent({ body: 'Voir https://exemple.fr/article. Puis autre chose.' })
    })

    assert.equal(html.includes('href="https://exemple.fr/article"'), true)
    assert.equal(html.includes('target="_blank"'), true)
    assert.equal(html.includes('rel="noopener noreferrer"'), true)
    assert.equal(html.includes('(nouvel onglet)'), true)
    assert.equal(
      html.includes('href="https://exemple.fr/article."'),
      false,
      'the sentence full stop is not part of the URL'
    )
  })

  test('a javascript: payload and raw markup in the body stay inert, escaped text (AC4)', async () => {
    const html = await renderReading({
      content: readingContent({
        body: 'javascript:alert(1)\n<script>alert(2)</script>\n<img src=x onerror=alert(3)>\nwww.exemple.fr'
      })
    })

    assert.equal(html.includes('href="javascript'), false)
    assert.equal(html.includes('href="www.exemple.fr'), false)
    assert.equal(html.includes('<script>'), false, 'the body must never be interpreted as HTML')
    assert.equal(html.includes('&lt;script&gt;'), true, 'it must be escaped and shown as text')
    assert.equal(html.includes('<img src=x'), false)
  })

  test('clicking « Télécharger le document » calls the authenticated route and saves the file (AC2)', async () => {
    const downloads: DownloadRecorder = { fetched: [], saved: [] }
    const captured: { handler: (() => Promise<void>) | null } = { handler: null }

    await renderReading(
      { content: readingContent({ document: { filename: 'guide.pdf', sizeBytes: 2048 } }) },
      (instance) => {
        captured.handler = findDownloadHandler(instance)
      },
      downloads
    )

    assert.equal(typeof captured.handler, 'function', 'the control must be clickable')
    await captured.handler!()

    assert.deepEqual(
      downloads.fetched,
      ['respirer-pendant-la-perimenopause'],
      'the authenticated route is called with the content slug'
    )
    assert.equal(downloads.saved.length, 1)
    assert.equal(downloads.saved[0]!.filename, 'guide.pdf')
    assert.equal(downloads.saved[0]!.size > 0, true, 'the fetched document is what gets saved')
  })

  test('a failed download surfaces a retryable message, saves nothing and keeps the page (AC2)', async () => {
    const downloads: DownloadRecorder = { fetched: [], saved: [], fail: true }
    const captured: { handler: (() => Promise<void>) | null } = { handler: null }
    const exposed: { state: Record<string, unknown> | null } = { state: null }

    await renderReading(
      { content: readingContent({ document: { filename: 'guide.pdf', sizeBytes: 2048 } }) },
      (instance) => {
        captured.handler = findDownloadHandler(instance)
        exposed.state = (instance as unknown as { setupState: Record<string, unknown> }).setupState
      },
      downloads
    )

    await captured.handler!()

    assert.deepEqual(downloads.fetched, ['respirer-pendant-la-perimenopause'])
    assert.equal(downloads.saved.length, 0, 'a failed fetch must not produce a file')
    assert.equal(
      exposed.state!.downloadErrorMessage,
      'Le téléchargement du document a échoué. Veuillez réessayer.'
    )
  })

  test('the loading state draws skeletons and neither the article nor the not-found copy', async () => {
    const html = await renderReading({ pending: true })

    assert.equal(html.includes('data-stub="USkeleton"'), true)
    assert.equal(html.includes('Contenu introuvable'), false)
    assert.equal(html.includes('data-stub="AtomsDsErrorState"'), false)
  })
})

test('the two pages import their state modules explicitly (AGENTS §11.6)', () => {
  // An auto-imported tag that Nuxt cannot resolve renders nothing, silently.
  // These two imports are what keeps the pages reachable by this harness — and
  // therefore by a test at all.
  const list = fs.readFileSync(path.resolve(process.cwd(), LIST_PAGE), 'utf-8')
  const reading = fs.readFileSync(path.resolve(process.cwd(), READING_PAGE), 'utf-8')

  assert.match(list, /import\s*\{\s*useClientContents\s*\}\s*from\s*'[^']*useClientContents'/)
  assert.match(reading, /import\s*\{\s*createClientContent\s*\}\s*from\s*'[^']*createClientContent'/)
  assert.equal(/await\s+useClientContents\(\)/.test(list), false, 'an async setup would render nothing under SSR')
})
