/**
 * Story diffusion-14 — the practitioner's Keova article preview, rendered by
 * the real SFC harness (AC2 and AC3).
 *
 * Why a mounted test and not a source regex: the defect the human review found
 * on 2026-11-24 was invisible to every gate. `USlideover` in Nuxt UI v4 renders
 * its **default slot** as the panel's trigger (`DialogTrigger` in
 * `node_modules/@nuxt/ui/dist/runtime/components/Slideover.vue`) and paints
 * `<slot name="body">` into the panel; the article sat in the default slot, so
 * the panel showed its title and nothing else. A `readFileSync` assertion on
 * `keova.vue` would have gone green on that markup — the stub below reproduces
 * the real slot contract, so a body left in the default slot never reaches the
 * panel and these tests fail.
 *
 * Mutations this file kills:
 * - move the article back into the default slot → `body reaches the panel` fails;
 * - drop the `v-if="previewItem.document"` block → the document test fails;
 * - render the document block unconditionally → the no-document test fails;
 * - drop the body fallback → the "Aucun contenu." test fails;
 * - put the wrong formatter on `sizeBytes` → the `180.0 Ko` assertion fails.
 */
import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { formatFileSize } from '../../app/features/contents/domain/file-size'
import type { PlatformContentItem } from '../../app/features/contents/api/contents.contract'
import { renderSfc } from '../helpers/render-sfc'

const PAGE = 'app/pages/provider/content/keova.vue'
const FACTORY = path.resolve(process.cwd(), 'app/features/contents/createPlatformContents.ts')
const SERVICE = path.resolve(process.cwd(), 'app/features/contents/services/platform-contents.service.ts')

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

const UButton = {
  name: 'UButton',
  props: ['variant', 'color', 'size', 'loading', 'disabled', 'onClick', 'type'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
    Vue.h('button', {
      'data-component': 'UButton',
      'onClick': props.onClick as (() => void) | undefined
    }, slots.default?.() ?? [])
}

const UCard = {
  name: 'UCard',
  setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
    Vue.h('div', { 'data-component': 'UCard' }, [...(slots.header?.() ?? []), ...(slots.default?.() ?? [])])
}

const UBadge = {
  name: 'UBadge',
  props: ['color', 'variant', 'size'],
  setup: (_props: unknown, { slots }: { slots: SlotMap }) => () =>
    Vue.h('span', { 'data-component': 'UBadge' }, slots.default?.() ?? [])
}

/**
 * Nuxt UI v4's `USlideover`, reduced to its slot contract — the part the defect
 * was made of. `#body` is the panel; the default slot is the *trigger* and is
 * deliberately not rendered inside the panel.
 */
const USlideover = {
  name: 'USlideover',
  props: ['open', 'title', 'description'],
  setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () => {
    if (props.open !== true) return null
    return Vue.h('section', { 'data-testid': 'preview-panel' }, [
      Vue.h('h2', { 'data-testid': 'preview-title' }, String(props.title ?? '')),
      Vue.h('div', { 'data-testid': 'preview-body' }, slots.body?.() ?? [])
    ])
  }
}

const STUBS = {
  UButton,
  UCard,
  UBadge,
  USlideover,
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div', { 'data-component': 'USkeleton' }) },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i', { 'data-component': 'UIcon' }) },
  UAlert: {
    name: 'UAlert',
    props: ['title', 'description', 'color', 'variant', 'icon'],
    setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
      Vue.h('div', { 'data-component': 'UAlert' }, [
        Vue.h('p', {}, String(props.title ?? '')),
        ...(slots.actions?.() ?? [])
      ])
  }
}

function item(overrides: Partial<PlatformContentItem> = {}): PlatformContentItem {
  return {
    id: 'a1',
    title: 'Comprendre la périménopause',
    type: 'article',
    slug: 'comprendre-la-perimenopause',
    body: 'Premier paragraphe.\n\nSecond paragraphe.',
    coverImageUrl: 'https://cdn.example/cover.webp',
    isPublished: true,
    publishedAt: '2026-11-01T00:00:00.000Z',
    approved: false,
    document: null,
    ...overrides
  }
}

interface PreviewState {
  items: PlatformContentItem[]
  previewItem: PlatformContentItem | null
}

function fakeContents(state: PreviewState, opened: string[]) {
  const previewItem = Vue.ref<PlatformContentItem | null>(state.previewItem)
  return {
    previewItem,
    pending: Vue.ref(false),
    errorMessage: Vue.ref<string | null>(null),
    items: Vue.ref(state.items),
    nextCursor: Vue.ref<string | null>(null),
    loadMorePending: Vue.ref(false),
    loadMoreErrorMessage: Vue.ref<string | null>(null),
    approvingIds: Vue.ref(new Set<string>()),
    refresh: () => Promise.resolve(),
    loadMore: () => Promise.resolve(),
    approveItem: () => Promise.resolve(),
    withdrawItem: () => Promise.resolve(),
    openPreview: (target: PlatformContentItem) => {
      opened.push(target.id)
      previewItem.value = target
    },
    closePreview: () => {
      previewItem.value = null
    }
  }
}

function renderPage(
  state: PreviewState,
  opened: string[] = [],
  inspect?: (instance: Vue.ComponentInternalInstance) => void | Promise<void>
): Promise<string> {
  return renderSfc(PAGE, {
    stubs: STUBS,
    globals: { definePageMeta: () => {}, useToast: () => ({ add: () => {} }) },
    mocks: {
      [FACTORY]: { createPlatformContents: () => fakeContents(state, opened) },
      [SERVICE]: {
        listPlatformContents: async () => ({ items: [], nextCursor: null }),
        approvePlatformContent: async (id: string) => ({ contentId: id, approved: true }),
        withdrawPlatformApproval: async (id: string) => ({ contentId: id, approved: false })
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
      if (child && typeof child === 'object' && 'type' in child) walkVNodes(child as Vue.VNode, visit)
    }
  }
  walkVNodes(vnode.component?.subTree, visit)
}

/** The text a vnode renders, flattened — used to tell the buttons apart. */
function vnodeText(vnode: Vue.VNode | null | undefined): string {
  if (!vnode) return ''
  const children = vnode.children
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map((child) => {
      if (typeof child === 'string') return child
      if (child && typeof child === 'object' && 'type' in child) return vnodeText(child as Vue.VNode)
      return ''
    }).join(' ')
  }
  return ''
}

/**
 * Only what the panel itself renders.
 *
 * Asserting on the whole page would be a false green: the list card already
 * prints an excerpt of the body, so `html.includes('Premier paragraphe.')` stays
 * true even when the article never reaches the panel — the exact defect.
 */
function panelHtml(html: string): string {
  const start = html.indexOf('data-testid="preview-panel"')
  if (start === -1) return ''
  const end = html.indexOf('</section>', start)
  return end === -1 ? html.slice(start) : html.slice(start, end)
}

describe('the preview panel receives the article (AC2)', () => {
  test('the body reaches the panel through `#body`, not the default slot', async () => {
    const html = await renderPage({ items: [item()], previewItem: item() })
    const panel = panelHtml(html)

    assert.equal(panel.length > 0, true)
    assert.equal(panel.includes('Comprendre la périménopause'), true, 'the panel carries the title')
    assert.equal(panel.includes('Premier paragraphe.'), true, 'the body must reach the panel')
    assert.equal(panel.includes('Second paragraphe.'), true, 'line breaks survive')
    assert.equal(panel.includes('https://cdn.example/cover.webp'), true, 'the cover is part of the preview')
  })

  test('a closed preview paints no panel at all', async () => {
    const html = await renderPage({ items: [item()], previewItem: null })

    assert.equal(html.includes('data-testid="preview-panel"'), false)
    assert.equal(html.includes('data-testid="preview-title"'), false, 'no panel, no preview title')
    // The card shows the excerpt only: the body text appears once, not twice.
    assert.equal((html.match(/Premier paragraphe\./g) ?? []).length, 1)
  })

  test('an article without body says so inside the panel instead of showing nothing', async () => {
    const html = await renderPage({ items: [item({ body: null })], previewItem: item({ body: null }) })
    const panel = panelHtml(html)

    assert.equal(panel.length > 0, true)
    assert.equal(panel.includes('Aucun contenu.'), true)
  })

  test('"Aperçu" opens the item it belongs to', async () => {
    const opened: string[] = []
    let previewHandler: (() => void) | undefined

    await renderPage({ items: [item()], previewItem: null }, opened, (instance) => {
      walkVNodes(instance.subTree, (vnode) => {
        if (vnodeText(vnode).trim() !== 'Aperçu') return
        const props = vnode.props as Record<string, unknown> | null
        if (typeof props?.onClick === 'function') previewHandler = props.onClick as () => void
      })
    })

    assert.equal(typeof previewHandler, 'function', 'the "Aperçu" button must be wired')
    previewHandler?.()
    assert.deepEqual(opened, ['a1'])
  })
})

describe('the preview shows the attached document (AC3)', () => {
  test('name, size and where it opens are displayed when a document is attached', async () => {
    const withDocument = item({ document: { filename: 'programme-perimenopause.pdf', sizeBytes: 184320 } })
    const html = await renderPage({ items: [withDocument], previewItem: withDocument })
    const panel = panelHtml(html)

    assert.equal(panel.includes('data-testid="preview-document"'), true)
    assert.equal(panel.includes('programme-perimenopause.pdf'), true, 'the filename is part of the preview')
    assert.equal(panel.includes('180.0 Ko'), true, 'the size is formatted, not raw bytes')
    assert.equal(panel.includes('184320'), false, 'no raw byte count in the DOM')
    assert.equal(
      panel.includes('Ce document accompagne l’article : vos clientes le téléchargent depuis leur espace.'),
      true,
      'the preview names where the document opens'
    )
  })

  test('an article without document shows no document block', async () => {
    const html = await renderPage({ items: [item()], previewItem: item() })
    const panel = panelHtml(html)

    assert.equal(panel.length > 0, true)
    assert.equal(panel.includes('data-testid="preview-document"'), false)
    assert.equal(panel.includes('Ce document accompagne l’article'), false)
  })
})

describe('formatFileSize — one formatting for every contents surface', () => {
  test('bytes, kilobytes and megabytes keep one decimal where it matters', () => {
    assert.equal(formatFileSize(512), '512 o')
    assert.equal(formatFileSize(2048), '2.0 Ko')
    assert.equal(formatFileSize(184320), '180.0 Ko')
    assert.equal(formatFileSize(2 * 1024 * 1024), '2.0 Mo')
  })
})
