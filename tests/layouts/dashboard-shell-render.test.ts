/**
 * Regression guard for the dashboard shell (story diffusion-9, AC5 gate).
 *
 * Why this file exists: `523135d` moved the active-route rule into
 * `isItemActive`, which reads `allNavItems`, while the `watch(..., { immediate:
 * true })` that calls it stayed *above* that `computed`. An `immediate` watcher
 * runs during `setup()`, so every shell mount threw
 * `ReferenceError: Cannot access 'allNavItems' before initialization` and the
 * client and provider dashboards rendered nothing — the whole `/client/**` and
 * `/provider/**` navigation was dead in the browser, with no failing test.
 *
 * The harness rethrows whichever error `setup()` raises, so this renders the
 * real SFC and fails if the declaration order breaks again. Mutation: move
 * `allNavItems` back under the watcher and this test fails with the ReferenceError.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const SHELL = 'app/components/templates/DashboardShell.vue'
const CURRENT_USER = '../../features/auth/useCurrentUser'
const LEGAL_FOOTER = '../atoms/LegalFooterLinks.vue'

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

function stub(name: string, tag = 'div') {
  return {
    name,
    props: ['to', 'label', 'alt', 'text', 'items', 'color', 'variant', 'size', 'icon', 'leadingIcon', 'trailingIcon', 'ui'],
    setup: (_props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
      Vue.h(tag, { 'data-stub': name }, slots.default?.() ?? [])
  }
}

const STUBS = {
  UAvatar: stub('UAvatar', 'span'),
  UBadge: stub('UBadge', 'span'),
  UButton: stub('UButton', 'button'),
  UDropdownMenu: stub('UDropdownMenu', 'div'),
  UIcon: stub('UIcon', 'i'),
  ULink: stub('ULink', 'a')
}

const NAVIGATION = {
  home: { label: 'Tableau de bord', to: '/client/dashboard', icon: 'i-lucide-home', match: 'exact' },
  groups: [
    {
      key: 'content',
      label: 'Contenus',
      defaultOpen: true,
      items: [
        { label: 'Ressources', to: '/client/content', icon: 'i-lucide-file-text', match: 'prefix' }
      ]
    }
  ]
}

function renderShell(routePath: string): Promise<string> {
  return renderSfc(SHELL, {
    props: {
      brandLabel: 'Keova',
      brandTo: '/client/dashboard',
      sidebarLabel: 'Client',
      navigation: NAVIGATION
    },
    stubs: STUBS,
    mocks: {
      [CURRENT_USER]: {
        useCurrentUser: () => ({
          email: Vue.ref('marie.dupont.0@demo.keova.test'),
          initials: Vue.ref('MD'),
          displayName: Vue.ref('Marie D.')
        })
      },
      [LEGAL_FOOTER]: {
        name: 'LegalFooterLinks',
        setup: () => () => Vue.h('footer', { 'data-stub': 'LegalFooterLinks' })
      }
    },
    globals: {
      ref: Vue.ref,
      computed: Vue.computed,
      watch: Vue.watch,
      onMounted: Vue.onMounted,
      onBeforeUnmount: Vue.onBeforeUnmount,
      useAuth: () => ({ logout: async () => {} }),
      useRoute: () => ({
        path: routePath,
        fullPath: routePath,
        params: {},
        meta: { pageTitle: 'Ressources' }
      })
    }
  })
}

test('the shell mounts without throwing — its immediate watcher runs after allNavItems exists', async () => {
  const html = await renderShell('/client/content')

  assert.equal(html.includes('Tableau de bord'), true, 'the home entry is rendered')
  assert.equal(html.includes('Ressources'), true, 'the group entries are rendered')
  assert.equal(html.includes('Marie D.'), true, 'the current user label is rendered')
})

test('the shell marks the active entry of its nested route', async () => {
  const html = await renderShell('/client/content')

  assert.equal(html.includes('aria-current'), true, 'the current route is announced, not only coloured')
})
