import * as assert from 'node:assert/strict'
import * as Vue from 'vue'
import test, { describe } from 'node:test'

import { DOCK_CLEARANCE_CLASSES } from '../../app/features/pages/domain/dock-clearance'
import { renderSfc } from '../helpers/render-sfc'

/**
 * Hotfix 26 — l'espace du dock flottant est réservé sur les deux routes de page
 * dynamique, et il l'est **depuis la constante partagée**.
 *
 * La preuve est un rendu réel des deux pages (`tests/helpers/render-sfc.ts`) :
 * une assertion sur le source resterait verte si le `class` du conteneur
 * cessait de lire `DOCK_CLEARANCE_CLASSES`, et ne dirait rien de l'élément qui
 * porte réellement l'espace. Les deux pages importent la vraie constante et
 * sont rendues avec leurs composables Nuxt injectés, donc :
 *
 * - retirer `DOCK_CLEARANCE_CLASSES` du `:class` du conteneur ⇒ le test tombe
 *   (c'est la mutation de non-vacuité, jouée en revue) ;
 * - vider la constante ⇒ le test tombe aussi (`pt-32`/`sm:pt-40` épinglés) ;
 * - recopier la chaîne en dur dans un template ⇒ le test tombe dès que la
 *   constante évolue, ce qui est exactement la divergence à empêcher.
 */

const WHITE_LABEL_PAGE = 'app/pages/[...slug].vue'
const PLATFORM_PAGE = 'app/pages/coach/[slug]/[pageSlug].vue'

const PAGE_FIXTURE = {
  slug: 'accompagnement',
  title: 'Accompagnement',
  contentBlocks: [],
  includeInMenu: true,
  menuLabel: null,
  sortOrder: 0,
  publishedAt: '2026-11-01T00:00:00.000Z',
  version: 1
}

const TENANT_FIXTURE = {
  slug: 'sophie-jouan',
  displayName: 'Sophie Jouan',
  brand: {
    displayName: 'Sophie Jouan',
    domain: 'sophiejouan.test',
    color: null,
    logoUrl: null
  }
}

const BLOCK_RENDERER_STUBS = {
  BlockText: Vue.defineComponent({ name: 'BlockText', setup: () => () => Vue.h('div') }),
  BlockImage: Vue.defineComponent({ name: 'BlockImage', setup: () => () => Vue.h('div') })
}

/** Globals Nuxt lus par les deux pages (auto-imports absents du runtime de test). */
function createGlobals(requestUrl: string, params: Record<string, string>): Record<string, unknown> {
  return {
    computed: Vue.computed,
    ref: Vue.ref,
    watch: Vue.watch,
    definePageMeta: () => {},
    useRoute: () => ({ params }),
    useRequestURL: () => new URL(requestUrl),
    useRuntimeConfig: () => ({
      public: { platformDomain: 'keova.fr', platformDomainB2B: 'keova.app' }
    }),
    useAsyncData: async (_key: string, handler: () => Promise<unknown>) => ({
      data: Vue.ref(await handler()),
      error: Vue.ref(null)
    }),
    useSeoMeta: () => {},
    useSchemaOrg: () => {},
    defineWebPage: () => ({}),
    defineBreadcrumb: () => ({}),
    usePublicCanonicalHead: () => {},
    useBrandColorInjection: () => {},
    setPublicHeader: () => {},
    createError: (input: { statusCode: number, statusMessage: string }) =>
      Object.assign(new Error(input.statusMessage), input)
  }
}

/** Modules remplacés : réseau, état global et menus, jamais le domaine testé. */
function createMocks(): Record<string, unknown> {
  const tenantModule = async () => ({ data: Vue.ref(TENANT_FIXTURE) })
  return {
    '~/services/api/apiFetch': {
      apiFetch: async () => PAGE_FIXTURE
    },
    '~/services/api/api-error': {
      ApiFetchError: class ApiFetchError extends Error {}
    },
    '~/composables/usePublicTenantHome': { usePublicTenantHome: tenantModule },
    '~/composables/usePublicTenant': { usePublicTenant: tenantModule },
    '~/composables/usePublicPagesMenu': {
      usePublicPagesMenu: async () => ({ menuPages: Vue.ref([]) })
    },
    '~/features/public/state/public-header.state': {
      setPublicHeader: () => {},
      usePublicHeaderState: () => Vue.ref({})
    }
  }
}

/** Classes du premier élément rendu — le conteneur de page est la racine du template. */
function containerClasses(html: string): string[] {
  const root = /<div\b[^>]*\bclass="([^"]*)"/.exec(html)
  if (!root) throw new Error(`aucun conteneur <div class> dans le rendu : ${html.slice(0, 200)}`)
  return root[1].split(/\s+/).filter(Boolean)
}

async function renderPage(page: string, requestUrl: string, params: Record<string, string>): Promise<string> {
  return await renderSfc(page, {
    stubs: BLOCK_RENDERER_STUBS,
    mocks: createMocks(),
    globals: createGlobals(requestUrl, params)
  })
}

/**
 * L'espace réservé doit rester celui de la constante : c'est la seule assertion
 * qui tombe si un template recopie la chaîne en dur et que la constante évolue,
 * et la seule qui tombe si l'espace est retiré.
 */
async function assertDockClearanceIsApplied(page: string, requestUrl: string, params: Record<string, string>, label: string) {
  const html = await renderPage(page, requestUrl, params)

  assert.match(html, /<h1\b/, `${label} : le titre doit être rendu`)
  assert.ok(
    html.trimStart().startsWith('<div'),
    `${label} : le conteneur de page doit être l'élément racine (porteur de l'espace dock)`
  )

  const classes = containerClasses(html)
  const expected = DOCK_CLEARANCE_CLASSES.split(/\s+/).filter(Boolean)
  assert.ok(expected.length > 0, 'la constante partagée ne peut pas être vide')

  for (const token of expected) {
    assert.ok(
      classes.includes(token),
      `${label} : le conteneur doit porter « ${token} » depuis DOCK_CLEARANCE_CLASSES, rendu = ${classes.join(' ')}`
    )
  }

  const headerIndex = html.indexOf('<header')
  assert.ok(headerIndex > 0, `${label} : le titre vit dans un <header>`)
  assert.ok(
    html.indexOf('<h1') > headerIndex,
    `${label} : le H1 doit rester dans le conteneur espacé, sous le dock`
  )
}

describe('hotfix 26 — espace réservé au dock flottant', () => {
  test('la constante partagée couvre le dock (Espace des deux routes)', () => {
    const tokens = DOCK_CLEARANCE_CLASSES.split(/\s+/).filter(Boolean)
    assert.ok(tokens.includes('pt-32'), `espace mobile attendu pt-32, constante = ${DOCK_CLEARANCE_CLASSES}`)
    assert.ok(tokens.includes('sm:pt-40'), `espace desktop attendu sm:pt-40, constante = ${DOCK_CLEARANCE_CLASSES}`)
  })

  test('white-label : le conteneur de /:pageSlug rendu porte la constante', async () => {
    await assertDockClearanceIsApplied(
      WHITE_LABEL_PAGE,
      'https://sophiejouan.test/accompagnement',
      { slug: 'accompagnement' },
      'white-label /accompagnement'
    )
  })

  test('plateforme : le conteneur de /coach/:slug/:pageSlug rendu porte la constante', async () => {
    await assertDockClearanceIsApplied(
      PLATFORM_PAGE,
      'https://keova.fr/coach/sophie-jouan/accompagnement',
      { slug: 'sophie-jouan', pageSlug: 'accompagnement' },
      'plateforme /coach/sophie-jouan/accompagnement'
    )
  })
})
