import * as assert from 'node:assert/strict'
import test from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/organisms/ContentSharesSection.vue'

const STUBS = {
  UCard: { name: 'UCard', setup: (_p: unknown, { slots }: { slots: Record<string, () => Vue.VNodeChild> }) => () => Vue.h('div', { 'data-stub': 'UCard' }, [slots.header?.(), slots.default?.()]) },
  UButton: { name: 'UButton', props: { label: String }, setup: (p: any, { slots }: { slots: Record<string, () => Vue.VNodeChild> }) => () => Vue.h('button', {}, p.label || slots.default?.()) },
  UInput: { name: 'UInput', setup: () => () => Vue.h('input') },
  UModal: { name: 'UModal', setup: (_p: unknown, { slots }: { slots: Record<string, () => Vue.VNodeChild> }) => () => Vue.h('div', { 'data-stub': 'UModal' }, [slots.header?.(), slots.body?.(), slots.footer?.()]) },
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') },
  AtomsDsErrorState: { name: 'AtomsDsErrorState', setup: () => () => Vue.h('div') }
}

function mockApiFetch() {
  return async (url: string) => {
    if (url.includes('/shares')) {
      return { items: [{ clientProfileId: 'c1', firstname: 'Alice', lastname: 'Durand', sharedAt: '2026-01-01T00:00:00.000Z' }] }
    }
    if (url.includes('/provider/clients')) {
      return { items: [], page: { limit: 20, nextCursor: null } }
    }
    return {}
  }
}

test('ContentSharesSection renders nothing when visibility is public', async () => {
  const html = await renderSfc(COMP, {
    props: { contentId: 'content-1', visibility: 'public' },
    stubs: STUBS,
    globals: { useToast: () => ({ add: () => {} }) },
    mocks: { '~/services/api/apiFetch': { apiFetch: mockApiFetch() } },
    allowEmpty: true
  })
  assert.equal(html.includes('Partage'), false)
})

test('ContentSharesSection renders shared list when visibility is private', async () => {
  const html = await renderSfc(COMP, {
    props: { contentId: 'content-1', visibility: 'private' },
    stubs: STUBS,
    globals: { useToast: () => ({ add: () => {} }) },
    mocks: { '~/services/api/apiFetch': { apiFetch: mockApiFetch() } }
  })
  assert.equal(html.includes('Partage'), true)
  assert.equal(html.includes('Ajouter un client'), true)
  assert.equal(html.includes('Partager avec tous'), true)
  assert.equal(html.includes('Partager avec tous'), true)
  assert.equal(html.includes('Ajouter un client'), true)
})
